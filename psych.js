window.psych = window.psych || {};

psych.Point = function (opts) {


	this.functions = {
		_props: opts,
		p() {
			let elev = this._props.elevation;
			if (elev === null) {
				console.error("Malformed point");
				return null;
			}
			this._props.p = psych.calculations.PFt(elev);
			return this._props.p;
		},
		rh() {
			let p = this._props.p;
			let db = this._props.db;
			let W = this._props.W;
			if (p && db && W === null) {
				console.error("Malformed point");
				return null;
			}
			this._props.rh = psych.calculations.RTW(p, db, W);
			return this._props.rh;
		},
		h() {
			let db = this._props.db;
			let W = this._props.W;
			if (db && W === null) {
				console.error("Malformed point");
				return null;
			}
			this._props.h = psych.calculations.HTW(db, W);
			return this._props.h;
		},
		wb() {
			let p = this._props.p;
			let db = this._props.db;
			let W = this._props.W;
			if (p && db && W === null) {
				console.error("Malformed point");
				return null;
			}
			this._props.wb = psych.calculations.BTW(p, db, W);
			return this._props.wb;
		},
		dp() {
			let p = this._props.p;
			let W = this._props.W;
			if (p && W === null) {
				console.error("Malformed point");
				return null;
			}
			this._props.dp = psych.calculations.DW(p, W);
			return this._props.dp;
		},
		v() {
			let p = this._props.p;
			let db = this._props.db;
			let rh = this._props.rh;
			if (p && db && rh === null) {
				console.error("Malformed point");
				return null;
			}
			this._props.v = psych.calculations.V(p, db, rh);
			return this._props.v;
		}
	};

	this.toHTML = function () {
		return (
			"<p>Elevation: " + this.properties.elevation + "ft</p>" +
			"<p>Dry Bulb Temp: " + this.properties.db.toFixed(2) + String.fromCharCode(176) + "F</p>" +
			"<p>Wet Bulb Temp: " + this.properties.wb.toFixed(2) + String.fromCharCode(176) + "F</p>" +
			"<p>Relative Humidity: " + this.properties.rh.toFixed(2) + "%</p>" +
			"<p>Humidity Ratio: " + (this.properties.W * 7000).toFixed(2) + " grains/lb</p>" +
			"<p>Enthalpy: " + this.properties.h.toFixed(2) + " BTU/lb</p>" +
			"<p>Dew Point: " + this.properties.dp.toFixed(2) + String.fromCharCode(176) + "F</p>"
		);
	};

	this.properties = opts;

	this.definedProperties = [];
	for (var p in opts) {
		this.definedProperties.push(p);
	}

	this.calculate = function () {
		for (var p in this.properties) {
			if (this.definedProperties.indexOf(p) == -1) delete this.properties[p];
		}
		for (var thing in this.functions) {
			if (typeof this.functions[thing] == "function") this.functions[thing]();
		}
	}

	this.calculate();
}

