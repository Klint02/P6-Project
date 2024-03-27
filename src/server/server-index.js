const express = require("express");
var app = express();
app.use(express.json());


value = 0;
const data = {
    "Server-type": "Central",
    "Status": "online"
}

app.get("/baba", function (req, res) {
    console.log("HAHHAHAHA")
    res.json(data);
})

app.get("/",function(request, res) {

    const filename = '/Sites/test.html'
    res.sendFile(__dirname + filename, function(err){
        if(err){
            console.log("Error sending file:", err)
        }else{
            console.log("Sent:", filename)
        }
    })
    console.log('JALALALALALLALALALL')
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