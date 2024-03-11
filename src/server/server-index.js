const express = require("express")
var app = express()
app.get("/",function(request,response) {
    response.send("<h1> hmm </h1>")
})
app.listen(25255, function () {
    console.log("Started application on port %d", 25255)
});