psych.PointBuilder = function () {
	this.properties = {};
	//		db //
	//		wb //
	//		W //
	//		h //
	//		dp
	//		rh //
	//		v 

	this.possibleCombinations = {
		elevation: {
			db: {
				wb: "calcPointWithDbWb",
				rh: "calcPointWithDbRh",
				W: "calcPointWithDbW",
				h: "calcPointWithDbH",
				dp: "calcPointWithDbDp",
			},
			wb: {
				rh: "calcPointWithWbRh",
				W: "calcPointWithWbW",
				dp: "calcPointWithWbDp",
				// h: "calcPointWithWbH" // Excluded for the time being
			},
			rh: {
				W: "calcPointWithRhW",
				h: "calcPointWithRhH",
				dp: "calcPointWithRhDp",
			},
			W: {
				h: "calcPointWithWH"
			}
		}
	};

	this.calcPointWithDbWb = function () {
		let elevation = this.properties.elevation;
		let db = this.properties.db;
		let wb = this.properties.wb;
		let p = this.properties.atmPressure;

		return {
			elevation: elevation,
			db: db,
			W: psych.calculations.WTB(p, db, wb)
		}

	}

	this.calcPointWithDbRh = function () {
		let elevation = this.properties.elevation;
		let p = this.properties.atmPressure;
		let db = this.properties.db;
		let rh = this.properties.rh;

		return {
			elevation: elevation,
			db: db,
			W: psych.calculations.WTR(p, db, rh)
		}
	}

	this.calcPointWithDbW = function () {
		let elevation = this.properties.elevation;
		let db = this.properties.db;
		let W = this.properties.W;

		return {
			elevation: elevation,
			db: db,
			W: W
		}
	}

	this.calcPointWithDbH = function () {
		let elevation = this.properties.elevation;
		let p = this.properties.atmPressure;
		let db = this.properties.db;
		let h = this.properties.h;

		return {
			elevation: elevation,
			db: db,
			W: psych.calculations.WTH(db, h)
		}
	}

	this.calcPointWithDbDp = function () {
		let elevation = this.properties.elevation;
		let p = this.properties.atmPressure;
		let db = this.properties.db;
		let dp = this.properties.dp;

		return {
			elevation: elevation,
			db: db,
			W: psych.calculations.WD(p, dp)
		}
	}

	this.calcPointWithWbRh = function () {
		let elevation = this.properties.elevation;
		let p = this.properties.atmPressure;
		let wb = this.properties.wb;
		let rh = this.properties.rh;

		return {
			elevation: elevation,
			db: psych.calculations.TRB(p, rh, wb),
			W: psych.calculations.WRB(p, rh, wb)
		}
	}

	this.calcPointWithWbW = function () {
		let elevation = this.properties.elevation;
		let p = this.properties.atmPressure;
		let wb = this.properties.wb;
		let W = this.properties.W;

		return {
			elevation: elevation,
			db: psych.calculations.TWB(p, W, wb),
			W: W
		}
	}

	this.calcPointWithWbDp = function () {
		let elevation = this.properties.elevation;
		let p = this.properties.atmPressure;
		let wb = this.properties.wb;
		let dp = this.properties.dp;

		return {
			elevation: elevation,
			db: psych.calculations.TWB(p, W, wb),
			W: psych.calculations.WD(p, dp)
		}
	}

	//	this.calcPointWithWbH = function() {
	//		
	//	}

	this.calcPointWithRhW = function () {
		let elevation = this.properties.elevation;
		let p = this.properties.atmPressure;
		let rh = this.properties.rh;
		let W = this.properties.W;

		return {
			elevation: elevation,
			db: psych.calculations.TRW(p, rh, W),
			W: W
		}
	}

	this.calcPointWithRhH = function () {
		let elevation = this.properties.elevation;
		let p = this.properties.atmPressure;
		let rh = this.properties.rh;
		let h = this.properties.h;

		return {
			elevation: elevation,
			db: psych.calculations.TRH(p, rh, h),
			W: psych.calculations.WRH(p, rh, h)
		}
	}

	this.calcPointWithRhDp = function () {
		let elevation = this.properties.elevation;
		let p = this.properties.atmPressure;
		let rh = this.properties.rh;
		let dp = this.properties.dp;

		return {
			elevation: elevation,
			db: psych.calculations.TRH(p, rh, h),
			W: psych.calculations.WD(p, dp)
		}
	}

	this.calcPointWithWH = function () {
		let elevation = this.properties.elevation;
		let p = this.properties.atmPressure;
		let h = this.properties.h;
		let W = this.properties.W;

		return {
			elevation: elevation,
			db: psych.calculations.TWH(W, h),
			W: W
		}
	}

	this.withElevation = function (e) {
		if (e instanceof psych.Point) {
			return this.withElevation(e.properties.elevation);
		}
		this.properties.elevation = e;
		this.properties.atmPressure = psych.calculations.PFt(e);
		return this;
	}

	this.withDryBulb = function (temp) {
		if (temp instanceof psych.Point) {
			return this.withDryBulb(temp.properties.db);
		}
		this.properties.db = temp;
		return this;
	}

	this.withWetBulb = function (temp) {
		if (temp instanceof psych.Point) {
			return this.withWetBulb(temp.properties.wb);
		}
		this.properties.wb = temp;
		return this;
	}

	this.withRelativeHumidity = function (relHum) {
		if (relHum instanceof psych.Point) {
			return this.withRelativeHumidity(relHum.properties.rh);
		}
		this.properties.rh = relHum;
		return this;
	}

	this.withHumidityRatio = function (humRat) {
		if (humRat instanceof psych.Point) {
			return this.withHumidityRatio(humRat.properties.W);
		}
		this.properties.W = humRat;
		return this;
	}

	this.withEnthalpy = function (enth) {
		if (enth instanceof psych.Point) {
			return this.withEnthalpy(enth.properties.h);
		}
		this.properties.h = enth;
		return this;
	}

	this.withDewPoint = function (temp) {
		if (temp instanceof psych.Point) {
			return this.withDewPoint(temp.properties.dp);
		}
		this.properties.dp = temp;
		return this;
	}

	this.getBaseProperties = function (possibilities) {
		let baseProps = null;
		possibilities = possibilities || this.possibleCombinations;


		for (let x in possibilities) {
			if (typeof this.properties[x] != "undefined") {
				if (typeof possibilities[x] == "object") {
					baseProps = this.getBaseProperties(possibilities[x]);
				} else {
					let func = possibilities[x];
					baseProps = this[func]();
				}
				break;
			}
		}

		return baseProps;
	}

	this.build = function () {
		let baseProps = this.getBaseProperties();

		if (baseProps === null) {
			console.error("Malformed builder");
			return null;
		}

		return new psych.Point({
			elevation: baseProps.elevation,
			db: baseProps.db,
			W: baseProps.W
		});
	}
}

