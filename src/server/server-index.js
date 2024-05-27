import express from 'express';
const app = express();
import bodyParser from 'body-parser';
app.use(bodyParser.json());
app.use(express.json());
import mysql from 'mysql';
import logger from "/app/shared/mjs/logger.mjs";
import { send_component } from "/app/shared/mjs/component_builder.mjs";
import { calc_distribution } from './distribution-algorithm.mjs';

//node.js [lower_type] [higher_type]
var args = process.argv.slice(2);
let energyRightNow = [];
let energyRightNowBuffer = [];
let temp={}
let __dirname = "/app";
var db_name = "p6";
var con = mysql.createConnection({
    host: "192.120.0.99",
    user: "root",
    password: "1234",
    database: db_name
});
var log = new logger(con);
let Keys = [];

app.use('/shared', express.static(__dirname + '/shared'));
let data = {
    "Server-type": "Central",
    "Status": "online",
    "Key": "257052945",
    "lower_type": args[0],
    "higher_type": args[1],
    "distribution_functions": {"full": 0, "proc": 1, "max": 2, "min": 3, "empty": 4},
    "sim_period": {},
    "months": {}
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
    if (rate == 0 && serverArray.find((element) => element.Key == key).State == "idle"){return(1)}
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
    serverArray[serverI].MaxDischarge = servers.MaxDischarge
    serverArray[serverI].LastKnownPercentage = servers.CurrentFill
    serverArray[serverI].State = servers.Status
    return(1)
}

async function ServerCommander(current_mw, timestamp) {
    let current_mwh = -1 * current_mw/60;
    let data_field_name = timestamp.split("-")[0] + "-" + timestamp.split("-")[1];
    if (!data.months.hasOwnProperty(data_field_name)) {
        data.months[data_field_name] = { "underflow": 0, "overflow": 0, "flowout": 0, "flowin": 0, "peakin": 0, "peakout": 0};
    }
    if (serverArray.length > 0){
        let res = calc_distribution(serverArray, current_mwh, data.lower_type, data.higher_type)
        let distribution = res.distribution
        //console.log("res ", res.current_mwh, "current_mwh", current_mwh, "old_kwh", old_current_kwh, "current_mw", current_mw);
        if (res.current_mwh < 0) {
            //console.log("underflow", res.current_mwh)
            data.months[data_field_name].underflow += res.current_mwh;
        }else {
            //console.log("overflow", res.current_mwh)
            data.months[data_field_name].overflow += res.current_mwh;
        }

        current_mwh > 0 ? data.months[data_field_name].flowin += current_mwh : data.months[data_field_name].flowout += current_mwh;

        if (-current_mw > data.months[data_field_name].peakin) {
            data.months[data_field_name].peakin = -current_mw;
        } else if (-current_mw < data.months[data_field_name].peakout) {
            data.months[data_field_name].peakout = -current_mw;
        }

        //log.log("INFO", `${data['Server-type']}`, `failed to distribute ${res.current_mwh}:kwh`)
        for (let i = 0; i < distribution.length; i++){
            try {

                if ((distribution[i].current_input > 0 )||( distribution[i].current_input < 0)){
                    await GiveCommand(distribution[i].Key, "Charge", distribution[i].current_input)
                }
                else if (distribution[i].current_input == 0){
                    await GiveCommand(distribution[i].Key, "Stop")
                }
            } catch {
                console.log("Request failed");
            }
        };
    } else {
        //log.log("INFO", `${data['Server-type']}`,"no known servers")
    }
}

async function getData(startdate,enddate) {
    energyRightNowBuffer = [];
    const energinet_url = `https://api.energidataservice.dk/dataset/PowerSystemRightNow?offset=0&start=${startdate}&end=${enddate}&sort=Minutes1UTC%20ASC&columns=Minutes1UTC,Minutes1DK,ProductionGe100MW,ProductionLt100MW,SolarPower,OffshoreWindPower,OnshoreWindPower,Exchange_Sum`
    const energinet_data_promise = new Promise(resolve => fetch(energinet_url).then((response) => resolve(response.json())));
    data.sim_period = {"start": startdate, "end": enddate}
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
    console.log("amount of data", energyRightNowBuffer.length)
}

async function start_simulation (req) {
    data.months = {};
    await getData(req.body.firstDate,req.body.secondDate);
    for (let i = 0; i < energyRightNowBuffer.length; i++) {
        energyRightNow.unshift(energyRightNowBuffer[i]);
        await ServerCommander(energyRightNowBuffer[i].Exchange_Sum, energyRightNowBuffer[i].Minutes1DK);
    }
    console.log("Simulation complete")
    console.log(data);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
    energyRightNow.length <= 120 ? res.json(energyRightNow) : res.json(energyRightNow.slice(0,120));
})

app.listen(8082, function () {
    console.log("Started application on port %d", 8082)
});

