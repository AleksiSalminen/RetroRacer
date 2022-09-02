//=========================================================================
// GAME LOOP helpers
//=========================================================================

var Game = {  // a modified version of the game loop from my previous boulderdash game - see http://codeincomplete.com/posts/2011/10/25/javascript_boulderdash/#gameloop

    run: function (options) {

        Game.loadImages(options.images, function (images) {

            options.ready(images); // tell caller to initialize itself because images are loaded and we're ready to rumble

            Game.setKeyListener(options.keys);

            var canvas = options.canvas,    // canvas render target is provided by caller
                update = options.update,    // method to update game logic is provided by caller
                render = options.render,    // method to render the game is provided by caller
                step = options.step,      // fixed frame step (1/fps) is specified by caller
                stats = options.stats,     // stats instance is provided by caller
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
            frame(); // lets get this party started
            Game.playMusic();
        });
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

    playMusic: function () {
        var src = "";
        for (let i = 0;i < maps.length;i++) {
            if (maps[i].id === map) {
                src = "./maps/" + map + "/theme.mp3"
            }
        }
        var music = new Audio(src);
        music.loop = true;
        music.volume = 0.2;
        music.play();
    }

}

