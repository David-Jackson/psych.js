function Graph(_width, _height) {
	this.width = _width;
	this.height = _height;
	this.points = [];
	this.lines = [];
	this.shapes = [];
	this.colors = {
		points: {
			grey: {
				stroke: color(57),
				fill: color(57)
			},
			green: {
				stroke: color(0, 255, 0),
				fill: color(0, 255, 0)
			},
			red: {
				stroke: color(255, 0, 0),
				fill: color(255, 0, 0)
			},
		},
		lines: {
			grey: {
				stroke: color(57),
				radius: null,
				fill: null
			},
			red: {
				stroke: color(255, 0, 0),
				radius: null,
				fill: null
			},
			green: {
				stroke: color(0, 255, 0),
				radius: null,
				fill: null
			},
			blue: {
				stroke: color(0, 0, 255),
				radius: null,
				fill: null
			},
			orange: {
				stroke: color(255, 127, 0),
				radius: null,
				fill: null
			},
		}
	};

	this.initProperties = function () {

		this.properties = {
			elevation: 0,
		};

		this.properties.defaults = {
			axesSize: 48,

			backgroundColor: color(255),
			textColor: color(0),

			primaryLineColor: color(149, 161, 175),
			primaryLineStrokeWeight: 1,

			secondaryLineColor: color(230),
			secondaryLineStrokeWeight: 1,


			pointRadius: 10,

			pointColor: color(182, 16, 29),
			shapeColor: color(255, 0, 0, 50),
			heatingColor: color(182, 16, 29),
			coolingColor: color(0, 0, 210),

			lineStroke: color(182, 16, 29),
			shapeStroke: color(182, 16, 29),

			lineWeight: 2,
		};

		this.properties.axes = {
			x: {
				width: this.width,
				height: this.properties.defaults.axesSize,

				min: 20, // degrees F
				max: 120 // degrees F
			},
			y: {
				width: this.properties.defaults.axesSize + 10,
				height: this.height,

				min: 0, // grains of moisture / lb dry air
				max: 210 // grains of moisture / lb dry air
			}
		};


	};

	this.updateProperties = function () {

		this.properties.axes.x.width = this.width;
		this.properties.axes.x.width = this.height;

		this.graphHeight = this.height - this.properties.axes.x.height;
		this.graphWidth = this.width - this.properties.axes.y.width;



		// re-initialize all point graphX and graphY properties
		let MIN_DB = this.properties.axes.x.min;
		let MAX_DB = this.properties.axes.x.max;

		let MIN_W = this.properties.axes.y.min;
		let MAX_W = this.properties.axes.y.max;
		this.points.forEach(function (point) {
			point.properties.graphX = map(point.properties.db, MIN_DB, MAX_DB, 0, this.graphWidth);
			point.properties.graphY = map(point.properties.W * 7000, MIN_W, MAX_W, this.graphHeight, 0);
		}, this);
	};
	this.initProperties();
	this.updateProperties();

	this.layers = {};

	this.initLayers = function () {
		this.layers = {
			chart: createGraphics(this.width, this.height),
			shapes: createGraphics(this.graphWidth, this.graphHeight),
			lines: createGraphics(this.graphWidth, this.graphHeight),
			points: createGraphics(this.graphWidth, this.graphHeight)
		};
		for (var layerName in this.layers) {
			this.layers[layerName].pixelDensity(1);
		}
	}

	this.clearLayers = function () {
		for (var layerName in this.layers) {
			this.layers[layerName].clear();
		}
	};

	this.drawLayers = function () {
		for (var layerName in this.layers) {
			image(this.layers[layerName], 0, 0);
		}
	};

	this.initLayers();

	this.moveScale = function (deltaX, deltaY) {
		this.scale.x.min += deltaX;
		this.scale.x.max += deltaX;
		this.scale.y.min += deltaY;
		this.scale.y.max += deltaY;
	};

	this.resize = function (newWidth, newHeight) {
		this.listeners.resized.forEach(callback => callback(newWidth, newHeight));

		this.width = newWidth;
		this.height = newHeight;
		this.updateProperties();
		this.initLayers();
		this.recalculateGraphPostitions();
		this.draw();
	}

	this.mouseMoved = function (x, y) {
		// this.listeners.mouseMoved.reduce((statsUpdated, callback) => {
		// 	var returnVal = callback();
		// 	if (returnVal)
		// })
		this.listeners.mouseMoved.forEach(callback => callback(x, y));

		var pt = this.pointFromXY(x, y);
		if (pt != null && pt.properties.rh <= 100) {
			document.getElementById("psychStats").innerHTML = pt.toHTML();
			return true;
		}
		return false;
	};

	this.mousePressed = function (x, y) {
		this.listeners.mousePressed.forEach(callback => callback(x, y));

		var pt = this.pointFromXY(x, y);
		if (pt != null && pt.properties.rh <= 100) {
			document.getElementById("psychStats").innerHTML = pt.toHTML();
		}
	}

	this.recalculateGraphPostitions = function () {
		this.points.forEach(pt => {
			this.calculatePosition(pt)
		});
		this.lines.forEach(line => {
			line.points.forEach(pt => {
				this.calculatePosition(pt)
			});
		});
		this.shapes.forEach(shape => {
			shape.points.forEach(pt => {
				this.calculatePosition(pt)
			});
		});
	}

	this.draw = function () {
		var start = new Date().getTime();
		this.clearLayers();
		this.drawGraph();
		this.drawLabels();
		this.drawShapes();
		this.drawLines();
		this.drawPoints();
		this.drawLayers();
		var end = new Date().getTime();
		console.log("Drawing the graph took", end - start, "ms");
	}

	this.drawGraph = function () {

		this.drawSecondaryLines();
		this.drawPrimaryLines();

	};

	this.drawSecondaryLines = function () {

		let pg = this.layers.chart;

		pg.stroke(this.properties.defaults.secondaryLineColor);
		pg.strokeWeight(this.properties.defaults.secondaryLineStrokeWeight);


		let MIN_DB = this.properties.axes.x.min;
		let MAX_DB = this.properties.axes.x.max;

		let MIN_W = this.properties.axes.y.min;
		let MAX_W = this.properties.axes.y.max;

		let p = psych.calculations.PFt(this.properties.elevation);

		let rh = 100;

		// Secondary Dry Bulb Lines
		for (let db = MIN_DB; db <= MAX_DB; db++) {
			if (db % 5 == 0) continue;
			let W = psych.calculations.WTR(p, db, rh) * 7000;
			let x = map(db, MIN_DB, MAX_DB, 0, this.graphWidth);
			let y = map(W, MIN_W, MAX_W, this.graphHeight, 0);
			pg.line(x, this.graphHeight, x, y);
		}


		// Secondary Humidity Ratio Lines
		for (let W = MIN_W; W <= MAX_W; W = W + 2) {
			if (W % 10 == 0) continue;
			let db = psych.calculations.TRW(p, rh, W / 7000);
			let x = map(db, MIN_DB, MAX_DB, 0, this.graphWidth);
			let y = map(W, MIN_W, MAX_W, this.graphHeight, 0);
			pg.line(x, y, this.graphWidth, y);
		}


		// Secondary Wet Bulb Lines
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
			pg.line(startX, startY, endX, endY);
		}

	};

	this.drawPrimaryLines = function () {

		let pg = this.layers.chart;

		pg.stroke(this.properties.defaults.primaryLineColor);
		pg.strokeWeight(this.properties.defaults.primaryLineStrokeWeight);
		pg.noFill();

		let MIN_DB = this.properties.axes.x.min;
		let MAX_DB = this.properties.axes.x.max;

		let MIN_W = this.properties.axes.y.min;
		let MAX_W = this.properties.axes.y.max;

		let p = psych.calculations.PFt(this.properties.elevation);

		let rh = 100;

		// Primary Dry Bulb Lines
		for (let db = MIN_DB; db <= MAX_DB; db = db + 5) {
			let W = psych.calculations.WTR(p, db, rh) * 7000;
			let x = map(db, MIN_DB, MAX_DB, 0, this.graphWidth);
			let y = map(W, MIN_W, MAX_W, this.graphHeight, 0);
			pg.line(x, this.graphHeight, x, y);
		}

		// Primary Humidity Ratio Lines
		for (let W = MIN_W; W <= MAX_W; W = W + 10) {
			let db = psych.calculations.TRW(p, rh, W / 7000);
			let x = map(db, MIN_DB, MAX_DB, 0, this.graphWidth);
			let y = map(W, MIN_W, MAX_W, this.graphHeight, 0);
			pg.line(x, y, this.graphWidth, y);
		}

		// Primary Enthalpy Lines
		// let intersectionLine = graph.helpers.lineFromTwoPoints(
		// 	createVector(1000, 0), createVector(0, 1000));

		let minH = psych.calculations.HTW(MIN_DB, MIN_W / 7000);
		let maxH = psych.calculations.HTW(MAX_DB, MAX_W / 7000);
		let hIncrement = 5;
		minH += hIncrement - (minH % hIncrement);
		maxH -= (maxH % hIncrement);
		for (let h = minH; h <= maxH; h = h + hIncrement) {
			let startDb = psych.calculations.TRH(p, 100, h);
			let startW = psych.calculations.WTH(startDb, h) * 7000;
			let startX = map(startDb, MIN_DB, MAX_DB, 0, this.graphWidth);
			let startY = map(startW, MIN_W, MAX_W, this.graphHeight, 0);
			let endDb = Math.min(psych.calculations.TWH(0, h), MAX_DB);
			let endX = map(endDb, MIN_DB, MAX_DB, 0, this.graphWidth);
			let endW = psych.calculations.WTH(endDb, h) * 7000;
			let endY = map(endW, MIN_W, MAX_W, this.graphHeight, 0);
			pg.line(startX, startY, endX, endY);

			// let line = graph.helpers.lineFromTwoPoints(
			// 	createVector(startX, startY), createVector(endX, endY));
			// let pt = line.intersect(intersectionLine);
			// pg.line(startX, startY, pt.x, pt.y);
			// console.log(line);
		}
		

		// Primary Wet Bulb Lines
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
			pg.line(startX, startY, endX, endY);
		}



		// Primary Relative Humidity Lines
		for (j = 10; j <= 100; j = j + 10) {
			pg.beginShape();
			for (var i = 0; i < this.graphWidth; i++) {
				var db = map(i, 0, this.graphWidth, MIN_DB, MAX_DB);
				var W = psych.calculations.WTR(p, db, j) * 7000;
				if (W > MAX_W) break;
				var y = map(W, MIN_W, MAX_W, this.graphHeight, 0);
				pg.vertex(i, y);
			}
			pg.endShape();
		}

	};

	this.drawLabels = function () {

		let pg = this.layers.chart;

		let MIN_DB = this.properties.axes.x.min;
		let MAX_DB = this.properties.axes.x.max;

		let MIN_W = this.properties.axes.y.min;
		let MAX_W = this.properties.axes.y.max;

		let p = psych.calculations.PFt(this.properties.elevation);

		// draw WB labels
		let min_wb = psych.calculations.BTW(p, MIN_DB, MIN_W / 7000);
		let max_wb = psych.calculations.BTW(p, MAX_DB, MAX_W / 7000);
		let wbIncrement = 5;
		min_wb += wbIncrement - (min_wb % wbIncrement);
		max_wb -= (max_wb % wbIncrement);
		for (let wb = min_wb; wb <= max_wb; wb = wb + wbIncrement) {
			pg.textSize(12);
			var txt = "" + wb + ((wb == max_wb - (2 * wbIncrement)) ? " WET BUILB TEMPERATURE - " + String.fromCharCode(176) + "F" : "");
			var txtWidth = pg.textWidth(txt);
			var db1 = psych.calculations.TRB(p, 68, wb);
			var db2 = psych.calculations.TRB(p, 100, wb);
			var W1 = psych.calculations.WTR(p, db1, 68);
			var W2 = psych.calculations.WTR(p, db2, 100);
			var x1 = map(db1, MIN_DB, MAX_DB, 0, this.graphWidth);
			var x2 = map(db2, MIN_DB, MAX_DB, 0, this.graphWidth);
			var y1 = map(W1 * 7000, MIN_W, MAX_W, this.graphHeight, 0);
			var y2 = map(W2 * 7000, MIN_W, MAX_W, this.graphHeight, 0);
			var a = atan((y2 - y1) / (x2 - x1));
			with(pg) {
				push();
				noStroke();
				textAlign(RIGHT, BOTTOM);
				fill(this.properties.defaults.textColor);
				text(txt.split(" ")[0], x2, y2);
				textAlign(LEFT, CENTER);
				translate(x1, y1);
				rotate(a);
				fill(this.properties.defaults.backgroundColor);
				rect(0, -6, txtWidth, 12);
				fill(this.properties.defaults.textColor);
				text(txt, 0, 0);
				pop();
			}
		}

		// draw RH labels
		for (var rh = 10; rh < 100; rh = rh + 10) {
			pg.textSize(12);
			var txt = rh + "%" + ((rh == 10) ? " RELATIVE HUMIDITY" : "");
			var txtWidth = pg.textWidth(txt);
			var x1 = 0.475 * this.graphWidth;
			var x2 = x1 + txtWidth;
			var db1 = map(x1, 0, this.graphWidth, MIN_DB, MAX_DB);
			var db2 = map(x2, 0, this.graphWidth, MIN_DB, MAX_DB);
			var W1 = psych.calculations.WTR(p, db1, rh);
			var W2 = psych.calculations.WTR(p, db2, rh);
			var y1 = map(W1 * 7000, MIN_W, MAX_W, this.graphHeight, 0);
			var y2 = map(W2 * 7000, MIN_W, MAX_W, this.graphHeight, 0);
			var a = atan((y2 - y1) / (x2 - x1));
			with(pg) {
				push();
				textAlign(LEFT, CENTER);
				translate(x1, y1);
				rotate(a);
				noStroke();
				fill(this.properties.defaults.backgroundColor);
				rect(0, -10, txtWidth, 16);
				fill(this.properties.defaults.textColor);
				text(txt, 0, 0);
				pop();
			}
		}

		// draw DB labels
		with(pg) {
			push();
			textAlign(CENTER, CENTER);
			textSize(12);
			translate(this.graphWidth / 2, this.graphHeight + (this.properties.axes.x.height * 2 / 3));
			fill(this.properties.defaults.textColor);
			noStroke();
			text("DRY BULB TEMPERATURE - " + String.fromCharCode(176) + "F", 0, 0);
			pop();
		}


		for (let db = MIN_DB + 5; db <= MAX_DB; db = db + 5) {
			let x = map(db, MIN_DB, MAX_DB, 0, this.graphWidth);
			let y = this.graphHeight + (10);
			with(pg) {
				push();
				translate(x, y);
				fill(this.properties.defaults.textColor);
				noStroke();
				textAlign(CENTER, CENTER);
				text(db, 0, 0);
				pop();
			}
		}

		// draw W labels
		with(pg) {
			push();
			textAlign(CENTER, CENTER);
			textSize(12);
			translate(this.graphWidth + (this.properties.axes.y.width * 2 / 3), this.graphHeight / 2);
			rotate(-HALF_PI);
			fill(this.properties.defaults.textColor);
			noStroke();
			text("HUMIDITY RATIO - GRAINS OF MOISTURE PER POUND OF DRY AIR", 0, 0);
			pop();
		}


		for (let W = MIN_W + 10; W <= MAX_W; W = W + 10) {
			let x = this.graphWidth + 5 + (textWidth(W) / 2);
			let y = map(W, MIN_W, MAX_W, this.graphHeight, 0);
			with(pg) {
				push();
				translate(x, y);
				fill(this.properties.defaults.textColor);
				noStroke();
				textAlign(CENTER, CENTER);
				text(W, 0, 0);
				pop();
			}
		}
	}

	this.pointFromXY = function (x, y) {
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

	this.calculatePosition = function (point) {
		let MIN_DB = this.properties.axes.x.min;
		let MAX_DB = this.properties.axes.x.max;

		let MIN_W = this.properties.axes.y.min;
		let MAX_W = this.properties.axes.y.max;
		point.properties.graphX = map(point.properties.db, MIN_DB, MAX_DB, 0, this.graphWidth);
		point.properties.graphY = map(point.properties.W * 7000, MIN_W, MAX_W, this.graphHeight, 0);
	}

	this.lineOfConstantRelativeHumidity = function (startPoint, endPoint) {
		graph.calculatePosition(startPoint);
		graph.calculatePosition(endPoint);

		let MIN_DB = graph.properties.axes.x.min;
		let MAX_DB = graph.properties.axes.x.max;

		let MIN_W = graph.properties.axes.y.min;
		let MAX_W = graph.properties.axes.y.max;

		var p = startPoint.properties.p;
		var rh = startPoint.properties.rh;
		var dir = startPoint.properties.db > endPoint.properties.db ? -1 : 1;
		var continueTest = (startPoint.properties.db > endPoint.properties.db) ? function (i, num) {
			return i >= num
		} : function (i, num) {
			return i < num
		};

		var res = [];

		for (var i = startPoint.properties.graphX; continueTest(i, endPoint.properties.graphX); i = i + dir) {
			var db = map(i, 0, graph.graphWidth, MIN_DB, MAX_DB);
			var W = psych.calculations.WTR(p, db, rh) * 7000;
			if (W > MAX_W) break;
			var y = map(W, MIN_W, MAX_W, graph.graphHeight, 0);
			res.push({
				properties: {
					graphX: i,
					graphY: y
				}
			});
		}

		return res;
	}

	this.addPoint = function (style, point, text = null) {
		this.calculatePosition(point);
		point.style = style;
		point.style.text = text;
		this.points.push(point);
	}

	this.addPoints = function (style, ...points) {
		points.forEach(point => this.addPoint(style, point));
	}

	this.addPointFromXY = function (x, y) {
		this.addPoint(null, this.pointFromXY(x, y));
	}

	this.addLine = function (style, points) {
		points.forEach(pt => {
			if (typeof pt.properties.graphX == "undefined") this.calculatePosition(pt)
		});
		this.lines.push({
			style: style,
			points: points
		});
	}

	this.addLineOfConstantRelativeHumidity = function (style, startPoint, endPoint) {
		var points = this.lineOfConstantRelativeHumidity(startPoint, endPoint);

		return this.addLine(style, points);
	}

	this.addShape = function (style, points) {
		points.forEach(pt => {
			if (typeof pt.properties.graphX == "undefined") this.calculatePosition(pt)
		});
		this.shapes.push({
			style: style,
			points: points
		});
	}

	this.tryToAssign = function (val, def) {
		return (typeof val == "undefined") ? def : val;
	}

	this.drawPoints = function () {
		var pg = this.layers.points;
		this.points.forEach(function (point) {
			point.style = point.style || {};
			var radius = this.tryToAssign(point.style.radius, this.properties.defaults.pointRadius);
			var fillColor = this.tryToAssign(point.style.fill, this.properties.defaults.pointColor);
			var strokeColor = this.tryToAssign(point.style.stroke, this.properties.defaults.pointStroke);
			var lineWeight = this.tryToAssign(point.style.weight, this.properties.defaults.pointWeight);
			var pointText = point.style.text;
			(fillColor == null) ? pg.noFill(): pg.fill(fillColor);
			(strokeColor == null) ? pg.noStroke(): pg.stroke(strokeColor);
			pg.strokeWeight(lineWeight);
			pg.ellipse(point.properties.graphX, point.properties.graphY, radius, radius);

			if (pointText != null) {
				pg.noStroke();
				pg.fill(255);
				pg.textAlign(CENTER, CENTER);
				pg.textSize(radius - 2);
				pg.text(pointText, point.properties.graphX, point.properties.graphY);
			}


		}, this);
	}

	this.drawLines = function () {
		var pg = this.layers.lines;
		this.lines.forEach(function (line) {
			line.style = line.style || {};
			var radius = this.tryToAssign(line.style.radius, this.properties.defaults.pointRadius);
			var fillColor = this.tryToAssign(line.style.fill, this.properties.defaults.shapeColor);
			var strokeColor = this.tryToAssign(line.style.stroke, this.properties.defaults.shapeStroke);
			var lineWeight = this.tryToAssign(line.style.weight, this.properties.defaults.lineWeight);
			var drawPoints = radius != null || fillColor != null;
			(fillColor == null) ? pg.noFill(): pg.fill(fillColor);
			(strokeColor == null) ? pg.noStroke(): pg.stroke(strokeColor);
			pg.strokeWeight(lineWeight);
			for (var i = 0; i < line.points.length; i++) {
				var p1 = line.points[i];
				if (i < line.points.length - 1) {
					// draw line between two points
					var p2 = line.points[i + 1];
					pg.line(p1.properties.graphX, p1.properties.graphY,
						p2.properties.graphX, p2.properties.graphY);
				}
				if (drawPoints) {
					pg.ellipse(p1.properties.graphX, p1.properties.graphY, radius, radius);
				}
			}
		}, this);
	}

	this.drawShapes = function () {
		var pg = this.layers.shapes;
		this.shapes.forEach(function (shape) {
			shape.style = shape.style || {};
			var radius = this.tryToAssign(shape.style.radius, null);
			var fillColor = this.tryToAssign(shape.style.fill, this.properties.defaults.shapeColor);
			var strokeColor = this.tryToAssign(shape.style.stroke, this.properties.defaults.lineStroke);
			var lineWeight = this.tryToAssign(shape.style.weight, this.properties.defaults.lineWeight);
			var drawPoints = radius != null;
			(fillColor == null) ? pg.noFill(): pg.fill(fillColor);
			(strokeColor == null) ? pg.noStroke(): pg.stroke(strokeColor);
			pg.strokeWeight(lineWeight);
			pg.beginShape();
			shape.points.forEach(function (pt) {
				pg.vertex(pt.properties.graphX, pt.properties.graphY);
				if (drawPoints) {
					pg.ellipse(pt.properties.graphX, pt.properties.graphY, radius, radius);
				}
			});
			pg.endShape(CLOSE);
		}, this);
	}



	this.drawEnthalpyLabels = function () {


	}


	this.helpers = {
		Line: function (slope, yIntercept) {
			this.slope = slope;
			this.yIntercept = yIntercept;

			this.x = function (y) {
				return (y - this.yIntercept) / this.slope;
			}

			this.y = function (x) {
				return (this.slope * x) + this.yIntercept;
			}

			this.intersect = function (otherLine) {
				var x = (otherLine.yIntercept - this.yIntercept) / (this.slope - otherLine.slope);
				var y = this.y(x);
				return createVector(x, y);
			}

			return this;
		},
		lineFromTwoPoints: function (v1, v2) {
			var slope = (v1.y - v2.y) / (v1.x - v2.x);
			return this.lineFromSlopeAndPoint(slope, v1);
		},
		lineFromSlopeAndPoint: function (slope, v1) {
			var yIntercept = v1.y - (slope * v1.x);
			return new this.Line(slope, yIntercept);
		}
	}

	this.listeners = {
		"mouseMoved": [],
		"mousePressed": [],
		"resized": [],
	}

	this.addListener = function(name, callback) {
		this.listeners[name].push(callback)
	}

	this.clearListeners = function(name) {
		if (this.listeners[name]) {
			this.listeners[name] = [];
		}
	}

	this.clearAllListeners = function() {
		for (var name in this.listeners) {
			this.listeners[name] = [];
		}
	}
}