import { calculations } from './calculations.ts';
import { Point } from './point.ts';

const PointBuilder = function () {
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
				wb: 'calcPointWithDbWb',
				rh: 'calcPointWithDbRh',
				W: 'calcPointWithDbW',
				h: 'calcPointWithDbH',
				dp: 'calcPointWithDbDp',
			},
			wb: {
				rh: 'calcPointWithWbRh',
				W: 'calcPointWithWbW',
				dp: 'calcPointWithWbDp',
				// h: "calcPointWithWbH" // Excluded for the time being
			},
			rh: {
				W: 'calcPointWithRhW',
				h: 'calcPointWithRhH',
				dp: 'calcPointWithRhDp',
			},
			W: {
				h: 'calcPointWithWH',
			},
		},
	};

	this.calcPointWithDbWb = function () {
		const elevation = this.properties.elevation;
		const p = this.properties.atmPressure;
		const db = this.properties.db;
		const wb = this.properties.wb;

		return {
			elevation: elevation,
			db: db,
			W: calculations.WTB(p, db, wb),
		};
	};

	this.calcPointWithDbRh = function () {
		const elevation = this.properties.elevation;
		const p = this.properties.atmPressure;
		const db = this.properties.db;
		const rh = this.properties.rh;

		return {
			elevation: elevation,
			db: db,
			W: calculations.WTR(p, db, rh),
		};
	};

	this.calcPointWithDbW = function () {
		const elevation = this.properties.elevation;
		const db = this.properties.db;
		const W = this.properties.W;

		return {
			elevation: elevation,
			db: db,
			W: W,
		};
	};

	this.calcPointWithDbH = function () {
		const elevation = this.properties.elevation;
		const db = this.properties.db;
		const h = this.properties.h;

		return {
			elevation: elevation,
			db: db,
			W: calculations.WTH(db, h),
		};
	};

	this.calcPointWithDbDp = function () {
		const elevation = this.properties.elevation;
		const p = this.properties.atmPressure;
		const db = this.properties.db;
		const dp = this.properties.dp;

		return {
			elevation: elevation,
			db: db,
			W: calculations.WD(p, dp),
		};
	};

	this.calcPointWithWbRh = function () {
		const elevation = this.properties.elevation;
		const p = this.properties.atmPressure;
		const wb = this.properties.wb;
		const rh = this.properties.rh;

		return {
			elevation: elevation,
			db: calculations.TRB(p, rh, wb),
			W: calculations.WRB(p, rh, wb),
		};
	};

	this.calcPointWithWbW = function () {
		const elevation = this.properties.elevation;
		const p = this.properties.atmPressure;
		const wb = this.properties.wb;
		const W = this.properties.W;

		return {
			elevation: elevation,
			db: calculations.TWB(p, W, wb),
			W: W,
		};
	};

	this.calcPointWithWbDp = function () {
		const elevation = this.properties.elevation;
		const p = this.properties.atmPressure;
		const wb = this.properties.wb;
		const dp = this.properties.dp;

		return {
			elevation: elevation,
			db: calculations.TWB(p, W, wb),
			W: calculations.WD(p, dp),
		};
	};

	//	this.calcPointWithWbH = function() {
	//
	//	}

	this.calcPointWithRhW = function () {
		const elevation = this.properties.elevation;
		const p = this.properties.atmPressure;
		const rh = this.properties.rh;
		const W = this.properties.W;

		return {
			elevation: elevation,
			db: calculations.TRW(p, rh, W),
			W: W,
		};
	};

	this.calcPointWithRhH = function () {
		const elevation = this.properties.elevation;
		const p = this.properties.atmPressure;
		const rh = this.properties.rh;
		const h = this.properties.h;

		return {
			elevation: elevation,
			db: calculations.TRH(p, rh, h),
			W: calculations.WRH(p, rh, h),
		};
	};

	this.calcPointWithRhDp = function () {
		const elevation = this.properties.elevation;
		const p = this.properties.atmPressure;
		const rh = this.properties.rh;
		const dp = this.properties.dp;

		return {
			elevation: elevation,
			db: calculations.TRH(p, rh, h),
			W: calculations.WD(p, dp),
		};
	};

	this.calcPointWithWH = function () {
		const elevation = this.properties.elevation;
		const h = this.properties.h;
		const W = this.properties.W;

		return {
			elevation: elevation,
			db: calculations.TWH(W, h),
			W: W,
		};
	};

	this.withElevation = function (e) {
		if (e instanceof Point) {
			return this.withElevation(e.properties.elevation);
		}
		this.properties.elevation = e;
		this.properties.atmPressure = calculations.PFt(e);
		return this;
	};

	this.withDryBulb = function (temp) {
		if (temp instanceof Point) {
			return this.withDryBulb(temp.properties.db);
		}
		this.properties.db = temp;
		return this;
	};

	this.withWetBulb = function (temp) {
		if (temp instanceof Point) {
			return this.withWetBulb(temp.properties.wb);
		}
		this.properties.wb = temp;
		return this;
	};

	this.withRelativeHumidity = function (relHum) {
		if (relHum instanceof Point) {
			return this.withRelativeHumidity(relHum.properties.rh);
		}
		this.properties.rh = relHum;
		return this;
	};

	this.withHumidityRatio = function (humRat) {
		if (humRat instanceof Point) {
			return this.withHumidityRatio(humRat.properties.W);
		}
		this.properties.W = humRat;
		return this;
	};

	this.withEnthalpy = function (enth) {
		if (enth instanceof Point) {
			return this.withEnthalpy(enth.properties.h);
		}
		this.properties.h = enth;
		return this;
	};

	this.withDewPoint = function (temp) {
		if (temp instanceof Point) {
			return this.withDewPoint(temp.properties.dp);
		}
		this.properties.dp = temp;
		return this;
	};

	this.getBaseProperties = function (possibilities) {
		let baseProps = null;
		possibilities = possibilities || this.possibleCombinations;

		for (const x in possibilities) {
			if (typeof this.properties[x] != 'undefined') {
				if (typeof possibilities[x] == 'object') {
					baseProps = this.getBaseProperties(possibilities[x]);
				} else {
					const func = possibilities[x];
					baseProps = this[func]();
				}
				break;
			}
		}

		return baseProps;
	};

	this.build = function () {
		const baseProps = this.getBaseProperties();

		if (baseProps === null) {
			console.error('Malformed builder');
			return null;
		}

		return new Point({
			elevation: baseProps.elevation,
			db: baseProps.db,
			W: baseProps.W,
		});
	};
};

export { PointBuilder };
