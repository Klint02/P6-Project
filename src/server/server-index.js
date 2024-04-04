import express from 'express';
const app = express();
app.use(express.json());

let value = 0;
let __dirname = "/app";
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

// This is the endpoint to get the array of servers
app.get('/api/servers', (req, res) =>{ // 
    res.json(serverArray);
});

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

//Array of different "servers"
let serverArray = [
    {
        "name": "Central",
        state: "not init",
        lastKnownPercantage: 10,
        lowerBound: 15,
        middleBound: 30,
        upperBound: 50
    },
    {
        "name": "Central2",
        state: "idle",
        lastKnownPercantage: 16,
        lowerBound: 15,
        middleBound: 30,
        upperBound: 50
    },
    {
        "name": "Central3",
        state: "running",
        lastKnownPercantage: 47,
        lowerBound: 15,
        middleBound: 30,
        upperBound: 50
    },
    {
        "name": "Central4",
        state: "running",
        lastKnownPercantage: 100,
        lowerBound: 15,
        middleBound: 30,
        upperBound: 50
    },
    {
        "name": "Central5",
        state: "idle",
        lastKnownPercantage: 60,
        lowerBound: 15,
        middleBound: 30,
        upperBound: 50
    },
    {
        "name": "Central5",
        state: "not init",
        lastKnownPercantage: 25,
        lowerBound: 15,
        middleBound: 30,
        upperBound: 50
    }

];



//Actual port is 8080
app.listen(8082, function () {
    console.log("Started application on port %d", 8082)
});

