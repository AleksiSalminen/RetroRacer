/**
 * This script handles importing all used scripts
 */

var searchParams = window.location.search.substring(1).split('&');
var mapID = searchParams[0].split('=')[1];
var mapScript = document.createElement("script");
mapScript.src = "./maps/" + mapID + "/map.js";
document.body.appendChild(mapScript);

var apiScript = document.createElement("script");
apiScript.src = "./scripts/api.js";
document.body.appendChild(apiScript);

var actionCaptureScript = document.createElement("script");
actionCaptureScript.src = "./scripts/action_capture.js";
document.body.appendChild(actionCaptureScript);

var handlerScript = document.createElement("script");
handlerScript.src = "./scripts/handler.js";
document.body.appendChild(handlerScript);

var helperScript = document.createElement("script");
helperScript.src = "./scripts/helper.js";
document.body.appendChild(helperScript);

var updaterScript = document.createElement("script");
updaterScript.src = "./scripts/updater.js";
document.body.appendChild(updaterScript);

var graphicsScript = document.createElement("script");
graphicsScript.src = "./scripts/graphics.js";
document.body.appendChild(graphicsScript);

var viewScript = document.createElement("script");
viewScript.src = "./scripts/view.js";
document.body.appendChild(viewScript);

var roadScript = document.createElement("script");
roadScript.src = "./scripts/road.js";
document.body.appendChild(roadScript);

var gameScript = document.createElement("script");
gameScript.src = "./scripts/game.js";
document.body.appendChild(gameScript);

var smokeScript = document.createElement("script");
smokeScript.src = "./scripts/smoke.js";
document.body.appendChild(smokeScript);