psych.Line = window.psych.Line || {};

psych.Line.LineOfConstantDBandRH = function(style, pt1, pt2, segmentsPerDegree = 100) {

	this.style = style;
	this.inputPoint1 = pt1;
	this.inputPoint2 = pt2;

	this.STEPS = Math.abs(
		this.inputPoint2.properties.db - this.inputPoint1.properties.db
	) * segmentsPerDegree;

	// just in case the two db temps are the same
	if (this.STEPS == 0) {
		this.STEPS = Math.abs(
			this.inputPoint2.properties.rh - this.inputPoint1.properties.rh
		) * segmentsPerDegree;
	}


	this.calculate = function() {
        var deltaDB = (this.inputPoint2.properties.db - this.inputPoint1.properties.db) / this.STEPS;
        var deltaRH = (this.inputPoint2.properties.rh - this.inputPoint1.properties.rh) / this.STEPS;
        this.linePoints = [];
        for (let i = 0; i <= this.STEPS; i++) {
            var pt = new psych.PointBuilder()
                .withElevation(this.inputPoint1)
                .withDryBulb(this.inputPoint1.properties.db + (i * deltaDB))
                .withRelativeHumidity(this.inputPoint1.properties.rh + (i * deltaRH))
                .build();
            this.linePoints.push(pt);
        }
    }

    this.draw = function() {
        graph.addLine(graph.colors.lines.orange, this.linePoints);
    }
	
	this.findIntersection = function(propertyName, value) {

        if (!this.isBetween(propertyName, value)) {
            console.log("Cannot find intersection: a", propertyName, "of", value, "is not within line");
            return;
        }

        var ITERATION_LIMIT = 1000;
        var iterCount = 0;

        var leftIndex = 0;
        var rightIndex = this.linePoints.length - 1;
        var midIndex = Math.floor((leftIndex + rightIndex) / 2);

        var arrayOrderAdjustment = 1;
        // swap the comparator if the line is "reversed" (ordered largest to smallest)
        if (this.linePoints[rightIndex].properties[propertyName] < this.linePoints[leftIndex].properties[propertyName]) {
            arrayOrderAdjustment = -1;
        }
        
        while (rightIndex - leftIndex > 1) {
            
            iterCount++;
            if (iterCount > ITERATION_LIMIT) break;
            
            if ((arrayOrderAdjustment * value) < (arrayOrderAdjustment * this.linePoints[midIndex].properties[propertyName])) {
                rightIndex = midIndex;
            } else {
                leftIndex = midIndex;
            }
            
            midIndex = Math.floor((leftIndex + rightIndex) / 2);

        }


        var guessPoint = this.linePoints[midIndex];
        
        graph.addPoints(graph.colors.points.green, guessPoint);
        return guessPoint;
    }

    this.isBetween = function(propertyName, value, pt1 = this.inputPoint1, pt2 = this.inputPoint2) {
        if (!pt1.properties[propertyName] || !pt2.properties[propertyName]) {
            console.error("Invalid property name", propertyName, "in", pt1, pt2);
        }
        var pt1Val = pt1.properties[propertyName];
        var pt2Val = pt2.properties[propertyName];
        var maxVal = Math.max(pt1Val, pt2Val);
        var minVal = Math.min(pt1Val, pt2Val);

        return minVal <= value && value <= maxVal;
    }

	this.isLessThan = function(propertyName, value, pt1 = this.inputPoint1, pt2 = this.inputPoint2) {
        if (!pt1.properties[propertyName] || !pt2.properties[propertyName]) {
            console.error("Invalid property name", propertyName, "in", pt1, pt2);
        }
		return Math.min(pt1.properties[propertyName], pt2.properties[propertyName]) > value;
	}
	
	this.isGreaterThan = function(propertyName, value, pt1 = this.inputPoint1, pt2 = this.inputPoint2) {
        if (!pt1.properties[propertyName] || !pt2.properties[propertyName]) {
            console.error("Invalid property name", propertyName, "in", pt1, pt2);
        }
		return Math.max(pt1.properties[propertyName], pt2.properties[propertyName]) < value;
	}

	this.getPointOfHighest = function(propertyName) {
		if (this.inputPoint1.properties[propertyName] > this.inputPoint2.properties[propertyName]) {
			return this.inputPoint1;
		} else {
			return this.inputPoint2
		}
	}

	this.getPointOfLowest = function(propertyName) {
		if (this.inputPoint1.properties[propertyName] < this.inputPoint2.properties[propertyName]) {
			return this.inputPoint1;
		} else {
			return this.inputPoint2
		}
	}
}


