var works = angular.module('works', []);
works.controller("mainController", function($scope, $http) {
    $http.get('/api/pages')
      .then(function(data) {
          $scope.pages = data.data;
      }, function(data) {
          console.log('Error: ' + data);
      });
    $scope.change = function($event) {
      var years = [];
      var tags = [];
      $($event.currentTarget).toggleClass("active");
      $("#year_filter button").each(function(){
        if($(this).hasClass("active")) {
          years.push($(this).text());
        }
      });
      $("#tag_filter button").each(function(){
        if($(this).hasClass("active")) {
          tags.push($(this).text());
        }
      });
      $http.get('/api/pages', {params: {year: years, tags: tags}})
        .then(function(data) {
            $scope.pages = data.data;
        }, function(data) {
            console.log('Error: ' + data);
        });
    }
});

var system, first;
var sat = 0.3, bright = 35.0;
var burstOn = false;
var lastArr = 0;
function setup() {
  setInterval(function(){
    first = selectAll(".img-responsive");
    if(lastArr != first.length) {
      first.forEach(function(el) {
        el.mouseOver(false);
        el.mouseOver(burst);
      });
    }
    lastArr = first.length;
  }, 500);
  setTimeout(function() {
    var last = $(".row .col").last().height() + $(".row .col").last().offset().top;
    var cnv = createCanvas(windowWidth, last);
    cnv.position(0,0);
    cnv.style("z-index", "-1");
    system = new ParticleSystem(createVector(width/2, 50));
  }, 2000);
  
  
  //image(img, 0,0);
}

function burst() {
  var xpos = $(this.elt).offset().left;
  var ypos = $(this.elt).offset().top;
  var w = this.width;
  var h = this.height;
  colorMode("rgb");
  var pageColor = color($(this.elt).attr("id"));
  var hsb = rgbToHsv(pageColor.levels[0], pageColor.levels[1], pageColor.levels[2]);
  colorMode("hsb");
  var x, y, particle;
  for (y = 0; y < h; y = y + 20) {
    for (x = 0; x < w; x = x + 20) {
      //good for creating colors around green
      var hColor = hsb[0] + random(-7,7);
      var sColor = (hsb[1] + random(-10,10))*sat;
      //var bColor = (hsb[2] + random(-10,10))*brightness;
      particle = new Particle(createVector(x+xpos,y+ypos), color(hColor, sColor, random(bright, bright+20)));
      //particle = new Particle(createVector(x+xpos,y+ypos), color(0,0,random(20,40)));
      if(system.particles.length > 100) {
        system.particles.splice(0, 1);
      }
      system.addParticle(particle);
    }
  }
  burstOn = true;
  //$(this.elt).css("visibility", "hidden");
}

function rgbToHsv(r, g, b) {
  r /= 255, g /= 255, b /= 255;

  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, v = max;

  var d = max - min;
  s = max == 0 ? 0 : d / max;

  if (max == min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  return [ h*360, s*100, v*100 ];
}
function draw() {
  colorMode("rgb");
  background(color(0,0,0,0));
  if(burstOn) {
    system.run();
  }
  sat += 0.000275;
  bright += 0.0166;
}

var Particle = function(position, color) {
  //this.acceleration = createVector(0, 0.05);
  this.velocity = createVector(random(-2, 2)*5, random(-2, 2)*5);
  this.position = position.copy();
  this.color = color;
  this.lifespan = 255;
};

Particle.prototype.run = function() {
  this.update();
  this.display();
};

// Method to update position
Particle.prototype.update = function(){
  //this.velocity.add(this.acceleration);
  this.position.add(this.velocity);
  this.lifespan -= 10;
};

// Method to display
Particle.prototype.display = function() {
  stroke(color(0,0,0), this.lifespan);
  strokeWeight(1);
  fill(this.color, this.lifespan);
  var w = random(5,15);
  rect(this.position.x, this.position.y, w,w);
  w = random(5,10);
  rect(this.position.x+random(5,10), this.position.y, w,w);
  w = random(3,8);
  rect(this.position.x, this.position.y+random(5,10), w,w);
  w = random(5,10);
  rect(this.position.x-random(5,10), this.position.y+2, w,w);
  w = random(5,10);
  rect(this.position.x+2, this.position.y-random(5,10), w, w);
  // textSize(32);
  // text("$", this.position.x, this.position.y);
  // text("!", this.position.x+random(5,20), this.position.y);
  // text("%", this.position.x, this.position.y+random(5,20));
  // text("@", this.position.x-random(5,20), this.position.y+2);
  // text("#", this.position.x+2, this.position.y-random(5,20));
};

// Is the particle still useful?
Particle.prototype.isDead = function(){
  return this.lifespan < 0;
};

var ParticleSystem = function(position) {
  this.origin = position.copy();
  this.particles = [];
};

ParticleSystem.prototype.addParticle = function(particle) {
  this.particles.push(particle);
};

ParticleSystem.prototype.run = function() {
  for (var i = this.particles.length-1; i >= 0; i--) {
    var p = this.particles[i];
    p.run();
    if (p.isDead()) {
      this.particles.splice(i, 1);
    }
  }
};

