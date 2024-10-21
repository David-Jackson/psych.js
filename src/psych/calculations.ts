import { constants } from "./constants.ts";

export const calculations = {
    /**
     * Calculates the atmospheric pressure in inches of mercury (inHg) based on the elevation.
     *
     * @param Ft - The elevation in feet.
     * @returns The atmospheric pressure in inHg.
     */
    PFt(Ft: number): number {
		return (760 / 25.4) * Math.pow((1 - 0.0000068753 * Ft), 5.2559);
	},

    /**
     * Converts inches of water gauge (InWg) to pascals (Pa).
     *
     * @param InWg - The pressure in inches of water gauge.
     * @returns The pressure in pascals.
     */
	PinWg(InWg: number): number {
		return InWg * (760 / 25.4) / (101325 / 248.84);
	},

    /**
     * Converts a pressure value in pounds per square inch absolute (psia) to inches of mercury (inHg).
     *
     * @param psia - The pressure value in pounds per square inch absolute.
     * @returns The pressure converted to inches of mercury (inHg).
     */
	Ppsia(psia: number): number {
		return psia * constants.INPSI;
	},

    /**
     * Converts gauge pressure from pounds per square inch (psig) to inches of mercury (inHg).
     *
     * @param psig - The gauge pressure in pounds per square inch (psig).
     * @returns The pressure converted to inches of mercury (inHg).
     */
	Ppsig(psig: number): number {
		return psig * constants.INPSI + 760 / 25.4;
	},

    /**
     * Converts atmospheric pressure from atmospheres (Atm) to inches of mercury (inHg).
     *
     * @param Atm - The atmospheric pressure in atmospheres.
     * @returns The atmospheric pressure in inches of mercury (inHg).
     */
	PAtm(Atm: number): number {
		return Atm * 760 / 25.4;
	},

    /**
     * Calculates the saturation pressure of water vapor over *ICE* given 
     * the absolute temperature in degrees Rankin (TR).
     *
     * @param {number} TR - The temperature in degrees Rankin.
     * @returns {number} The saturation pressure of water vapor in pounds per square inch absolute (psia).
     */
	saturationPressureIce(TR: number): number {
		return Math.exp(
			constants.P1 / TR +
			constants.P2 +
			constants.P3 * TR +
			constants.P4 * Math.pow(TR, 2) +
			constants.P5 * Math.pow(TR, 3) +
			constants.P6 * Math.pow(TR, 4) +
			constants.P7 * Math.log(TR)
		)
	},

    /**
     * Calculates the saturation pressure of liquid water given the absolute temperature in degrees Rankin (TR).
     *
     * @param {number} TR - The absolute temperature in degrees Rankin.
     * @returns {number} The saturation pressure of liquid water in pounds per square inch absolute (psia).
     */
	saturationPressureLiquidWater(TR: number): number {
		return Math.exp(
			constants.P8 / TR +
			constants.P9 +
			constants.P10 * TR +
			constants.P11 * Math.pow(TR, 2) +
			constants.P12 * Math.pow(TR, 3) +
			constants.P13 * Math.log(TR)
		)
	},

    /**
     * Calculates the saturation pressure of water in pounds per square inch absolute (psia) based on the given temperature in Fahrenheit (TF).
     * 
     * @param TF - The temperature in Fahrenheit.
     * @returns The saturation pressure of water in psia.
     * 
     * The function uses different calculations based on the temperature range:
     * - If TF is greater than or equal to 32.5, it uses the saturation pressure of liquid water.
     * - If TF is between 31.5 and 32.5, it interpolates between the saturation pressures of liquid water and ice.
     * - If TF is less than or equal to 31.5, it uses the saturation pressure of ice.
     */
	PWS(TF: number): number {
		const TR = TF + 459.67;

		if (TF >= 32.5) {
			return constants.INPSI * this.saturationPressureLiquidWater(TR);
		} else if (TF > 31.5) {
			return (TF - 31.5) * constants.INPSI * this.saturationPressureLiquidWater(TR) +
				(32.5 - TF) * constants.INPSI * this.saturationPressureIce(TR);
		} else {
			return constants.INPSI * this.saturationPressureIce(TR);
		}
	},

    /**
     * Calculates the partial pressure of water vapor (PW) in pounds per square inch absolute (psia) given the temperature in Fahrenheit (TF) and relative humidity (RH).
     *
     * @param TF - The temperature in Fahrenheit.
     * @param RH - The relative humidity as a percentage 0-100.
     * @returns The partial pressure of water vapor in psia, or `null` if the relative humidity is less than 0.
     */
	PW(TF: number, RH: number): number | null {
		if (RH < 0) {
			return null;
		}
		return RH * this.PWS(TF) / 100
    },

    /**
     * Calculates the specific volume (ft³/lb of dry air) given pressure, temperature, and relative humidity.
     *
     * @param P - The pressure in inches of mercury (inHg).
     * @param TF - The temperature in degrees Fahrenheit.
     * @param RH - The relative humidity as a percentage.
     * @returns The specific volume in ft³/lb of dry air, or `null` if the relative humidity is less than 0.
     */
    V(P: number, TF: number, RH: number): number | null { // Specific Volume (ft^3/lb of dry air) given pressure (), temperature (F), and relative humidity (%)
		if (RH < 0) {
			return null;
		}
        const W = this.WTR(P, TF, RH);
        if (W === null) {
            return null;
        }
		return 13.349 * (TF + 459.67) *
			(1 + constants.MA * W / constants.MW) /
			(P * 25.4 * 529.67 / 760);
	},

    TRW(P: number, RH: number, W: number): number | null {
		if (RH < 0 || W < 0) {
			return null;
		}
		const PWSTDP = P / (
			(constants.MW / constants.MA) * constants.K1 /
			(W + constants.K3) + constants.K2
		);
		const PWS2 = PWSTDP * 100 / RH;
		return this.TPws(PWS2);
	},

    TWR(P: number, W: number, RH: number): number | null {
		return this.TRW(P, RH, W)
	},

    TRH(P: number, RH: number, H: number): number | null {
		let g2 = 70;
		let g1 = 71;
        const W_g1 = this.WTR(P, g1, RH);
        if (W_g1 === null) {
            return null;
        }
		let e1 = (H - (constants.C1 + constants.C2 * g1) * g1) /
			(constants.C3 + constants.C4 * g1) - W_g1;
		let iterCount = 0;
        const iterCountLimit = 10000;
		while (true) {
			if (iterCount++ > iterCountLimit) {
				console.error("ITER LIMIT REACHED TRH", P, RH, H);
				return null;
			}
            const W_g2 = this.WTR(P, g2, RH);
            if (W_g2 === null) {
                return null;
            }
			const e2 = (H - (constants.C1 + constants.C2 * g2) * g2) /
				(constants.C3 + constants.C4 * g2) - W_g2; // Error of current guess
			if (e2 == 0 || e1 - e2 == 0) {
				break;
			} else if (Math.log10(Math.abs(e2)) <= -13) {
				break;
			}
			const g3 = g2 - ((g1 - g2) * e2 / (e1 - e2)); // Calc new guess
			g1 = g2;
			e1 = e2; // Swap old guess with current guess
			g2 = g3; // Swap current guess with new guess
		} // Try again
		return g2;
	},

	THR(P: number, H: number, RH: number): number | null {
		return this.TRH(P, RH, H);
	},

	TRD(RH: number, TDP: number): number | null {
		return this.TPws(this.PWS(TDP) * 100 / RH);
	},

	TDR(TDP: number, RH: number): number | null {
		return this.TRD(RH, TDP);
	},

    TRB(P: number, RH: number, WBF: number): number | null {
		if (RH < 0) {
			return null;
		}
		const pws_wbf = this.PWS(WBF);
		let g2 = 70
		let g1 = 71
		let e1 = (pws_wbf - ((P - pws_wbf) * (g1 - WBF)) / (2830 - 1.44 * WBF)) - RH * this.PWS(g1) / 100;
		let iterCount = 0;
        const iterCountLimit = 10000;
		while (true) {
			if (iterCount++ > iterCountLimit) {
				console.error("ITER LIMIT REACHED TRB", P, RH, WBF);
                return null;
			}
			const e2 = (pws_wbf - ((P - pws_wbf) * (g2 - WBF)) / (2830 - 1.44 * WBF)) - RH * this.PWS(g2) / 100;
			if (e2 == 0 || e1 - e2 == 0) {
				break;
			} else if (Math.log10(Math.abs(e2)) <= -13) {
				break;
			}
			const g3 = g2 - ((g1 - g2) * e2 / (e1 - e2)); // Calc new guess
			g1 = g2;
			e1 = e2; // Swap old guess with current guess
			g2 = g3; // Swap current guess with new guess
		} // Try again
		return g2;
	},

	TBR(P: number, WBF: number, RH: number): number | null {
		return this.TRB(P, RH, WBF);
	},

	TWH(W: number, H: number): number {
		const c = constants;
		return (-(c.C1 + W * c.C4) + Math.pow((Math.pow((c.C1 + W * c.C4), 2) - 4 * c.C2 * (W * c.C3 - H)), 0.5)) / (2 * c.C2);
	},

	THW(H: number, W: number): number {
		return this.TWH(W, H);
    },
    
    /**
     * Calculates the dry bulb temperature given the atmospheric pressure, humidity ratio, and wet bulb temperature.
     *
     * @param P - The atmospheric pressure in inches of mercury (inHg).
     * @param W - The humidity ratio (lb of water vapor per lb of dry air).
     * @param WBF - The wet bulb temperature in degrees Fahrenheit.
     * @returns The dry bulb temperature in degrees Fahrenheit.
     */
	TWB(P: number, W: number, WBF: number): number {
		const c = constants;
		const PWSTDP = P / ((c.MW / c.MA) * c.K1 / (W + c.K3) + c.K2);
		const pws_wbf = this.PWS(WBF);
		return WBF + (pws_wbf - PWSTDP) * (2830 - 1.44 * WBF) / (P - pws_wbf);
	},

	TBW(P: number, WBF: number, W: number): number {
		return this.TWB(P, W, WBF);
	},

	THD(P: number, H: number, TDP: number): number | null {
		const W = this.WD(P, TDP);
        if (W === null) {
            return null;
        }
		return this.TWH(W, H);
	},

	TDH(P: number, TDP: number, H: number): number | null {
		return this.THD(P, H, TDP);
	},

	TDB(P: number, TDP: number, WBF: number): number | null {
		const W = this.WD(P, TDP);
        if (W === null) {
            return null;
        }
		return this.TWB(P, W, WBF);
	},

	TBD(P: number, WBF: number, TDP: number): number | null {
		return this.TDB(P, TDP, WBF);
	},

	TF(TC: number): number {
		return 1.8 * TC + 32;
	},

	TC(TF: number): number {
		return (TF - 32) / 1.8;
	},

	TPws(PWS2: number): number | null {
		let g2 = 300; // First guess for TF
		let g1 = 301; // Old guess
		let e1 = PWS2 - this.PWS(g1); // Error of old guess
		let iterCount = 0;
        const iterCountLimit = 10000;
		while (true) {
			if (iterCount++ > iterCountLimit) {
				console.error("ITER LIMIT REACHED TPws", PWS2);
                return null;
			}
			const e2 = PWS2 - this.PWS(g2) // Error of current guess
			if (e2 == 0 || e1 - e2 == 0) {
				break;
			} else if (Math.log10(Math.abs(e2)) <= -13) {
				break;
			}
			const g3 = g2 - ((g1 - g2) * e2 / (e1 - e2)); //Calc new guess

			g1 = g2;
			e1 = e2; // Swap old guess with current guess
			g2 = g3; // Swap current guess with new guess
		} // Try again
		return g2;
	},

	RTW(P: number, TF: number, W: number): number | null {
		if (W < 0) {
			return null;
		}
		const c = constants;
		const PWSTDP = P / (
			(c.MW / c.MA) * c.K1 /
			(W + c.K3) + c.K2
		);
		return (W == 0) ? 0 : PWSTDP * 100 / this.PWS(TF);
	},

	RWT(P: number, W: number, TF: number): number | null {
		return this.RTW(P, TF, W);
	},

	RTH(P: number, TF: number, H: number): number | null {
		const c = constants;
		const W = (H - (c.C1 + c.C2 * TF) * TF) /
			(c.C3 + c.C4 * TF);
		return this.RTW(P, TF, W);
	},

	RHT(P: number, H: number, TF: number): number | null {
		return this.RTH(P, TF, H);
	},

	RD(TF: number, TDP: number): number {
		return this.PWS(TDP) * 100 / this.PWS(TF);
	},

	RDT(TDP: number, TF: number): number {
		return this.RD(TF, TDP);
	},

	RTB(P: number, TF: number, WBF: number): number {
		const pws_wbf = this.PWS(WBF);
		const PW2 = pws_wbf - ((P - pws_wbf) * (TF - WBF)) / (2830 - 1.44 * WBF); // Carrier's equation
		return PW2 * 100 / this.PWS(TF);
	},

	RBT(P: number, WBF: number, TF: number): number {
		return this.RTB(P, TF, WBF);
	},

	RWH(P: number, W: number, H: number): number | null {
		return this.RTW(P,
			(
				-(constants.C1 + W * constants.C4) +
				(Math.pow((constants.C1 + W * constants.C4), 2) -
					4 * constants.C2 * (W * constants.C3 - H)) ^ 0.5
			) / (2 * constants.C2),
			W
		);
	},

	RHW(P: number, H: number, W: number): number | null {
		return this.RWH(P, W, H);
	},

	RWB(P: number, W: number, WBF: number): number | null {
		return this.RTW(P, this.TWB(P, W, WBF), W);
	},

	RBW(P: number, WBF: number, W: number): number | null {
		return this.RWB(P, W, WBF);
	},

	RHD(P: number, H: number, TDP: number): number | null {
        const T_DB = this.THD(P, H, TDP); // Dry bulb temperature
        if (T_DB === null) {
            return null;
        }
		return this.RTH(P, T_DB, H);
	},

	RDH(P: number, TDP: number, H: number): number | null {
		return this.RHD(P, H, TDP);
	},

	RDB(P: number, TDP: number, WBF: number): number | null {
        const T_DB = this.TDB(P, TDP, WBF); // Dry bulb temperature
        if (T_DB === null) {
            return null;
        }
		return this.RD(T_DB, TDP);
	},

	RBD(P: number, WBF: number, TDP: number): number | null {
		return this.RDB(P, TDP, WBF);
	},

	WTR(P: number, TF: number, RH: number): number | null {
		if (RH < 0) {
			return null;
		}
		const dtr_tf = this.DTR(TF, RH);
		if (dtr_tf === null) {
			return 0;
		} else {
			return this.WD(P, dtr_tf);
		}
	},

	WRT(P: number, RH: number, TF: number): number | null {
		return this.WTR(P, TF, RH);
	},

	WTH(TF: number, H: number): number | null {
		const WTH = (H - (constants.C1 + constants.C2 * TF) * TF) /
			(constants.C3 + constants.C4 * TF);
		return (WTH < 0) ? null : WTH;
	},

	WHT(H: number, TF: number): number | null {
		return this.WTH(TF, H);
	},

	WD(P: number, TDP: number): number | null {
		const pws_tdp = this.PWS(TDP);
		if (constants.K2 * pws_tdp >= P) {
			return null;
		}
		const WD = (constants.MW / constants.MA) *
			constants.K1 *
			pws_tdp /
			(P - constants.K2 * pws_tdp) - constants.K3;
		return Math.max(0, WD);
	},

	WTB(P: number, TF: number, WBF: number): number | null {
		return this.WTR(P, TF, this.RTB(P, TF, WBF));
	},

	WBT(P: number, WBF: number, TF: number): number | null {
		return this.WTB(P, TF, WBF);
	},

	WRH(P: number, RH: number, H: number): number | null {
        const T_DB = this.TRH(P, RH, H); // Dry bulb temperature
        if (T_DB === null) {
            return null;
        }
		return this.WTR(P, T_DB, RH);
	},

	WHR(P: number, H: number, RH: number): number | null {
		return this.WRH(P, RH, H);
	},

	WRB(P: number, RH: number, WBF: number): number | null {
        const T_DB = this.TRB(P, RH, WBF); // Dry bulb temperature
        if (T_DB === null) {
            return null;
        }
		return this.WTR(P, T_DB, RH);
	},

	WBR(P: number, WBF: number, RH: number): number | null {
		return this.WRB(P, RH, WBF);
	},

	HTR(P: number, TF: number, RH: number): number | null {
		if (RH < 0) {
			return null;
		}

        const W = this.WTR(P, TF, RH);
        if (W === null) {
            return null;
        }

		return (constants.C1 + constants.C2 * TF) * TF +
			W * (constants.C3 + constants.C4 * TF);
	},

	HRT(P: number, RH: number, TF: number): number | null {
		return this.HTR(P, TF, RH);
	},

	HTW(TF: number, W: number): number {
		return (constants.C1 + constants.C2 * TF) * TF +
			W * (constants.C3 + constants.C4 * TF);
	},

	HWT(W: number, TF: number): number {
		return this.HTW(TF, W);
	},

	HTD(P: number, TF: number, TDP: number): number | null {
        const W = this.WD(P, TDP);
        if (W === null) {
            return null;
        }
		return this.HTW(TF, W);
	},

	HDT(P: number, TDP: number, TF: number): number | null {
		return this.HTD(P, TF, TDP);
	},

	HRW(P: number, RH: number, W: number): number | null {
        const T_DB = this.TRW(P, RH, W); // Dry bulb temperature
        if (T_DB === null) {
            return null;
        }
		return this.HTR(P, T_DB, RH);
	},

	HWR(P: number, W: number, RH: number): number | null {
		return this.HRW(P, RH, W);
	},

	HRD(P: number, RH: number, TDP: number): number | null {
        const T_DB = this.TRD(RH, TDP); // Dry bulb temperature
        if (T_DB === null) {
            return null;
        }
		return this.HTR(P, T_DB, RH);
	},

	HDR(P: number, TDP: number, RH: number): number | null {
		return this.HRD(P, RH, TDP);
	},

	BTR(P: number, TF: number, RH: number): number | null {
		let g2 = TF; // First guess for TWB
		let g1 = TF + 1; // Old guess
		const pws_g1 = this.PWS(g1);
		const pw_rf = this.PW(TF, RH);
        if (pw_rf === null) {
            return null;
        }
		let e1 = pw_rf - (pws_g1 - ((P - pws_g1) * (TF - g1)) / (2830 - 1.44 * g1)); // Error of old guess
		let iterCount = 0;
        const iterCountLimit = 10000;
		while (true) {
			if (iterCount++ > iterCountLimit) {
				console.error("ITER LIMIT REACHED BTR", P, TF, RH);
                return null;
			}
			const pws_g2 = this.PWS(g2);
			const e2 = pw_rf - (pws_g2 - ((P - pws_g2) * (TF - g2)) / (2830 - 1.44 * g2)); // Error of current guess
			if (e2 == 0 || e1 - e2 == 0) {
				break;
			} else if (Math.log10(Math.abs(e2)) <= -13) {
				break;
			}
			const g3 = g2 - ((g1 - g2) * e2 / (e1 - e2)); // Calc new guess
			g1 = g2;
			e1 = e2; // Swap old guess with current guess
			g2 = g3; // Swap current guess with new guess
		} // Try again
		return g2;
	},

	BRT(P: number, RH: number, TF: number): number | null {
		return this.BTR(P, TF, RH);
	},

	BTW(P: number, TF: number, W: number): number | null {
        const RH = this.RTW(P, TF, W);
        if (RH === null) {
            return null;
        }
		return this.BTR(P, TF, RH);
	},

	BWT(P: number, W: number, TF: number): number | null {
		return this.BTW(P, TF, W);
	},

	BTD(P: number, TF: number, TDP: number): number | null {
		return this.BTR(P, TF, this.RD(TF, TDP));
	},

	BDT(P: number, TDP: number, TF: number): number | null {
		return this.BTD(P, TF, TDP);
	},

	BRW(P: number, RH: number, W: number): number | null {
        const T_DB = this.TRW(P, RH, W);
        if (T_DB === null) {
            return null;
        }
		return this.BTR(P, T_DB, RH);
	},

	BWR(P: number, W: number, RH: number): number | null {
		return this.BRW(P, RH, W);
	},

	BRD(P: number, RH: number, TDP: number): number | null {
        const T_DB = this.TRD(RH, TDP);
        if (T_DB === null) {
            return null;
        }
		return this.BTR(P, T_DB, RH);
	},

	BDR(P: number, TDP: number, RH: number): number | null {
		return this.BRD(P, RH, TDP);
	},

	DTR(TF: number, RH: number): number | null {
		return (RH <= 0) ? null : this.TPws(this.PWS(TF) * RH / 100);
	},

	DRT(RH: number, TF: number): number | null {
		return this.DTR(TF, RH);
	},

	DTH(P: number, TF: number, H: number): number | null {
        const RH = this.RTH(P, TF, H);
        if (RH === null) {
            return null;
        }
		return this.DTR(TF, RH);
	},

	DHT(P: number, H: number, TF: number): number | null {
		return this.DTH(P, TF, H);
	},

	DTB(P: number, TF: number, WBF: number): number | null {
		return this.DTR(TF, this.RTB(P, TF, WBF));
	},

	DBT(P: number, WBF: number, TF: number): number | null {
		return this.DTB(P, TF, WBF);
	},

	DRH(P: number, RH: number, H: number): number | null {
        const T_DB = this.TRH(P, RH, H);
        if (T_DB === null) {
            return null;
        }
		return this.DTR(T_DB, RH);
	},

	DHR(P: number, H: number, RH: number): number | null {
		return this.DRH(P, RH, H);
	},

	DRB(P: number, RH: number, WBF: number): number | null {
        const T_DB = this.TRB(P, RH, WBF);
        if (T_DB === null) {
            return null;
        }
		return this.DTR(T_DB, RH);
	},

	DBR(P: number, WBF: number, RH: number): number | null {
		return this.DRB(P, RH, WBF);
	},

	DW(P: number, W: number): number | null {
		const PWS2 = P / (
			(constants.MW / constants.MA) * constants.K1 /
			(W + constants.K3) + constants.K2
		);
		return this.TPws(PWS2);
	},

}