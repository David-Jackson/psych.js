window.psych = window.psych || {};

psych.Point = function(opts) {
	
	
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
	
	this.toString = function() {
		return (
			  "<p>Elevation: " + this.properties.elevation + "ft</p>"
			+ "<p>Dry Bulb Temp: " + this.properties.db.toFixed(2) + "F</p>"
			+ "<p>Wet Bulb Temp: " + this.properties.wb.toFixed(2) + "F</p>"
			+ "<p>Rel Humidity: " + this.properties.rh.toFixed(2) + "%</p>"
			+ "<p>Dew Point: " + this.properties.dp.toFixed(2) + "F</p>"
		);
	};
	
	this.properties = opts;
	
	this.definedProperties = [];
	for (var p in opts) {
		this.definedProperties.push(p);
	}
	
	this.calculate = function() {
		for (var p in this.properties) {
			if (this.definedProperties.indexOf(p) == -1) delete this.properties[p];
		}
		for (var thing in this.functions) {
			if (typeof this.functions[thing] == "function") this.functions[thing]();
		}
	}
	this.calculate();
}