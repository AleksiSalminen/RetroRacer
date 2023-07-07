const express = require("express");
const app = express();
const router = require("./api/router.js").router;

const ip = "localhost";
const port = 3000;

app.use(express.json());
app.use("/", express.static("./client"));
app.use("/api", router);

app.listen(port, ip, () => {
    console.log("Listening on " + ip + ":" + port + "");
});
