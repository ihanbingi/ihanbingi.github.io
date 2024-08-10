window.requestAnimationFrame = window.requestAnimationFrame || (function (callback, element) { setTimeout(callback, 1000 / 60); });

function timeStamp() {
	if (window.performance.now) return window.performance.now(); else return Date.now();
}

function isVisible(el) {
	var r = el.getBoundingClientRect();
	return r.top + r.height >= 0 && r.left + r.width >= 0 && r.bottom - r.height <= (window.innerHeight || document.documentElement.clientHeight) && r.right - r.width <= (window.innerWidth || document.documentElement.clientWidth);
}

function Star(x, y, z) {
	this.x = x;
	this.y = y;
	this.z = z;
	this.size = 0.5 + Math.random();
}


function WarpSpeed(targetId, config) {

	this.targetId = targetId;
	if (WarpSpeed.RUNNING_INSTANCES == undefined) WarpSpeed.RUNNING_INSTANCES = {};
	if (WarpSpeed.RUNNING_INSTANCES[targetId]) { WarpSpeed.RUNNING_INSTANCES[targetId].destroy(); }

	// if (typeof config == "string") try { config = JSON.parse(config); } catch (e) { config = {} }
	this.SPEED = config.speed
	this.TARGET_SPEED = config.targetSpeed
	this.SPEED_ADJ_FACTOR = config.speedAdjFactor
	this.DENSITY = config.density
	this.USE_CIRCLES = config.shape
	this.WARP_EFFECT = config.warpEffect
	this.WARP_EFFECT_LENGTH = config.warpEffectLength
	this.STAR_SCALE = config.starSize
	this.BACKGROUND_COLOR = config.backgroundColor
	this.STAR_COLOR = config.starColor
	this.DEPTH_ALPHA = config.depthFade
	this.DEPTH_RANGE = config.depth
	this.prevW = -1;
	this.prevH = -1; //width and height will be set at first draw call

	this.stars = [];
	for (var i = 0; i < this.DENSITY * 100; i++) {
		this.stars.push(
			new Star(
				(Math.random() - 0.5) * this.DEPTH_RANGE,
				(Math.random() - 0.5) * this.DEPTH_RANGE,
				this.DEPTH_RANGE * Math.random()));
	}
	this.lastMoveTS = timeStamp();
	this.drawRequest = null;
	this.LAST_RENDER_T = 0;
	var canvas = document.getElementById(this.targetId);
	canvas.width = 1; canvas.height = 1;
	WarpSpeed.RUNNING_INSTANCES[targetId] = this;


	this.draw();
}

