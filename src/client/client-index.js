import express from 'express';
const app = express();
import bodyParser from 'body-parser';
app.use(bodyParser.json());
import cors from 'cors';
app.use(cors({
    origin: "*"

}));
import mysql from 'mysql';
import logger from "/app/shared/mjs/logger.mjs";
import { send_component } from "/app/shared/mjs/component_builder.mjs";
const energyNeeded = 53;
const hydrogenEnergy = 39.4;
let __dirname = "/app";
var db_name = "p6";
// node.js [Name] [IP:Port] [charge rate] [discharge rate] [hydrogen capacity] [lower bound]
var args = process.argv.slice(2);
const data = {
    "Server-type": "Client",
    "Name": args[0],
    "Status": "idle",
    "CurrentFill": 0,
    "CurrentChargeRate": 0,
    "MaxDischarge": 0,
    "Key": null
}

const MoreData = {
    "MaxChargeRate": parseInt(args[2]),
    "MaxDischargeRate": parseInt(args[3]),
    "LBound": parseInt(args[5]),
    "ServerKey": null,
    "MaxCapacity": parseInt(args[4]), //KG of hydrogen.
    "IP": args[1],
    "Port": args[1].split(":")[1]
}

var con = mysql.createConnection({
    host: "192.120.0.99",
    user: "root",
    password: "1234",
    database: db_name
});

var log = new logger(con);


var ShakingHand = setInterval(ShakeHand, 10000);

app.get("/", function (request, response) {
    response.sendFile(__dirname + "/sites/dashboard.html");
})

var corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.post("/fetch/component", cors(corsOptions), function (request, response) {
    response.send(send_component(request.body, __dirname));
})

app.get("/internal/logs/get_logs", cors(corsOptions), async function (request, response) {
    let result = await log.generic_SQL("SELECT * FROM `logs` ORDER BY Timestamp DESC");
    response.send(JSON.stringify(result));
})

app.get("/internal/db_controls/migrate", function (request, response) {
    log.migrate_db(db_name);
})

app.post("/internal/db_controls/log", function (request, response) {
    //log.log(request.body["type"], data.Name, request.body["message"]);
})

app.get("/api/tempdata", function (request, res) {
    res.json(data);
})

app.post("/api/takecommand", function (req, res) {
    //console.log("Command from server", req.body);
    if (req.body["Key"] === MoreData.ServerKey) {//needs a key specific to the server
        switch (req.body["Command"]) {
            case "Charge":
                data.CurrentChargeRate = req.body["Rate"];
                data.Status = "running";
                charging()
                break
            case "Stop":
                data.CurrentChargeRate = 0;
                data.Status = "idle"
                break
            case "offline":
                if (data.Status != "not init") {
                    data.CurrentChargeRate = 0;
                    data.Status = "not init"
                    clearInterval(ShakingHand)
                }
                break
            case "start":
                if (data.Status == "not init") {
                    data.Status = "idle"
                    var ShakingHand = setInterval(ShakeHand, 10000)
                }
                break
        }
        //log.log("INFO", data.Name, `Server ${data.Name} that has status ${data.Status} got input of ${data.CurrentChargeRate} and has a fill of ${data.CurrentFill}`)
        res.json(data);
    }
    else {
        //log.log("ERROR", data.Name, `Something tried to command server ${data.Name} but it did not have the right key`)
    }
})
function charging() {
    if (data.CurrentChargeRate > 0) {
        data.CurrentFill += ((data.CurrentChargeRate/energyNeeded) / MoreData.MaxCapacity) * 100;
    } else {
        data.CurrentFill += ((data.CurrentChargeRate/hydrogenEnergy) / MoreData.MaxCapacity) * 100;
        if (data.CurrentFill < 0){data.CurrentFill = 0}
    }

    //stores how many kwh the stored hydrogen converts into.
    data.MaxDischarge = ((data.CurrentFill/100)*MoreData.MaxCapacity) * hydrogenEnergy;
    //console.log("Max Discharge at the moment: " + (data.MaxDischarge).toFixed(2) + "kwh");

    /*if (data.CurrentFill == 100){
        console.log("client Tank is full")
    } else if (data.CurrentFill == 0) {
        console.log("client Tank is empty")
    } else {
        console.log("Tank filled up: " + data.CurrentFill.toFixed(2) + '%')
    }*/
}

async function ShakeHand() {
    if (data.Key == null) {
        const response = await fetch("http://192.120.0.2:8082/api/shake", {
            method: "POST",
            body: JSON.stringify(Object.assign({}, data, MoreData)),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        });
        const movies = await response.json()
        data.Key = movies.NewKey
        MoreData.ServerKey = movies.ServerKey
        console.log("new key from server", movies.NewKey)
    }
    else {
        const response = await fetch("http://192.120.0.2:8082/api/shake", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        });
        const movies = await response.json();
        //console.log("data from server", movies);
    }
}


app.listen(MoreData.Port, function () {
    console.log("Started application on port %d", MoreData.Port)
});

