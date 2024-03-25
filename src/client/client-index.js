const { response } = require("express");
const express = require("express")
var app = express()
const http = require('http');
app.get("/",function(request,response) {
    response.send("<h1> hmm </h1>")
})

//Actual port 8081
app.listen(8081, function () {
    console.log("Started application on port %d", 8081)
});

fetch('https://api.energidataservice.dk/dataset/PowerSystemRightNow?limit=1') 
    .then(response => response.json())
    .then(data=> {
        console.log(data.dataset);
});

const postData = JSON.stringify({
    'hmm': 'Hello World!',
  });
  
  const options = {
    hostname: '127.0.0.1',
    port: 8080,
    path: '/connect',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };
  
  http.get
  const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
      console.log('No more data in response.');
    });
  });
  
  req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
  });
  
  // Write data to request body
  req.write(postData);
  req.end();
