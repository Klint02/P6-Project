import express from 'express';
const app = express();
app.use(express.json());

let __dirname = "/app";
let value = 0;
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

//Actual port is 8080
app.listen(8082, function () {
    console.log("Started application on port %d", 8082)
});