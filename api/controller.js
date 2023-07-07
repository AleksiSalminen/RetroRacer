const fs = require("fs");


function getCaptures(req, res) {
    res.end();
}


function getCapture(req, res) {
    const id = req.params.id;
    const map = req.query.map;
    
    fs.readFile("./captures/" + map + "/" + id + ".json",  {encoding: 'utf-8'}, function(err, data){
        if (!err) {
            res.json(JSON.parse(data));
        }
        else {
            console.log(err);
        }
    });
}


function addCapture(req, res) {
    const capture = req.body;
    const dir = "./captures/" + capture.map;
    fs.readdir(dir, (err, files) => {
        const fileID = files.length+1;
        capture.id = fileID;
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


module.exports = { getCaptures, getCapture, addCapture };
