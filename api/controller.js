

function getCaptures(req, res) {
    console.log("Get captures");
    res.end();
}


function addCapture(req, res) {
    console.log("Add capture");
    res.json({});
}


module.exports = { getCaptures, addCapture };
