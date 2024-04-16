import express from 'express';
const app = express();
import bodyParser from 'body-parser';
app.use(bodyParser.json());
app.use(express.json());
import { send_component } from "/app/shared/mjs/component_builder.mjs";
import { calc_distribution } from './distribution-algorithm.mjs';

let value = 0;
let __dirname = "/app";
const data = {
    "Server-type": "Central",
    "Status": "online",
    "Key": "257052945"
}

const Keys = [];

function GetNewKey(){
    let Key = (Keys.length * 2)+3;//should be changed to a better key system
    //let Key = key.toString;
    Keys.push(Key);
    return Key;
}

app.get("/",function(request, res) {

    const filename = '/sites/dashboard.html'
    res.sendFile(__dirname + filename, function(err){
        if(err){
            console.log("Error sending file:", err)
        }else{
            console.log("Sent:", filename)
        }
    })
})

app.post("/fetch/component", function(request, response) {
    response.send(send_component(request.body, __dirname));
})

app.post("/api/getdata", function(req, res) {
    value = req;
    console.log(value, "WOWOOWWO")
    res.json(data);
})


async function GiveCommand(key, command, rate = 0){
    let FetchIP = (serverArray.find((element) => element.Key == key).IP + "/api/takecommand")
    let Body = JSON.stringify({
        "Key": data.Key,
        "Command": command
    })
    if (rate != 0){
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
    serverArray[serverI].LastKnownPercantage = movies.CurrentFill
    serverArray[serverI].State = movies.Status
    //console.log(movies)
}

app.post("/api/shake", function(req, res) {
    //console.log("Data from client", req.body);
    if (req.body["Key"] == null){
        let NewKey = GetNewKey();
        res.json({
            "Status": data.Status,
            "NewKey": NewKey,
            "ServerKey": data.Key
      });
      serverArray.push({
        "Key": NewKey,
        "Name": req.body["Name"],
        "LastKnownPercantage": req.body["CurrentFill"],
        "State": req.body["Status"],
        "IP": req.body["IP"],
        "LowerBound": req.body["LBound"],
        "MiddleBound": req.body["MBound"],
        "UpperBound": req.body["UBound"],
        "MaxChargeRate": req.body["MaxChargeRate"],
        "MinChargeRate": req.body["MinChargeRate"]
      })
    }
    else if (Keys.includes(req.body["Key"])){
        res.json({
            "Status": data.Status,
            "Key": data.Key
        });
        //console.log("data saved", serverArray);
        GiveCommand(req.body["Key"], "Charge", 50);
    }
    else { //the client has key but it is not one of ours
        res.json({
            "Error": "yes"
        })
    }
})

// This is the endpoint to get the array of servers
app.get('/api/servers', (req, res) =>{ // 
    res.json(serverArray);
});
 // endpoint to update the state of a server
app.post('/api/updateServers', (req, res) => {
    res.json("Server state updated successfully");
    console.log(req.body);
     //const { id } = req.params;
     //const { state: newState } = req.body;

    // const server = serverArray.find(server => server.name === id);
    // if(server){
    //     server.state = newState;
    //     res.status(200).send('State updated successfully');
    // } else {
    //     res.status(404).send('Server not found');
    // }
});

app.get('/internal/run-algorithm', function(request, response) {
    calc_distribution(serverArray, 350);
})

app.get("/components/serverList", function(request, response) {
    response.send(send_component([__dirname + "/sites/components/serverList.html"]));
});

app.get("/internal/db_controls", function(request, response) {
    response.send(send_component([__dirname + "/shared/components/db_controls.html"]));
})

app.get('/internal/run-algorithm', function(request, response) {
    calc_distribution(serverArray);
})

//Array of different "servers"
let serverArray = [];

app.listen(8082, function () {
    console.log("Started application on port %d", 8082)
});
