window.psych = window.psych || {};

psych.PointBuilder = function() {
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
				h: "calcPointWithDbH"
			},
			wb: {
				rh: "calcPointWithWbRh",
				W: "calcPointWithWbW",
				// h: "calcPointWithWbH"
			},
			rh: {
				W: "calcPointWithRhW",
				h: "calcPointWithRhH"
			},
			W: {
				h: "calcPointWithWH"
			}
		}
	};
	
	this.calcPointWithDbWb = function() {
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
	
	this.calcPointWithDbRh = function() {
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
	
	this.calcPointWithDbW = function() {
		let elevation = this.properties.elevation;
		let db = this.properties.db;
		let W = this.properties.W;
		
		return {
			elevation: elevation,
			db: db,
			W: W
		}
	}
	
	this.calcPointWithDbH = function() {
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
	
	this.calcPointWithWbRh = function() {
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
	
	this.calcPointWithWbW = function() {
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
	
//	this.calcPointWithWbH = function() {
//		
//	}
	
	this.calcPointWithRhW = function() {
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
	
	this.calcPointWithRhH = function() {
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
	
	this.calcPointWithWH = function() {
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
	
	this.withElevation = function(e) {
		this.properties.elevation = e;
		this.properties.atmPressure = psych.calculations.PFt(e);
		return this;
	}
	
	this.withDryBulb = function(temp) {
		this.properties.db = temp;
		return this;
	}
	
	this.withWetBulb = function(temp) {
		this.properties.wb = temp;
		return this;
	}
	
	this.withRelativeHumidity = function(relHum) {
		this.properties.rh = relHum;
		return this;
	}
	
	this.withHumidityRatio = function(humRat) {
		this.properties.W = humRat;
		return this;
	}
	
	this.withEnthalpy = function(enth) {
		this.properties.h = enth;
		return this;
	}
	
	this.getBaseProperties = function(possibilities) {
		let baseProps = null;
		possibilities = possibilities || this.possibleCombinations;
		
		
		for (let x in possibilities) {
			if (this.properties[x]) {
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
	
	this.build = function() {
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