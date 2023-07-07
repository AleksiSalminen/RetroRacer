const express = require("express");
const router = express.Router();
const controller = require("./controller.js");


router
    .route("/captures")
        .get(controller.getCaptures)
        .post(controller.addCapture);
    
router
    .route("/captures/:id")
        .get(controller.getCapture)

module.exports = {
    router
};

