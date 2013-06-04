'use strict';

// http://www.gameplaypassion.com/blog/explosion-effect-html5-canvas/
var Explosion = function(x, y, zIndex, scale, color){
	var minSize = 15;
	var maxSize = 25;
	var count = 8;
	var minSpeed = 60.0;
	var maxSpeed = 150.0;
	var minScaleSpeed = 2.0;
	var maxScaleSpeed = 4.0;
	var newParticles = [];

	for (var angle=0; angle < 360; angle += Math.round(360/count)) {
		var particle = new ExplosionParticle();

		particle.x = x;
		particle.y = y;
		particle.zIndex = zIndex++;
		particle.scale = scale;

		particle.radius = randomFloat(minSize, maxSize);

		particle.color = 'rgba(' + color + ', .5)';

		particle.scaleSpeed = randomFloat(minScaleSpeed, maxScaleSpeed) * scale;

		var speed = randomFloat(minSpeed, maxSpeed);

		particle.velocityX = speed * Math.cos(angle * Math.PI / 180.0);
		particle.velocityY = speed * Math.sin(angle * Math.PI / 180.0);

		newParticles.push(particle);
	}

	return newParticles;
};

function ExplosionParticle() {
	this.scale = 1;
	this.x = 0;
	this.y = 0;
	this.radius = 20;
	this.color = 'rgba(255,255,255,.5)';
	this.velocityX = 0;
	this.velocityY = 0;
	this.scaleSpeed = 0.5;
	this.zIndex = 0;

	this.update = function(ms) {
		this.scale -= this.scaleSpeed * ms / 1000.0;

		if (this.scale < 0) {
			this.scale = 0;
		}

		this.x += this.velocityX * ms / 1000.0;
		this.y += this.velocityY * ms / 1000.0;
	};

	this.draw = function(context, bgModules, delta) {
        this.update(20);
		if (this.scale < 1) { return; }

		context.save();
		context.translate(this.x, this.y);
		context.scale(this.scale, this.scale);
		context.beginPath();
		context.arc(0, 0, this.radius, 0, Math.PI*2, true);
		context.closePath();
		context.fillStyle = this.color;
		context.fill();
		context.restore();
	};
}