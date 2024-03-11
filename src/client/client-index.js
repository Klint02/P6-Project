const express = require("express")
var app = express()
app.get("/",function(request,response) {
    response.send("<h1> hmm </h1>")
})

app.get("/",function(request,response) {
    response.send("<h1> hmm </h1>")
})

app.listen(25256, function () {
    console.log("Started application on port %d", 25256)
});

var http = require('http');

var options = {
    host: '127.0.0.1:25255',
    path: '/'
}
var request = http.request(options, function (res) {
    var data = '';
    res.on('data', function (chunk) {
        data += chunk;
    });
    res.on('end', function () {
        console.log(data);

    });
});
request.on('error', function (e) {
    console.log(e.message);
});
request.end();