var mysql = require('mysql');
const express = require("express")
var app = express()

app.get("/",function(request,response) {
    response.send("<h1> hmm </h1>")
})

//Actual port 8081
app.listen(8083, function () {
    console.log("Started application on port %d", 8083)
});

var con = mysql.createConnection({
  host: "192.120.0.99",
  user: "root",
  password: "1234"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});
