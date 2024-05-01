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
let temp = {};
let value = 0;
let __dirname = "/app";
let Keys = [];

app.use('/shared', express.static(__dirname + '/shared'));
let data = {
    "Server-type": "Central",
    "Status": "online",
    "Key": "257052945",
    "lower_type": args[0],
    "higher_type": args[1]
}
//Array of different "servers"
let serverArray = [];
setInterval(ServerCommander, 13000)

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
    const movies = await response.json()
    let serverI = serverArray.findIndex((element) => element.Key == movies.Key)
    serverArray[serverI].LastKnownPercentage = movies.CurrentFill
    serverArray[serverI].State = movies.Status
    //console.log(movies)
    //console.log("updated saved server information", serverArray[serverI])
}

function ServerCommander(){
    let current_kwh = 500;
    //TODO somone: get kwh from energi.net
    //TODO somone: check if data is new or old
    let distribution = calc_distribution(serverArray, current_kwh, data.lower_type, data.higher_type)
    distribution.forEach(element => {
        if (element.current_input > 0 || element.current_input < 0){
            GiveCommand(element.Key, "Charge", element.current_input)            
        }
        else if (element.current_input == 0){
            GiveCommand(element.Key, "Stop")
        }
    });
}

async function getData() {
    let newdata = await fetch('https://api.energidataservice.dk/dataset/PowerSystemRightNow?limit=1')
        .then((response) => response.json()).then((newdata => {
            if (energyRightNow.length == 0 || newdata.records[0]['Minutes1UTC'] != temp[0]) {
                temp={}
                for (var item in newdata.records[0]) {

                    switch (item) {
                        case 'Minutes1UTC':
                        case 'Minutes1DK':
                        case 'ProductionGe100MW':
                        case 'ProductionLt100MW':
                        case 'SolarPower':
                        case 'OffshoreWindPower':
                        case 'OnshoreWindPower':
                        case 'Exchange_Sum':
                            temp[item]=newdata.records[0][item]
                            break;
                        default:
                            break;
                    }
                }
                energyRightNow.unshift(temp)
                console.log(energyRightNow)
            } 
        }))
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
app.post("/api/getdata", function (req, res) {
    value = req;
    res.json(data);
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
            "MiddleBound": req.body["MBound"],
            "MaxChargeRate": req.body["MaxChargeRate"],
            "MaxDischarge": req.body["MaxDischarge"],
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
    serverArray.forEach(server =>{
        if (server.Name == req.body.Name) {
            server.State = req.body.State;
        }
    });

    res.json("Server state updated successfully");
});

app.listen(8082, function () {
    console.log("Started application on port %d", 8082)
});

