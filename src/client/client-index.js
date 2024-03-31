import express from 'express';
const app = express();
import mysql from 'mysql';
import logger  from "./logger.mjs";

let __dirname = "/app";
var db_name = "p6"


var con = mysql.createConnection({
  host: "192.120.0.99",
  user: "root",
  password: "1234",
  database: db_name
});


var log = new logger(con);

log.migrate_db(db_name);

app.get("/",function(request,response) {
    response.sendFile(__dirname + "/sites/test.html")
})

//Actual port 8081
app.listen(8083, function () {
    console.log("Started application on port %d", 8083)
});