WarpSpeed.prototype = {
	constructor: WarpSpeed,
	draw: function () {
		// console.log(`conlog: config item`, this.stars[0])
		var TIME = timeStamp();
		if (!(document.getElementById(this.targetId))) {
			this.destroy();
			return;
		}
		this.move();
		var canvas = document.getElementById(this.targetId);
		if (!this.PAUSED && isVisible(canvas)) {
			if (this.prevW != canvas.clientWidth || this.prevH != canvas.clientHeight) {
				canvas.width = (canvas.clientWidth < 10 ? 10 : canvas.clientWidth) * (window.devicePixelRatio || 1);
				canvas.height = (canvas.clientHeight < 10 ? 10 : canvas.clientHeight) * (window.devicePixelRatio || 1);
			}
			this.size = (canvas.height < canvas.width ? canvas.height : canvas.width) / (10 / (this.STAR_SCALE <= 0 ? 0 : this.STAR_SCALE));
			if (this.WARP_EFFECT) this.maxLineWidth = this.size / 30;
			var ctx = canvas.getContext("2d");
			ctx.globalAlpha = 1.0;
			ctx.fillStyle = this.BACKGROUND_COLOR;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = this.STAR_COLOR;
			for (var i = 0; i < this.stars.length; i++) {
				var s = this.stars[i];
				var xOnDisplay = s.x / s.z, yOnDisplay = s.y / s.z;
				if (!this.WARP_EFFECT && (xOnDisplay < -0.5 || xOnDisplay > 0.5 || yOnDisplay < -0.5 || yOnDisplay > 0.5)) continue;
				var size = s.size * this.size / s.z;
				if (size < 0.3) continue; //don't draw very small dots
				if (this.DEPTH_ALPHA) {
					const far = this.DEPTH_RANGE * .8
					const farRange = this.DEPTH_RANGE - far
					if (s.z > far) {
						var alpha = (this.DEPTH_RANGE - s.z) / farRange
					} else {
						var alpha = s.z / 100  // pct for last 100px
					}
					ctx.globalAlpha = alpha < 0 ? 0 : alpha > 1 ? 1 : alpha;
				}
				if (this.WARP_EFFECT) {
					ctx.beginPath();
					var x2OnDisplay = s.x / (s.z + this.WARP_EFFECT_LENGTH * this.SPEED), y2OnDisplay = s.y / (s.z + this.WARP_EFFECT_LENGTH * this.SPEED);
					if (x2OnDisplay < -0.5 || x2OnDisplay > 0.5 || y2OnDisplay < -0.5 || y2OnDisplay > 0.5) continue;
					ctx.moveTo(canvas.width * (xOnDisplay + 0.5) - size / 2, canvas.height * (yOnDisplay + 0.5) - size / 2);
					ctx.lineTo(canvas.width * (x2OnDisplay + 0.5) - size / 2, canvas.height * (y2OnDisplay + 0.5) - size / 2);
					ctx.lineWidth = size > this.maxLineWidth ? this.maxLineWidth : size;
					if (this.USE_CIRCLES) { ctx.lineCap = "round"; } else { ctx.lineCap = "butt" }
					ctx.strokeStyle = ctx.fillStyle;
					ctx.stroke();
				} else if (this.USE_CIRCLES) {
					ctx.beginPath();
					ctx.arc(canvas.width * (xOnDisplay + 0.5) - size / 2, canvas.height * (yOnDisplay + 0.5) - size / 2, size / 2, 0, 2 * Math.PI);
					ctx.fill();
				} else {
					ctx.fillRect(canvas.width * (xOnDisplay + 0.5) - size / 2, canvas.height * (yOnDisplay + 0.5) - size / 2, size, size);
				}
			}
			this.prevW = canvas.clientWidth;
			this.prevH = canvas.clientHeight;
		}
		if (this.drawRequest != -1) this.drawRequest = requestAnimationFrame(this.draw.bind(this));
		this.LAST_RENDER_T = timeStamp() - TIME;
	},
	move: function () {
		var t = timeStamp(), speedMulF = (t - this.lastMoveTS) / (1000 / 60);
		this.lastMoveTS = t;
		if (this.PAUSED) return;
		var speedAdjF = Math.pow(this.SPEED_ADJ_FACTOR < 0 ? 0 : this.SPEED_ADJ_FACTOR > 1 ? 1 : this.SPEED_ADJ_FACTOR, 1 / speedMulF);
		this.SPEED = this.TARGET_SPEED * speedAdjF + this.SPEED * (1 - speedAdjF);
		if (this.SPEED < 0) this.SPEED = 0;
		var speed = this.SPEED * speedMulF;
		for (var i = 0; i < this.stars.length; i++) {
			var s = this.stars[i];
			s.z -= speed;
			while (s.z < 1) {
				s.z += this.DEPTH_RANGE + (Math.random() - 0.5) * (this.DEPTH_RANGE * .2);
				s.x = (Math.random() - 0.5) * s.z;
				s.y = (Math.random() - 0.5) * s.z;
			}
		}
	},
	destroy: function (targetId) {
		if (targetId) {
			if (WarpSpeed.RUNNING_INSTANCES[targetId]) WarpSpeed.RUNNING_INSTANCES[targetId].destroy();
		} else {
			try { cancelAnimationFrame(this.drawRequest); } catch (e) { this.drawRequest = -1; }
			WarpSpeed.RUNNING_INSTANCES[this.targetId] = undefined;
		}
	},
	pause: function () {
		this.PAUSED = true;
	},
	resume: function () {
		this.PAUSED = false;
	},
	update: function (config) {
		console.log(`conlog: update config`, config)
		this.SPEED = config.speed
		this.TARGET_SPEED = config.targetSpeed
		this.SPEED_ADJ_FACTOR = config.speedAdjFactor
		this.DENSITY = config.density
		this.USE_CIRCLES = config.shape
		this.DEPTH_ALPHA = config.depthFade
		this.WARP_EFFECT = config.warpEffect
		this.WARP_EFFECT_LENGTH = config.warpEffectLength
		this.STAR_SCALE = config.starSize
		this.BACKGROUND_COLOR = config.backgroundColor
		this.STAR_COLOR = config.starColor
		this.DEPTH_RANGE = config.depth

		// this.draw()
	}
}

WarpSpeed.destroy = WarpSpeed.prototype.destroy;

// function setup() {
//   // put setup code here
// }

// function draw() {
//   // put drawing code here
// }