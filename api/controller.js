const fs = require("fs");


function getCaptures(req, res) {
    console.log("Get captures");
    res.end();
}


function addCapture(req, res) {
    const capture = req.body;
    const dir = "./captures/" + capture.map;
    fs.readdir(dir, (err, files) => {
        const fileID = files.length+1;
        const fileName = dir + "/" + fileID +".json";
        fs.writeFile(fileName, JSON.stringify(capture), function (err) {
            if (err) {
                console.log(err);
                res.end(500);
            }
            else {
                console.log("Added capture record");
                res.json({});
            }
        });
    });
}


module.exports = { getCaptures, addCapture };