psych.MixedFlow = function (pt1, pt2) {
	this.requiredParameters = ["elevation", "db", "W", "volume", "v"];
	this.requiredParameters.forEach(function (p) {
		if (typeof pt1.properties[p] == "undefined") {
			console.error(p + " not defined in Point 1");
			return null;
		}
		if (typeof pt2.properties[p] == "undefined") {
			console.error(p + " not defined in Point 2");
			return null;
		}
	});

	if (pt1.properties.elevation != pt2.properties.elevation) {
		console.error("Elevations of the provided points do not match.");
		return null;
	}

	var mFlow1 = pt1.properties.volume * 60 / pt1.properties.v;
	var mFlow2 = pt2.properties.volume * 60 / pt2.properties.v;
	var mFlow3 = mFlow1 + mFlow2;

	var mixedPoint = new psych.PointBuilder()
		.withElevation(pt1.properties.elevation)
		.withDryBulb(pt2.properties.db - (pt2.properties.db - pt1.properties.db) * (mFlow1 / mFlow3))
		.withHumidityRatio(pt2.properties.W - (pt2.properties.W - pt1.properties.W) * (mFlow1 / mFlow3))
		.build();

	mixedPoint.properties.volume = pt1.properties.volume + pt2.properties.volume;

	return mixedPoint;
};

psych.constants = {
	INPSI: (760 * 9.80665 * 0.45359237) / (Math.pow(25.4, 3) * 0.101325), // INPSI = inHg per psia
	MA: 28.9645, // Molecular weight of air
	MW: 18.01528, // Molecular weight of water

	C1: 0.240145, // C1 thru C4 are constants used in the equation for h
	C2: 0.0000016,
	C3: 1061.1,
	C4: 0.4328,

	K1: 1.00402, // K1 thru K3 are constants used in the equation for W
	K2: 1.016,
	K3: 0.0000025,

	// ASHRAE constants for PWS equations:
	P1: -10214.165,
	P2: -4.8932428,
	P3: -0.0053765794,
	P4: 0.00000019202377,
	P5: 3.5575832E-10,
	P6: -9.0344688E-14,
	P7: 4.1635019,
	P8: -10440.397,
	P9: -11.29465,
	P10: -0.027022355,
	P11: 0.00001289036,
	P12: -2.4780681E-09,
	P13: 6.5459673,

	densityOfWater: 8.337, // lb/gal
};

