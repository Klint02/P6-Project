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

app.post("/connect", function(req, res) {
    value = req.query.hmm;
    console.log(value, "WOWOOWWO")
    res.json(data);
})


//Actual port is 8080
app.listen(8080, function () {
    console.log("Started application on port %d", 8080)
});