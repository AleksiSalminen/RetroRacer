var options = import("../config/config");


var Game = {  // a modified version of the game loop from my previous boulderdash game - see http://codeincomplete.com/posts/2011/10/25/javascript_boulderdash/#gameloop

  run: function () {

      Game.loadImages(options.images, function (images) {

          options.ready(images); // tell caller to initialize itself because images are loaded and we're ready to rumble

          Game.setKeyListener(options.keys);

          var canvas = options.canvas,    // canvas render target is provided by caller
              update = options.update,    // method to update game logic is provided by caller
              render = options.render,    // method to render the game is provided by caller
              step = options.step,      // fixed frame step (1/fps) is specified by caller
              now = null,
              last = Util.timestamp(),
              dt = 0,
              gdt = 0;

          function frame() {
              now = Util.timestamp();
              dt = Math.min(1, (now - last) / 1000); // using requestAnimationFrame have to be able to handle large delta's caused when it 'hibernates' in a background or non-visible tab
              gdt = gdt + dt;
              while (gdt > step) {
                  gdt = gdt - step;
                  update(step);
              }
              render();
              last = now;
              requestAnimationFrame(frame, canvas);
          }
          frame();
          Game.playMusic();
          Game.playEngineSound();
      });
  },

  pause: function () {
      if (!wrecked && !finished) {
          paused = !paused;
      }
  },

  //---------------------------------------------------------------------------

  loadImages: function (names, callback) { // load multiple images and callback when ALL images have loaded
      var result = [];
      var count = names.length;

      var onload = function () {
          if (--count == 0)
              callback(result);
      };

      for (var n = 0; n < names.length; n++) {
          var name = names[n];
          result[n] = document.createElement('img');
          Dom.on(result[n], 'load', onload);
          result[n].src = "images/" + name + ".png";
      }
  },

  //---------------------------------------------------------------------------

  setKeyListener: function (keys) {
      var onkey = function (keyCode, mode) {
          var n, k;
          for (n = 0; n < keys.length; n++) {
              k = keys[n];
              k.mode = k.mode || 'up';
              if ((k.key == keyCode) || (k.keys && (k.keys.indexOf(keyCode) >= 0))) {
                  if (k.mode == mode) {
                      k.action.call();
                  }
              }
          }
      };
      Dom.on(document, 'keydown', function (ev) { onkey(ev.keyCode, 'down'); });
      Dom.on(document, 'keyup', function (ev) { onkey(ev.keyCode, 'up'); });
  },

  //---------------------------------------------------------------------------

  changeCamera: function () {
      if (cameraView === 1) {
          cameraView = 2;
          cameraHeight = 550;
          roadWidth = 3000;
      }
      else if (cameraView === 2) {
          cameraView = 1;
          cameraHeight = 1000;
          roadWidth = 2600;
      }
      else {
          cameraView = 2;
          cameraHeight = 550;
          roadWidth = 3000;
      }
  },

  //---------------------------------------------------------------------------

  playMusic: function () {
      var src = "./maps/" + map.id + "/theme.mp3";
      music = new Audio(src);
      //music.preservesPitch = false;
      music.playbackRate = 1.1;
      music.loop = true;
      music.volume = 1.0;
      music.play();
  },

  //---------------------------------------------------------------------------

  playEngineSound: function () {
      engineSound1.preservesPitch = false;
      engineSound1.playbackRate = 0.5;
      engineSound1.volume = 0;
      engineSound1.loop = true;
      engineSound1.play();

      engineSound2.preservesPitch = false;
      engineSound2.volume = 0.1;
      engineSound2.playbackRate = 2.0;
      engineSound2.loop = true;
      engineSound2.play();

      engineSound3.preservesPitch = false;
      engineSound3.volume = 0.3;
      engineSound3.loop = true;
      engineSound3.play();

      engineSound4.preservesPitch = false;
      engineSound4.volume = 0;
      engineSound4.loop = true;
      engineSound4.play();
  },

  //---------------------------------------------------------------------------

  playCrashSound: function () {
      crashSound.currentTime = 0;
      crashSound.playbackRate = 1.5;
      crashSound.volume = 0.4;
      crashSound.play();
  }

}


function reset(options) {
    options = options || {};
    canvas.width = width = Util.toInt(options.width, width);
    canvas.height = height = Util.toInt(options.height, height);
    lanes = Util.toInt(options.lanes, lanes);
    roadWidth = Util.toInt(options.roadWidth, roadWidth);
    cameraHeight = Util.toInt(options.cameraHeight, cameraHeight);
    drawDistance = Util.toInt(options.drawDistance, drawDistance);
    fogDensity = Util.toInt(options.fogDensity, fogDensity);
    fieldOfView = Util.toInt(options.fieldOfView, fieldOfView);
    segmentLength = Util.toInt(options.segmentLength, segmentLength);
    rumbleLength = Util.toInt(options.rumbleLength, rumbleLength);
    cameraDepth = 1 / Math.tan((fieldOfView / 2) * Math.PI / 180);
    playerZ = (cameraHeight * cameraDepth);
    resolution = height / 480;

    if ((segments.length == 0) || (options.segmentLength) || (options.rumbleLength))
      map.resetRoad(); // Only rebuild road if necessary
}

Game.run();
