/**
 * A collection of constants used in psychrometric calculations.
 *
 * @constant
 * @type {Object}
 * @property {number} INPSI - Conversion factor from inHg to psia.
 * @property {number} MA - Molecular weight of air.
 * @property {number} MW - Molecular weight of water.
 * @property {number} C1 - Constant used in the equation for h.
 * @property {number} C2 - Constant used in the equation for h.
 * @property {number} C3 - Constant used in the equation for h.
 * @property {number} C4 - Constant used in the equation for h.
 * @property {number} K1 - Constant used in the equation for W.
 * @property {number} K2 - Constant used in the equation for W.
 * @property {number} K3 - Constant used in the equation for W.
 * @property {number} P1 - ASHRAE constant for PWS equations (ASHRAE Fundamentals Handbook 1997 page 6.2).
 * @property {number} P2 - ASHRAE constant for PWS equations (ASHRAE Fundamentals Handbook 1997 page 6.2).
 * @property {number} P3 - ASHRAE constant for PWS equations (ASHRAE Fundamentals Handbook 1997 page 6.2).
 * @property {number} P4 - ASHRAE constant for PWS equations (ASHRAE Fundamentals Handbook 1997 page 6.2).
 * @property {number} P5 - ASHRAE constant for PWS equations (ASHRAE Fundamentals Handbook 1997 page 6.2).
 * @property {number} P6 - ASHRAE constant for PWS equations (ASHRAE Fundamentals Handbook 1997 page 6.2).
 * @property {number} P7 - ASHRAE constant for PWS equations (ASHRAE Fundamentals Handbook 1997 page 6.2).
 * @property {number} P8 - ASHRAE constant for PWS equations (ASHRAE Fundamentals Handbook 1997 page 6.2).
 * @property {number} P9 - ASHRAE constant for PWS equations (ASHRAE Fundamentals Handbook 1997 page 6.2).
 * @property {number} P10 - ASHRAE constant for PWS equations (ASHRAE Fundamentals Handbook 1997 page 6.2).
 * @property {number} P11 - ASHRAE constant for PWS equations (ASHRAE Fundamentals Handbook 1997 page 6.2).
 * @property {number} P12 - ASHRAE constant for PWS equations (ASHRAE Fundamentals Handbook 1997 page 6.2).
 * @property {number} P13 - ASHRAE constant for PWS equations (ASHRAE Fundamentals Handbook 1997 page 6.2).
 * @property {number} densityOfWater - Density of water in lb/gal.
 */
export const constants = {
	// INPSI = inHg per psia
	INPSI: (760 * 9.80665 * 0.45359237) / (Math.pow(25.4, 3) * 0.101325),

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
