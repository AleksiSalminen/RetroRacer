const fs = require("fs");


function getCaptures(req, res) {
    console.log("Get captures");
    res.end();
}


function addCapture(req, res) {
    console.log(req.body);
    res.json({});
}


module.exports = { getCaptures, addCapture };
