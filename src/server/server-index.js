import express from 'express';
const app = express();
app.use(express.json());
import { send_component } from "/app/shared/mjs/component_builder.mjs";
import { calc_distribution } from './distribution-algorithm.mjs';

let value = 0;
let __dirname = "/app";
const data = {
    "Server-type": "Central",
    "Status": "online"
}

const Keys = [];

function GetNewKey(){
    let key = (Keys.length * 2)+3;//should be changed to a better key system
    let Key = key.toString;
    Keys.push(Key);
    return Key;
}

app.get("/baba", function (req, res) {
    res.json(data);
})

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

app.post("/api/getdata", function(req, res) {
    value = req;
    console.log(value, "WOWOOWWO")
    res.json(data);
})


async function GiveCommand(command, rate){
    
    const response = await fetch("192.120.0.3:8083/api/takecommand", {
        method: "POST",
        body: JSON.stringify({
            "Key": Keys[1],
            "Command": command,
            "Rate": rate
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    });
    
}

app.post("/api/shake", function(req, res) {
    console.log("Data from client", req.body);
    if (req.body["ServerKey"] == null){
        let NewServerKey = GetNewKey();
        res.json({
            "Status": data.Status,
            "NewServerKey": NewServerKey
      });
    }
    else if (Keys.includes(req.body["ServerKey"])){
        res.json({
            "Status": data.Status,
        });
    }
})

// This is the endpoint to get the array of servers
app.get('/api/servers', (req, res) =>{ // 
    res.json(serverArray);
});
 // endpoint to update the state of a server
app.post('/api/servers/:id', (req, res) => {
    const { id } = req.params;
    const { state: newState } = req.body;

    const server = serverArray.find(server => server.name === id);
    if(server){
        server.state = newState;
        res.status(200).send('State updated successfully');
    } else {
        res.status(404).send('Server not found');
    }
});

app.get("/internal/db_controls", function(request, response) {
    response.send(send_component([__dirname + "/shared/components/db_controls.html"]));
})
app.get("/components/test", function(request, response) {
    response.send(send_component([__dirname + "/sites/components/test.html"]));
});

app.get('/internal/run-algorithm', function(request, response) {
    calc_distribution(serverArray);
})

//Array of different "servers"
let serverArray = [
    {
        "name": "Central",
        "lastKnownPercantage": 10,
        "state": "not init",
        "lowerBound": 15,
        "middleBound": 30,
        "upperBound": 50
    },
    {
        "name": "Central2",
        "lastKnownPercantage": 16,
        "state": "idle",
        "lowerBound": 15,
        "middleBound": 30,
        "upperBound": 50
    },
    {
        "name": "Central3",
        "lastKnownPercantage": 47,
        "state": "running",
        "lowerBound": 15,
        "middleBound": 30,
        "upperBound": 50
    },
    {
        "name": "Central4",
        "lastKnownPercantage": 100,
        "state": "running",
        "lowerBound": 15,
        "middleBound": 30,
        "upperBound": 50
    },
    {
        "name": "Central5",
        "lastKnownPercantage": 60,
        "state": "idle",
        "lowerBound": 15,
        "middleBound": 30,
        "upperBound": 50
    },
    {
        "name": "Central6",
        "lastKnownPercantage": 25,
        "state": "not init",
        "lowerBound": 15,
        "middleBound": 30,
        "upperBound": 50
    }

];

app.listen(8082, function () {
    console.log("Started application on port %d", 8082)
});
