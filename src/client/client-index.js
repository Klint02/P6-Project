import express from 'express';
const app = express();
import bodyParser from 'body-parser';
app.use(bodyParser.json());
import mysql from 'mysql';
import logger  from "./logger.mjs";
import { send_component } from "./component_builder.mjs";

let __dirname = "/app";
var db_name = "p6"


var con = mysql.createConnection({
  host: "192.120.0.99",
  user: "root",
  password: "1234",
  database: db_name
});


var log = new logger(con);


app.get("/",function(request,response) {
    response.sendFile(__dirname + "/sites/dashboard.html");
})

app.get("/internal/logs",async function(request, response) {
    response.send(send_component([__dirname + "/sites/components/client_log.html"]));
})

app.get("/internal/logs/get_logs", async function(request, response) {
    let result = await log.generic_SQL("SELECT * FROM `logs` ORDER BY Timestamp DESC");
    response.send(JSON.stringify(result));
})

app.get("/internal/db_controls", function(request, response) {
    response.send(send_component([__dirname + "/sites/components/db_controls.html"]));
})

app.get("/internal/db_controls/migrate", function(request, response) {
    log.migrate_db(db_name);
})

app.post("/internal/db_controls/log", function(request, response) {
    log.log(request.body["type"], request.body["message"]);
})

const data = {
    "Server-type": "Central",
    "Status": "online"
}

app.get("/api/tempdata",function(request, res) {
    res.json(data);
})

//Actual port 8081
app.listen(8083, function () {
    console.log("Started application on port %d", 8083)
});

