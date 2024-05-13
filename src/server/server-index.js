import express from 'express';
const app = express();
import bodyParser from 'body-parser';
app.use(bodyParser.json());
app.use(express.json());
import { send_component } from "/app/shared/mjs/component_builder.mjs";
import { calc_distribution } from './distribution-algorithm.mjs';

//node.js [lower_type] [higher_type]
var args = process.argv.slice(2);
let energyRightNow = [];
let energyRightNowBuffer = [];
let temp={}
let __dirname = "/app";

let Keys = [];

app.use('/shared', express.static(__dirname + '/shared'));
let data = {
    "Server-type": "Central",
    "Status": "online",
    "Key": "257052945",
    "lower_type": args[0],
    "higher_type": args[1],
    "distribution_functions": {"full": 0, "proc": 1, "max": 2, "min": 3, "empty": 4}
}
//Array of different "servers"
let serverArray = [];
//setInterval(ServerCommander, 5000)

function GetNewKey() {
    let Key = (Keys.length * 2) + 3;//should be changed to a better key system
    //let Key = key.toString;
    Keys.push(Key);
    return Key;
}
async function GiveCommand(key, command, rate = 0){
    let FetchIP = "http://" + (serverArray.find((element) => element.Key == key).IP + "/api/takecommand")
    let Body = JSON.stringify({
        "Key": data.Key,
        "Command": command
    })
    if (rate != 0) {
        Body = JSON.stringify({
            "Key": data.Key,
            "Command": command,
            "Rate": rate
        })
    }
    const response = await fetch(FetchIP, {
        method: "POST",
        body: Body,
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    });
    const servers = await response.json()
    let serverI = serverArray.findIndex((element) => element.Key == servers.Key)
    serverArray[serverI].LastKnownPercentage = servers.CurrentFill
    serverArray[serverI].State = servers.Status
}

async function ServerCommander(current_mwh){
    let current_kwh = -1 * current_mwh;
    //TODO: somone: get kwh from energi.net
    //TODO: somone: check if data is new or old
    if (serverArray.length > 0){
        let distribution = calc_distribution(serverArray, current_kwh, data.lower_type, data.higher_type)
        distribution.forEach(element => {
            if ((element.current_input > 0 )||( element.current_input < 0)){
                GiveCommand(element.Key, "Charge", element.current_input)
            }
            else if (element.current_input == 0){
                GiveCommand(element.Key, "Stop")
            }
        });
    } else {
        console.log("ERROR", "no known servers")
    }
}

async function getData(startdate,enddate) {
    energyRightNowBuffer = [];
    const energinet_url = `https://api.energidataservice.dk/dataset/PowerSystemRightNow?offset=0&start=${startdate}&end=${enddate}&sort=Minutes1UTC%20ASC`
    const energinet_data_promise = new Promise(resolve => fetch(energinet_url).then((response) => resolve(response.json())));
    console.log("fetching energinet data");
    const energinet_data = await energinet_data_promise;
    console.log("fetched energinet data");
    energinet_data.records.forEach(record => {
        energyRightNowBuffer.push({
            "Minutes1UTC": record.Minutes1UTC,
            "Minutes1DK": record.Minutes1DK,
            "ProductionGe100MW": record.ProductionGe100MW,
            "ProductionLt100MW": record.ProductionLt100MW,
            "SolarPower": record.SolarPower,
            "OffshoreWindPower": record.OffshoreWindPower,
            "OnshoreWindPower": record.OnshoreWindPower,
            "Exchange_Sum": record.Exchange_Sum
        })
    })
}

async function start_simulation (req) {
    await getData(req.body.firstDate,req.body.secondDate);
    for (let i = 0; i < energyRightNowBuffer.length; i++) {
        energyRightNow.unshift(energyRightNowBuffer[i]);
        await ServerCommander(energyRightNowBuffer[i].Exchange_Sum);
    }
}


app.get("/", function (request, res) {
    const filename = '/sites/dashboard.html'
    res.sendFile(__dirname + filename, function (err) {
        if (err) {
            console.log("Error sending file:", err)
        } else {
            console.log("Sent:", filename)
        }
    })
})



app.post("/fetch/component", function (request, response) {
    response.send(send_component(request.body, __dirname));
})

app.post("/internal/algorithm_update", function (request, response) {
    console.log(request.body);
    data[request.body.type] = request.body.algorithm_mode;
    console.log(data);
    response.sendStatus(200);
})

app.get("/internal/algorithm_functions", function (request, response) {
    response.json(data);
})

app.post("/api/shake", function (req, res) {
    //console.log("Data from client", req.body);
    if (req.body["Key"] == null) {
        let NewKey = GetNewKey();
        res.json({
            "Status": data.Status,
            "NewKey": NewKey,
            "ServerKey": data.Key
        });
      
        serverArray.push({
            "Key": NewKey,
            "Name": req.body["Name"],
            "LastKnownPercentage": req.body["CurrentFill"],
            "State": req.body["Status"],
            "IP": req.body["IP"],
            "LowerBound": req.body["LBound"],
            "MaxChargeRate": req.body["MaxChargeRate"],
            "MaxDischarge": req.body["MaxDischarge"],
            "MaxDischargeRate": req.body["MaxDischargeRate"],
            "MaxCapacity": req.body["MaxCapacity"]
        })
    }
    else if (Keys.includes(req.body["Key"])) {
        res.json({
            "Status": data.Status,
            "Key": data.Key
        });
        //console.log("data saved", serverArray);
    }
    else { //the client has key but it is not one of ours
        res.json({
            "Error": "wrong key"
        })
    }
})
// This is the endpoint to get the array of servers
app.get('/api/servers', (req, res) => { // 
    res.json(serverArray);
});
// endpoint to update the state of a server
app.post('/api/updateServers', (req, res) => {
    console.log(req.body);
    serverArray.forEach(server =>{
        if (server.Name == req.body.Name) {
            server.State = req.body.State;
        }
    });

    res.json("Server state updated successfully");
});
   
app.post('/internal/simulate', (req, res) => {
    energyRightNow = [];
    start_simulation(req);
    res.json("It fucking works!");
});

app.get('/api/energyRightNow', (req, res) => {
    res.json(energyRightNow);
})

app.listen(8082, function () {
    console.log("Started application on port %d", 8082)
});

