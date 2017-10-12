function Graph(_width, _height) {
	this.width = _width;
	this.height = _height;
	this.points = [];
	
	this.initProperties = function() {

		this.properties = {
			elevation: 0,
		};
		
		this.properties.defaults = {
			axesSize: 48,
			primaryLineColor: color(161, 177, 192),
			primaryLineStrokeWeight: 2,
			
			secondaryLineColor: color(230),
			secondaryLineStrokeWeight: 1
		};
		
		this.properties.axes = {
			x: {
				width: this.width,
				height: this.properties.defaults.axesSize,
				
				min: 20,  // degrees F
				max: 120  // degrees F
			},
			y: {
				width: this.properties.defaults.axesSize + 10,
				height: this.height,
				
				min: 0,   // grains of moisture / lb dry air
				max: 210  // grains of moisture / lb dry air
			}
		};
		
		this.graphHeight = this.height - this.properties.axes.x.height;
		this.graphWidth = this.width- this.properties.axes.y.width;


		// re-initialize all point graphX and graphY properties
		let MIN_DB = this.properties.axes.x.min;
		let MAX_DB = this.properties.axes.x.max;
		
		let MIN_W = this.properties.axes.y.min;
		let MAX_W = this.properties.axes.y.max;
		this.points.forEach(function(point) {
			point.properties.graphX = map(point.properties.db, MIN_DB, MAX_DB, 0, this.graphWidth);
			point.properties.graphY = map(point.properties.W * 7000, MIN_W, MAX_W, this.graphHeight, 0);
		}, this);


	};
	this.initProperties();
	
	this.moveScale = function(deltaX, deltaY) {
		this.scale.x.min += deltaX;
		this.scale.x.max += deltaX;
		this.scale.y.min += deltaY;
		this.scale.y.max += deltaY;
	};
	
	this.resize = function(newWidth, newHeight) {
		this.width = newWidth;
		this.height = newHeight;
		this.initProperties();
		this.draw();
	}
	
	this.mouseMoved = function(x, y) {
		var pt = this.pointFromXY(x, y);
		if (pt != null && pt.properties.rh <= 100) {
			document.getElementById("psychStats").innerHTML = pt.toString();
		}
	};

	this.mousePressed = function(x, y) {
		var pt = this.pointFromXY(x, y);
		if (pt != null && pt.properties.rh <= 100) {
			document.getElementById("psychStats").innerHTML = pt.toString();
		}
	}
	
	this.draw = function() {
		var start = new Date().getTime();
		this.drawGraph();
		this.drawLabels();
		this.drawPoints();
		var end = new Date().getTime();
		console.log("Drawing the graph took", end - start, "ms");
	}
	
	this.drawGraph = function() {
		
		this.drawSecondaryLines();
		this.drawPrimaryLines();
		
	};
	
	this.drawSecondaryLines = function() {


		stroke(this.properties.defaults.secondaryLineColor);
		strokeWeight(this.properties.defaults.secondaryLineStrokeWeight);
		
		
		let MIN_DB = this.properties.axes.x.min;
		let MAX_DB = this.properties.axes.x.max;
		
		let MIN_W = this.properties.axes.y.min;
		let MAX_W = this.properties.axes.y.max;
		
		let p = psych.calculations.PFt(this.properties.elevation);
		
		let rh = 100;
		for (let db = MIN_DB; db <= MAX_DB; db++) {
			if (db % 5 == 0) continue;
			let W = psych.calculations.WTR(p, db, rh) * 7000;
			let x = map(db, MIN_DB, MAX_DB, 0, this.graphWidth);
			let y = map(W, MIN_W, MAX_W, this.graphHeight, 0);
			line(x, this.graphHeight, x, y);
		}
		
		for (let W = MIN_W; W <= MAX_W; W = W + 2) {
			if (W % 10 == 0) continue;
			let db = psych.calculations.TRW(p, rh, W / 7000);
			let x = map(db, MIN_DB, MAX_DB, 0, this.graphWidth);
			let y = map(W, MIN_W, MAX_W, this.graphHeight, 0);
			line(x, y, this.graphWidth, y);
		}

		let min_wb = psych.calculations.BTW(p, MIN_DB, MIN_W / 7000);
		let max_wb = psych.calculations.BTW(p, MAX_DB, MAX_W / 7000);
		let wbIncrement = 1;
		min_wb += wbIncrement - (min_wb % wbIncrement);
		max_wb -= (max_wb % wbIncrement);

		for (let wb = min_wb; wb <= max_wb; wb = wb + wbIncrement) {
			if (wb % 5 == 0) continue;
			let startDb = wb;
			if (startDb < MIN_DB) {
				startDb = MIN_DB;
			}
			let startW = psych.calculations.WTB(p, startDb, wb) * 7000;
			let startX = map(startDb, MIN_DB, MAX_DB, 0, this.graphWidth);
			let startY = map(startW, MIN_W, MAX_W, this.graphHeight, 0);
			let endW = 0;
			let endDb = psych.calculations.TWB(p, endW, wb);
			if (endDb > MAX_DB) {
				endDb = MAX_DB;
				endW = psych.calculations.WTB(p, endDb, wb) * 7000;
			}
			let endX = map(endDb, MIN_DB, MAX_DB, 0, this.graphWidth);
			let endY = map(endW, MIN_W, MAX_W, this.graphHeight, 0);
			line(startX, startY, endX, endY);
		}
		
	};
	
	this.drawPrimaryLines = function() {
		
		stroke(this.properties.defaults.primaryLineColor);
		strokeWeight(this.properties.defaults.primaryLineStrokeWeight);
	
		let MIN_DB = this.properties.axes.x.min;
		let MAX_DB = this.properties.axes.x.max;
		
		let MIN_W = this.properties.axes.y.min;
		let MAX_W = this.properties.axes.y.max;
		
		let p = psych.calculations.PFt(this.properties.elevation);
		
		let rh = 100;
		for (let db = MIN_DB; db <= MAX_DB; db = db + 5) {
			let W = psych.calculations.WTR(p, db, rh) * 7000;
			let x = map(db, MIN_DB, MAX_DB, 0, this.graphWidth);
			let y = map(W, MIN_W, MAX_W, this.graphHeight, 0);
			line(x, this.graphHeight, x, y);
		}
		
		for (let W = MIN_W; W <= MAX_W; W = W + 10) {
			let db = psych.calculations.TRW(p, rh, W / 7000);
			let x = map(db, MIN_DB, MAX_DB, 0, this.graphWidth);
			let y = map(W, MIN_W, MAX_W, this.graphHeight, 0);
			line(x, y, this.graphWidth, y);
		}
	
		for (let h = 0; h <= 60; h = h + 5) {
			let startDb = psych.calculations.TRH(p, 100, h);
			let startW = psych.calculations.WTH(startDb, h) * 7000;
			let startX = map(startDb, MIN_DB, MAX_DB, 0, this.graphWidth);
			let startY = map(startW, MIN_W, MAX_W, this.graphHeight, 0);
			let endDb = psych.calculations.TWH(0, h);
			let endX = map(endDb, MIN_DB, MAX_DB, 0, this.graphWidth);
			if (endX > this.graphWidth) {
				endDb = this.properties.axes.x.max;
				endX = map(endDb, MIN_DB, MAX_DB, 0, this.graphWidth);
			}
			let endW = psych.calculations.WTH(endDb, h) * 7000;
			let endY = map(endW, MIN_W, MAX_W, this.graphHeight, 0);
			stroke(this.properties.defaults.primaryLineColor);
			strokeWeight(this.properties.defaults.primaryLineStrokeWeight);
			line(startX, startY, endX, endY);
			
		}

		let min_wb = psych.calculations.BTW(p, MIN_DB, MIN_W / 7000);
		let max_wb = psych.calculations.BTW(p, MAX_DB, MAX_W / 7000);
		let wbIncrement = 5;
		min_wb += wbIncrement - (min_wb % wbIncrement);
		max_wb -= (max_wb % wbIncrement);

		for (let wb = min_wb; wb <= max_wb; wb = wb + wbIncrement) {
			let startDb = wb;
			if (startDb < MIN_DB) {
				startDb = MIN_DB;
			}
			let startW = psych.calculations.WTB(p, startDb, wb) * 7000;
			let startX = map(startDb, MIN_DB, MAX_DB, 0, this.graphWidth);
			let startY = map(startW, MIN_W, MAX_W, this.graphHeight, 0);
			let endW = 0;
			let endDb = psych.calculations.TWB(p, endW, wb);
			if (endDb > MAX_DB) {
				endDb = MAX_DB;
				endW = psych.calculations.WTB(p, endDb, wb) * 7000;
			}
			let endX = map(endDb, MIN_DB, MAX_DB, 0, this.graphWidth);
			let endY = map(endW, MIN_W, MAX_W, this.graphHeight, 0);
			line(startX, startY, endX, endY);
		}

		
		for (j = 10; j <= 100; j = j + 10) {
			stroke(this.properties.defaults.primaryLineColor);
			strokeWeight(this.properties.defaults.primaryLineStrokeWeight);
			noFill();
			beginShape();
			for (var i = 0; i < this.graphWidth; i++) {
				var db = map(i, 0, this.graphWidth, MIN_DB, MAX_DB);
				var W = psych.calculations.WTR(p, db, j) * 7000;
				if (W > MAX_W) break;
				var y = map(W, MIN_W, MAX_W, this.graphHeight, 0);
				vertex(i, y);
			}
			endShape();
		}

	};
	
	this.drawLabels = function() {
		
		
		let MIN_DB = this.properties.axes.x.min;
		let MAX_DB = this.properties.axes.x.max;
		
		let MIN_W = this.properties.axes.y.min;
		let MAX_W = this.properties.axes.y.max;
		
		
		// draw RH labels
		var p = psych.calculations.PFt(this.properties.elevation);
		for (var rh = 10; rh < 100; rh = rh + 10) {
			textSize(12);
			var txt = rh + "%" + ((rh == 10) ? " RELATIVE HUMIDITY": "");
			var txtWidth = textWidth(txt);
			var x1 = 0.475 * this.graphWidth;
			var x2 = x1 + txtWidth;
			var db1 = map(x1, 0, this.graphWidth, MIN_DB, MAX_DB);
			var db2 = map(x2, 0, this.graphWidth, MIN_DB, MAX_DB);
			var W1 = psych.calculations.WTR(p, db1, rh);
			var W2 = psych.calculations.WTR(p, db2, rh);
			var y1 = map(W1 * 7000, MIN_W, MAX_W, this.graphHeight, 0);
			var y2 = map(W2 * 7000, MIN_W, MAX_W, this.graphHeight, 0);
			var a = atan((y2 - y1)/(x2 - x1));
			push();
			textAlign(LEFT,CENTER);
			translate(x1, y1);
			rotate(a);
			noStroke();
			fill(244, 249, 250);
			rect(0, -10, txtWidth, 16 + 4);
			fill(0);
			text(txt, 0, 0);
			pop();
		}
		
		// draw DB labels
		push();
		textAlign(CENTER,CENTER);
		textSize(12);
		translate(this.properties.axes.x.width / 2, this.graphHeight + (this.properties.axes.x.height * 2 / 3));
		fill(0);
		noStroke();
		text("DRY BUILB TEMPERATURE - " + String.fromCharCode(176) + "F", 0, 0);
		pop();
		
		
		for (let db = MIN_DB + 5; db <= MAX_DB; db = db + 5) {
			push();
			let x = map(db, MIN_DB, MAX_DB, 0, this.graphWidth);
			let y = this.graphHeight + (10);
			translate(x, y);
			fill(0);
			noStroke();
			textAlign(CENTER,CENTER);
			text(db, 0, 0);
			pop();
		}
		
		
		// draw W labels
		push();
		textAlign(CENTER,CENTER);
		textSize(12);
		translate(this.graphWidth + (this.properties.axes.y.width * 2 / 3), this.graphHeight / 2);
		rotate(-HALF_PI);
		fill(0);
		noStroke();
		text("HUMIDITY RATIO - GRAINS OF MOISTURE PER POUND OF DRY AIR", 0, 0);
		pop();
		
		
		for (let W = MIN_W + 10; W <= MAX_W; W = W + 10) {
			push();
			let x = this.graphWidth + 5 + (textWidth(W) / 2);
			let y = map(W, MIN_W, MAX_W, this.graphHeight, 0);
			translate(x, y);
			fill(0);
			noStroke();
			textAlign(CENTER,CENTER);
			text(W, 0, 0);
			pop();
		}
	}

	this.pointFromXY = function(x, y) {
		var db = map(x, 0, this.graphWidth, this.properties.axes.x.min, this.properties.axes.x.max);
		var W = map(y, 0, this.graphHeight, this.properties.axes.y.max, this.properties.axes.y.min) / 7000;
		if (W < 0) return null;
		var pt = new psych.PointBuilder()
			.withElevation(this.properties.elevation)
			.withDryBulb(db)
			.withHumidityRatio(W)
			.build();
		if (pt.properties.rh <= 100) {
			return pt;
		}
	}

	this.addPoint = function(point) {
		let MIN_DB = this.properties.axes.x.min;
		let MAX_DB = this.properties.axes.x.max;
		
		let MIN_W = this.properties.axes.y.min;
		let MAX_W = this.properties.axes.y.max;
		point.properties.graphX = map(point.properties.db, MIN_DB, MAX_DB, 0, this.graphWidth);
		point.properties.graphY = map(point.properties.W * 7000, MIN_W, MAX_W, this.graphHeight, 0);
		this.points.push(point);
		this.drawPoints();
	}

	this.addPointFromXY = function(x, y) {
		this.addPoint(this.pointFromXY(x, y));
	}

	this.drawPoints = function() {
		fill(200, 0, 0);
		noStroke();
		this.points.forEach(function(point) {
			ellipse(point.properties.graphX, point.properties.graphY, 10, 10);
		}, this);
	}



	this.drawEnthalpyLabels = function() {


	}



}