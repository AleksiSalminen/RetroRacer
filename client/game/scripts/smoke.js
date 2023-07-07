// Create an array to store our particles
var particles = [];

// The amount of particles to render
var particleCount = 10;

// The maximum velocity in each direction
var maxVelocity = 5;

// A function to create a particle object.
function Particle(ctx, image) {

    // Set the initial x and y positions
    this.x = 0;
    this.y = 0;

    this.image = image;

    // Set the initial velocity
    this.xVelocity = 0;
    this.yVelocity = 0;

    // Set the radius
    this.radius = 5;

    // Store the ctx which will be used to draw the particle
    this.ctx = ctx;

    // The function to draw the particle on the canvas.
    this.draw = function(density) {
        // If an image is set draw it
        if(this.image){
            for (i = 0;i < density;i++) {
                if (i % 2 === 0) {
                    this.ctx.drawImage(sprites, this.image.x, this.image.y, this.image.w, this.image.h, this.x-density*10, this.y-density*10, 256, 256);
                }
                else {
                    this.ctx.drawImage(sprites, this.image.x, this.image.y, this.image.w, this.image.h, this.x+density*10, this.y+density*10, 256, 256);
                }
            }
            // If the image is being rendered do not draw the circle so break out of the draw function                
            return;
        }
        // Draw the circle as before, with the addition of using the position and the radius from this object.
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = "rgba(0, 255, 255, 1)";
        this.ctx.fill();
        this.ctx.closePath();
    };

    // Update the particle.
    this.update = function() {
        // Update the position of the particle with the addition of the velocity.
        this.x += this.xVelocity;
        this.y += this.yVelocity;

        // Check if has crossed the right edge
        if (this.x >= canvas.width) {
            this.x = 0;
        }
        // Check if has crossed the left edge
        else if (this.x <= 0) {
            this.x = canvas.width;
        }

        // Check if has crossed the bottom edge
        if (this.y >= canvas.height) {
            this.y = 0;
        }
        
        // Check if has crossed the top edge
        else if (this.y <= -300) {
            this.y = canvas.height;
        }
    };

    // A function to set the position of the particle.
    this.setPosition = function(x, y) {
        this.x = x;
        this.y = y;
    };

    // Function to set the velocity.
    this.setVelocity = function(x, y) {
        this.xVelocity = x;
        this.yVelocity = y;
    };
    
    this.setImage = function(image){
        this.image = image;
    }
}

// A function to generate a random number between 2 values
function generateRandom(min, max){
    return Math.random() * (max - min) + min;
}

// Initialise the scene
function initSmoke(ctx, image) {
    // Create the particles and set their initial positions and velocities
    for(var i=0; i < particleCount; ++i){
        var particle = new Particle(ctx, image);
        
        // Set the position to be inside the canvas bounds
        particle.setPosition(generateRandom(canvas.width/2-350, canvas.width/2+100), canvas.height);
        
        // Set the initial velocity to be either random and either negative or positive
        particle.setVelocity(0, generateRandom(-maxVelocity, 0));
        particles.push(particle);            
    }
}

// The function to draw the scene
function drawSmoke(density) {
    // Go through all of the particles and draw them.
    particles.forEach(function(particle) {
        particle.draw(density);
    });
}

// Update the scene
function updateSmoke() {
    particles.forEach(function(particle) {
        particle.update();
    });
}
