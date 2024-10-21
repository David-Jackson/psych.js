import { calculations } from './calculations.ts';

/**
 * Interface representing the options for a point in the psychrometric chart.
 *
 * @property {number} [elevation] - The elevation of the point in feet.
 * @property {number} [db] - The dry-bulb temperature in degrees Fahrenheit.
 * @property {number} [W] - The humidity ratio in lb water/lb dry air.
 * @property {number} [p] - The atmospheric pressure in inches of Mercury (inHg).
 * @property {number} [rh] - The relative humidity as a percentage.
 * @property {number} [h] - The specific enthalpy in BTU/lb.
 * @property {number} [wb] - The wet-bulb temperature in degrees Fahrenheit.
 * @property {number} [dp] - The dew point temperature in degrees Fahrenheit.
 * @property {number} [v] - The specific volume in ft³/lb.
 */
interface PointOptions {
	elevation: number;
	db: number;
	W: number;
	p: number;
	rh: number;
	h: number;
	wb: number;
	dp: number;
	v: number;
}

class Point {
	public properties: PointOptions;
	private definedProperties: string[];

	constructor(opts: PointOptions) {
		this.properties = opts;
		this.definedProperties = Object.keys(opts);

		this.calculate();
	}

	// Function for calculating properties
	private calculate(): void {
		// Clear properties that were not defined initially
		for (const prop in this.properties) {
			if (!this.definedProperties.includes(prop)) {
				delete this.properties[prop as keyof PointOptions];
			}
		}

		// Execute calculation functions
		this.p();
		this.rh();
		this.h();
		this.wb();
		this.dp();
		this.v();
	}

	// Calculation methods
	private p(): number | null {
		const elev = this.properties.elevation;
		if (elev == null) {
			console.error('Malformed point');
			return null;
		}
		this.properties.p = calculations.PFt(elev);
		return this.properties.p;
	}

	private rh(): number | null {
		const { p, db, W } = this.properties;
		if (p == null || db == null || W == null) {
			console.error('Malformed point');
			return null;
		}
		const rh = calculations.RTW(p, db, W);
		if (rh === null) {
			console.error('Relative humidity calculation failed');
			return null;
		}
		this.properties.rh = rh;
		return this.properties.rh;
	}

	private h(): number | null {
		const { db, W } = this.properties;
		if (db == null || W == null) {
			console.error('Malformed point');
			return null;
		}
		this.properties.h = calculations.HTW(db, W);
		return this.properties.h;
	}

	private wb(): number | null {
		const { p, db, W } = this.properties;
		if (p == null || db == null || W == null) {
			console.error('Malformed point');
			return null;
		}
		const wb = calculations.BTW(p, db, W);
		if (wb === null) {
			console.error('Wet bulb calculation failed');
			return null;
		}
		this.properties.wb = wb;
		return this.properties.wb;
	}

	private dp(): number | null {
		const { p, W } = this.properties;
		if (p == null || W == null) {
			console.error('Malformed point');
			return null;
		}
		const dp = calculations.DW(p, W);
		if (dp === null) {
			console.error('Dew point calculation failed');
			return null;
		}
		this.properties.dp = dp;
		return this.properties.dp;
	}

	private v(): number | null {
		const { p, db, rh } = this.properties;
		if (p == null || db == null || rh == null) {
			console.error('Malformed point');
			return null;
		}
		const v = calculations.V(p, db, rh);
		if (v === null) {
			console.error('Specific volume calculation failed');
			return null;
		}
		this.properties.v = v;
		return this.properties.v;
	}

	// Method to convert the properties to an HTML representation
	public toHTML(): string {
		const { elevation, db, wb, rh, W, h, dp } = this.properties;
		if (
			elevation == null || db == null || wb == null || rh == null ||
			W == null || h == null || dp == null
		) {
			return '<p>Some properties are not defined.</p>';
		}

		return (
			`<p>Elevation: ${elevation} ft</p>` +
			`<p>Dry Bulb Temp: ${db.toFixed(2)}°F</p>` +
			`<p>Wet Bulb Temp: ${wb.toFixed(2)}°F</p>` +
			`<p>Relative Humidity: ${rh.toFixed(2)}%</p>` +
			`<p>Humidity Ratio: ${(W * 7000).toFixed(2)} grains/lb</p>` +
			`<p>Enthalpy: ${h.toFixed(2)} BTU/lb</p>` +
			`<p>Dew Point: ${dp.toFixed(2)}°F</p>`
		);
	}
}

export { Point };
