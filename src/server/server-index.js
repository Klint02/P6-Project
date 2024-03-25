const express = require("express");
var app = express();
app.use(express.json());

value = 0;
const data = {
    "Server-type": "Central",
    "Status": "online"
}

app.get("/",function(request, res) {
    res.json(data);
})

app.post("/api/getdata", function(req, res) {
    value = req;
    console.log(value, "WOWOOWWO")
    res.json(data);
})


//Actual port is 8080
app.listen(8082, function () {
    console.log("Started application on port %d", 8082)
});