psych.calculations = {

	humidification: {
		// Determines the humidification effiency between two points.
		// Assumes that pt1 is heated/cooled to pt2's enthalpy.
		// Thus calculates the efficiency between pt1's humidity ratio, pt2's humidity ratio, 
		// and the humidity ratio at saturation given pt2's enthalpy.
		efficiency(pt1, pt2) {
			var intermediatePt = new psych.PointBuilder()
				.withElevation(pt2.properties.elevation)
				.withHumidityRatio(pt1.properties.W)
				.withEnthalpy(pt2.properties.h)
				.build();
			var saturationPt = new psych.PointBuilder()
				.withElevation(pt2.properties.elevation)
				.withRelativeHumidity(100)
				.withEnthalpy(pt2.properties.h)
				.build();
			return (pt2.properties.W - intermediatePt.properties.W) /
				(saturationPt.properties.W - intermediatePt.properties.W); // %
		},

		evaporationRate(inletPoint, outletPoint, volumeInCFM) {
			var density = 1 / outletPoint.properties.v; // lb/ft^3
			var massFlowRate = density * volumeInCFM; // lb/min
			return (outletPoint.properties.W - inletPoint.properties.W) * massFlowRate / psych.constants.densityOfWater; // gpm
		},

		// returns an outlet point saturated to a given efficiency of an inlet point
		maximumSaturation(pt, saturationEfficiency = 1.00) {
			var saturationPt = new psych.PointBuilder()
				.withElevation(pt)
				.withRelativeHumidity(100)
				.withEnthalpy(pt)
				.build();
			
			var maxW = (saturationEfficiency * (saturationPt.properties.W - pt.properties.W)) + pt.properties.W;

			return new psych.PointBuilder()
				.withElevation(pt)
				.withEnthalpy(pt)
				.withHumidityRatio(maxW)
				.build();
		}
	},

	cooling: {
		capacity(inletPoint, outletPoint, volumeInCFM) {
			var density = 1 / outletPoint.properties.v; // lb/ft^3
			var massFlowRate = density * volumeInCFM * 60; // lb/hr
			return -(outletPoint.properties.h - inletPoint.properties.h) * massFlowRate; // BTU/hr
		},

		// rate at which the cooling coil removes water from the air
		condensationRate(inletPoint, outletPoint, volumeInCFM) {
			var density = 1 / outletPoint.properties.v; // lb/ft^3
			var massFlowRate = density * volumeInCFM; // lb/min
			return -(outletPoint.properties.W - inletPoint.properties.W) * massFlowRate / psych.constants.densityOfWater; // gpm
		},

		flowrate(inletPoint, outletPoint, volumeInCFM, deltaTofCoolingFluid) {
			var capacity = this.capacity(inletPoint, outletPoint, volumeInCFM);
			var specificHeatOfWater = 1.0; // BTU / (lb * degF) //0.9602 // water with 15% glycol //
			return capacity / (specificHeatOfWater * deltaTofCoolingFluid * psych.constants.densityOfWater * 60); // gpm
		}
	},

	heating: {
		capacity(inletPoint, outletPoint, volumeInCFM) {
			if (inletPoint.properties.W != outletPoint.properties.W) {
				console.warn("Inlet and outlet points don't have some Humidity Ratio, using inlet point's Humidity Ratio");
			}
			var density = 1 / outletPoint.properties.v; // lb/ft^3
			var massFlowRate = density * volumeInCFM * 60; // lb/hr
			return (outletPoint.properties.h - inletPoint.properties.h) * massFlowRate; // BTU/hr
		}
	},

	PFt(Ft) {
		return (760 / 25.4) * Math.pow((1 - 0.0000068753 * Ft), 5.2559);
	},

	PinWg(InWg) {
		return InWg * (760 / 25.4) / (101325 / 248.84);
	},

	Ppsia(psia) {
		return psia * psych.constants.INPSI;
	},

	Ppsig(psig) {
		return psig * psych.constants.INPSI + 760 / 25.4;
	},

	PAtm(Atm) {
		return Atm * 760 / 25.4;
	},

	saturationPressureWaterVapor(TR) {
		return Math.exp(
			psych.constants.P1 / TR +
			psych.constants.P2 +
			psych.constants.P3 * TR +
			psych.constants.P4 * Math.pow(TR, 2) +
			psych.constants.P5 * Math.pow(TR, 3) +
			psych.constants.P6 * Math.pow(TR, 4) +
			psych.constants.P7 * Math.log(TR)
		)
	},

	saturationPressureLiquidWater(TR) {
		return Math.exp(
			psych.constants.P8 / TR +
			psych.constants.P9 +
			psych.constants.P10 * TR +
			psych.constants.P11 * Math.pow(TR, 2) +
			psych.constants.P12 * Math.pow(TR, 3) +
			psych.constants.P13 * Math.log(TR)
		)
	},

	PWS(TF) {
		let TR = TF + 459.67;

		if (TF >= 32.5) {
			return psych.constants.INPSI * this.saturationPressureLiquidWater(TR);
		} else if (TF > 31.5) {
			return (TF - 31.5) * psych.constants.INPSI * this.saturationPressureLiquidWater(TR) +
				(32.5 - TF) * psych.constants.INPSI * this.saturationPressureWaterVapor(TR);
		} else {
			return psych.constants.INPSI * this.saturationPressureWaterVapor(TR);
		}
	},

	PW(TF, RH) {
		if (RH < 0) {
			return null;
		}
		return RH * this.PWS(TF) / 100
	},

	V(P, TF, RH) {
		if (RH < 0) {
			return null;
		}
		return 13.349 * (TF + 459.67) *
			(1 + psych.constants.MA * this.WTR(P, TF, RH) / psych.constants.MW) /
			(P * 25.4 * 529.67 / 760);
	},

	TRW(P, RH, W) {
		if (RH < 0 || W < 0) {
			return null;
		}
		let PWSTDP = P / (
			(psych.constants.MW / psych.constants.MA) * psych.constants.K1 /
			(W + psych.constants.K3) + psych.constants.K2
		);
		let PWS2 = PWSTDP * 100 / RH;
		return this.TPws(PWS2);
	},

	TWR(P, W, RH) {
		return this.TRW(P, RH, W)
	},

	TRH(P, RH, H) {
		let g2 = 70;
		let g1 = 71;
		let e1 = (H - (psych.constants.C1 + psych.constants.C2 * g1) * g1) /
			(psych.constants.C3 + psych.constants.C4 * g1) - this.WTR(P, g1, RH);
		let iterCount = 0,
			iterCountLimit = 10000;
		while (true) {
			if (iterCount++ > iterCountLimit) {
				console.error("ITER LIMIT REACHED TRH", P, RH, H);
				break;
			}
			let e2 = (H - (psych.constants.C1 + psych.constants.C2 * g2) * g2) /
				(psych.constants.C3 + psych.constants.C4 * g2) - this.WTR(P, g2, RH); // Error of current guess
			if (e2 == 0 || e1 - e2 == 0) {
				break;
			} else if (Math.log10(Math.abs(e2)) <= -13) {
				break;
			}
			let g3 = g2 - ((g1 - g2) * e2 / (e1 - e2)); // Calc new guess
			g1 = g2;
			e1 = e2; // Swap old guess with current guess
			g2 = g3; // Swap current guess with new guess
		} // Try again
		return g2;
	},

	THR(P, H, RH) {
		return this.TRH(P, RH, H);
	},

	TRD(RH, TDP) {
		return this.TPws(this.PWS(TDP) * 100 / RH);
	},

	TDR(TDP, RH) {
		return this.TRD(RH, TDP);
	},

	TRB(P, RH, WBF) {
		if (RH < 0) {
			return null;
		}
		let pws_wbf = this.PWS(WBF);
		let g2 = 70
		let g1 = 71
		let e1 = (pws_wbf - ((P - pws_wbf) * (g1 - WBF)) / (2830 - 1.44 * WBF)) - RH * this.PWS(g1) / 100;
		let iterCount = 0,
			iterCountLimit = 10000;
		while (true) {
			if (iterCount++ > iterCountLimit) {
				console.error("ITER LIMIT REACHED TRB", P, RH, WBF);
				break;
			}
			let e2 = (pws_wbf - ((P - pws_wbf) * (g2 - WBF)) / (2830 - 1.44 * WBF)) - RH * this.PWS(g2) / 100;
			if (e2 == 0 || e1 - e2 == 0) {
				break;
			} else if (Math.log10(Math.abs(e2)) <= -13) {
				break;
			}
			let g3 = g2 - ((g1 - g2) * e2 / (e1 - e2)); // Calc new guess
			g1 = g2;
			e1 = e2; // Swap old guess with current guess
			g2 = g3; // Swap current guess with new guess
		} // Try again
		return g2;
	},

	TBR(P, WBF, RH) {
		return this.TRB(P, RH, WBF);
	},

	TWH(W, H) {
		let c = psych.constants;
		return (-(c.C1 + W * c.C4) + Math.pow((Math.pow((c.C1 + W * c.C4), 2) - 4 * c.C2 * (W * c.C3 - H)), 0.5)) / (2 * c.C2);
	},

	THW(H, W) {
		return this.TWH(W, H);
	},

	TWB(P, W, WBF) {
		let c = psych.constants;
		let PWSTDP = P / ((c.MW / c.MA) * c.K1 / (W + c.K3) + c.K2);
		let pws_wbf = this.PWS(WBF);
		return WBF + (pws_wbf - PWSTDP) * (2830 - 1.44 * WBF) / (P - pws_wbf);
	},

	TBW(P, WBF, W) {
		return this.TWB(P, W, WBF);
	},

	THD(P, H, TDP) {
		W = this.WD(P, TDP);
		return this.TWH(W, H);
	},

	TDH(P, TDP, H) {
		return this.THD(P, H, TDP);
	},

	TDB(P, TDP, WBF) {
		W = this.WD(P, TDP)
		return this.TWB(P, W, WBF);
	},

	TBD(P, WBF, TDP) {
		return this.TDB(P, TDP, WBF);
	},

	TF(TC) {
		return 1.8 * TC + 32;
	},

	TC(TF) {
		return (TF - 32) / 1.8;
	},

	TPws(PWS2) {
		let g2 = 300; // First guess for TF
		let g1 = 301; // Old guess
		let e1 = PWS2 - this.PWS(g1); // Error of old guess
		let iterCount = 0,
			iterCountLimit = 10000;
		while (true) {
			if (iterCount++ > iterCountLimit) {
				console.error("ITER LIMIT REACHED TPws", PWS2);
				break;
			}
			let e2 = PWS2 - this.PWS(g2) // Error of current guess
			if (e2 == 0 || e1 - e2 == 0) {
				break;
			} else if (Math.log10(Math.abs(e2)) <= -13) {
				break;
			}
			let g3 = g2 - ((g1 - g2) * e2 / (e1 - e2)); //Calc new guess

			g1 = g2;
			e1 = e2; // Swap old guess with current guess
			g2 = g3; // Swap current guess with new guess
		} // Try again
		return g2;
	},

	RTW(P, TF, W) {
		if (W < 0) {
			return null;
		}
		let c = psych.constants;
		let PWSTDP = P / (
			(c.MW / c.MA) * c.K1 /
			(W + c.K3) + c.K2
		);
		return (W == 0) ? 0 : PWSTDP * 100 / this.PWS(TF);
	},

	RWT(P, W, TF) {
		return this.RTW(P, TF, W);
	},

	RTH(P, TF, H) {
		let c = psych.constants;
		let W = (H - (c.C1 + c.C2 * TF) * TF) /
			(c.C3 + c.C4 * TF);
		return this.RTW(P, TF, W);
	},

	RHT(P, H, TF) {
		return this.RTH(P, TF, H);
	},

	RD(TF, TDP) {
		return this.PWS(TDP) * 100 / this.PWS(TF);
	},

	RDT(TDP, TF) {
		return this.RD(TF, TDP);
	},

	RTB(P, TF, WBF) {
		let pws_wbf = this.PWS(WBF);
		let PW2 = pws_wbf - ((P - pws_wbf) * (TF - WBF)) / (2830 - 1.44 * WBF); // Carrier's equation
		return PW2 * 100 / this.PWS(TF);
	},

	RBT(P, WBF, TF) {
		return this.RTB(P, TF, WBF);
	},

	RWH(P, W, H) {
		return this.RTW(P,
			(
				-(psych.constants.C1 + W * psych.constants.C4) +
				(Math.pow((psych.constants.C1 + W * psych.constants.C4), 2) -
					4 * psych.constants.C2 * (W * psych.constants.C3 - H)) ^ 0.5
			) / (2 * psych.constants.C2),
			W
		);
	},

	RHW(P, H, W) {
		return this.RWH(P, W, H);
	},

	RWB(P, W, WBF) {
		return this.RTW(P, this.TWB(P, W, WBF), W);
	},

	RBW(P, WBF, W) {
		return this.RWB(P, W, WBF);
	},

	RHD(P, H, TDP) {
		return this.RTH(P, this.THD(P, H, TDP), H);
	},

	RDH(P, TDP, H) {
		return this.RHD(P, H, TDP);
	},

	RDB(P, TDP, WBF) {
		return this.RD(this.TDB(P, TDP, WBF), TDP);
	},

	RBD(P, WBF, TDP) {
		return this.RDB(P, TDP, WBF);
	},

	WTR(P, TF, RH) {
		if (RH < 0) {
			return null;
		}
		let dtr_tf = this.DTR(TF, RH);
		if (dtr_tf === null) {
			return 0;
		} else {
			return this.WD(P, dtr_tf);
		}
	},

	WRT(P, RH, TF) {
		return this.WTR(P, TF, RH);
	},

	WTH(TF, H) {
		let WTH = (H - (psych.constants.C1 + psych.constants.C2 * TF) * TF) /
			(psych.constants.C3 + psych.constants.C4 * TF);
		return (WTH < 0) ? null : WTH;
	},

	WHT(H, TF) {
		return this.WTH(TF, H);
	},

	WD(P, TDP) {
		let pws_tdp = this.PWS(TDP);
		if (psych.constants.K2 * pws_tdp >= P) {
			return null;
		}
		let WD = (psych.constants.MW / psych.constants.MA) *
			psych.constants.K1 *
			pws_tdp /
			(P - psych.constants.K2 * pws_tdp) - psych.constants.K3;
		return Math.max(0, WD);
	},

	WTB(P, TF, WBF) {
		return this.WTR(P, TF, this.RTB(P, TF, WBF));
	},

	WBT(P, WBF, TF) {
		return this.WTB(P, TF, WBF);
	},

	WRH(P, RH, H) {
		return this.WTR(P, this.TRH(P, RH, H), RH);
	},

	WHR(P, H, RH) {
		return this.WRH(P, RH, H);
	},

	WRB(P, RH, WBF) {
		return this.WTR(P, this.TRB(P, RH, WBF), RH);
	},

	WBR(P, WBF, RH) {
		return this.WRB(P, RH, WBF);
	},

	HTR(P, TF, RH) {
		if (RH < 0) {
			return null;
		}
		return (psych.constants.C1 + psych.constants.C2 * TF) * TF +
			this.WTR(P, TF, RH) * (psych.constants.C3 + psych.constants.C4 * TF);
	},

	HRT(P, RH, TF) {
		return this.HTR(P, TF, RH);
	},

	HTW(TF, W) {
		return (psych.constants.C1 + psych.constants.C2 * TF) * TF +
			W * (psych.constants.C3 + psych.constants.C4 * TF);
	},

	HWT(W, TF) {
		return this.HTW(TF, W);
	},

	HTD(P, TF, TDP) {
		return this.HTW(TF, this.WD(P, TDP));
	},

	HDT(P, TDP, TF) {
		return this.HTD(P, TF, TDP);
	},

	HRW(P, RH, W) {
		return this.HTR(P, this.TRW(P, RH, W), RH);
	},

	HWR(P, W, RH) {
		return this.HRW(P, RH, W);
	},

	HRD(P, RH, TDP) {
		return this.HTR(P, this.TRD(RH, TDP), RH);
	},

	HDR(P, TDP, RH) {
		return this.HRD(P, RH, TDP);
	},

	BTR(P, TF, RH) {
		let g2 = TF; // First guess for TWB
		let g1 = TF + 1; // Old guess
		let pws_g1 = this.PWS(g1);
		let pw_rf = this.PW(TF, RH);
		let e1 = pw_rf - (pws_g1 - ((P - pws_g1) * (TF - g1)) / (2830 - 1.44 * g1)); // Error of old guess
		let iterCount = 0,
			iterCountLimit = 10000;
		while (true) {
			if (iterCount++ > iterCountLimit) {
				console.error("ITER LIMIT REACHED BTR", P, TF, RH);
				break;
			}
			let pws_g2 = this.PWS(g2);
			let e2 = pw_rf - (pws_g2 - ((P - pws_g2) * (TF - g2)) / (2830 - 1.44 * g2)); // Error of current guess
			if (e2 == 0 || e1 - e2 == 0) {
				break;
			} else if (Math.log10(Math.abs(e2)) <= -13) {
				break;
			}
			let g3 = g2 - ((g1 - g2) * e2 / (e1 - e2)); // Calc new guess
			g1 = g2;
			e1 = e2; // Swap old guess with current guess
			g2 = g3; // Swap current guess with new guess
		} // Try again
		return g2;
	},

	BRT(P, RH, TF) {
		return this.BTR(P, TF, RH);
	},

	BTW(P, TF, W) {
		return this.BTR(P, TF, this.RTW(P, TF, W));
	},

	BWT(P, W, TF) {
		return this.BTW(P, TF, W);
	},

	BTD(P, TF, TDP) {
		return this.BTR(P, TF, this.RD(TF, TDP));
	},

	BDT(P, TDP, TF) {
		return this.BTD(P, TF, TDP);
	},

	BRW(P, RH, W) {
		return this.BTR(P, this.TRW(P, RH, W), RH);
	},

	BWR(P, W, RH) {
		return this.BRW(P, RH, W);
	},

	BRD(P, RH, TDP) {
		return this.BTR(P, this.TRD(RH, TDP), RH);
	},

	BDR(P, TDP, RH) {
		return this.BRD(P, RH, TDP);
	},

	DTR(TF, RH) {
		return (RH <= 0) ? null : this.TPws(this.PWS(TF) * RH / 100);
	},

	DRT(RH, TF) {
		return this.DTR(TF, RH);
	},

	DTH(P, TF, H) {
		return this.DTR(TF, RTH(P, TF, H));
	},

	DHT(P, H, TF) {
		return this.DTH(P, TF, H);
	},

	DTB(P, TF, WBF) {
		return this.DTR(TF, this.RTB(P, TF, WBF));
	},

	DBT(P, WBF, TF) {
		return this.DTB(P, TF, WBF);
	},

	DRH(P, RH, H) {
		return this.DTR(this.TRH(P, RH, H), RH);
	},

	DHR(P, H, RH) {
		return this.DRH(P, RH, H);
	},

	DRB(P, RH, WBF) {
		return this.DTR(this.TRB(P, RH, WBF), RH);
	},

	DBR(P, WBF, RH) {
		return this.DRB(P, RH, WBF);
	},

	DW(P, W) {
		PWS2 = P / (
			(psych.constants.MW / psych.constants.MA) * psych.constants.K1 /
			(W + psych.constants.K3) + psych.constants.K2
		);
		return this.TPws(PWS2);
	},

};