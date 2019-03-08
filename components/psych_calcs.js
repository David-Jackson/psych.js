window.psych = window.psych || {};

psych.constants = {
	INPSI: (760 * 9.80665 * 0.45359237) / (Math.pow(25.4, 3) * 0.101325), // INPSI = inHg per psia
	MA: 28.9645,  // Molecular weight of air
	MW: 18.01528, // Molecular weight of water
	
	C1: 0.240145, // C1 thru C4 are constants used in the equation for h
	C2: 0.0000016,
	C3: 1061.1,
	C4: 0.4328,
	
	K1: 1.00402,  // K1 thru K3 are constants used in the equation for W
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
			return (pt2.properties.W - intermediatePt.properties.W) 
				/ (saturationPt.properties.W - intermediatePt.properties.W);
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
			var specificHeatOfWater = 1.0; // BTU / (lb * degF)
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

	test(arr) {
		// test these calculations with an a array of two-item arrays containing the function and result
		var passCount = 0;
		for (var i = 0; i < arr.length; i++) {
			var func = arr[i][0];
			var ans = arr[i][1];
			var testAns = eval("psych.calculations." + func);
			if (Math.abs(ans - testAns) < 1E-10) {
				passCount++;
				console.log(i);
			} else {
				console.log(i, "Fail", func, ans - testAns);
			}
		}
		return (100 * passCount / arr.length).toFixed(2) + "% (" + passCount + "/" + arr.length + ") of tests passed";
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
		while (true) {
			let e2 = (H - (psych.constants.C1 + psych.constants.C2 * g2) * g2) /
				(psych.constants.C3 + psych.constants.C4 * g2) - this.WTR(P, g2, RH); // Error of current guess
			if (e2 == 0 || e1 - e2 == 0) {
				break;
			} else if (Math.log10(Math.abs(e2)) < -14) {
				break;
			}
			let g3 = g2 - ((g1 - g2) * e2 / (e1 - e2)); // Calc new guess
			g1 = g2;
			e1 = e2;	// Swap old guess with current guess
			g2 = g3;	// Swap current guess with new guess
		}				// Try again
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
		let e1 = (pws_wbf - ((P - pws_wbf) * (g1 - WBF)) / (2830 - 1.44 * WBF)) - RH * this.PWS(g1) / 100
		while (true) {
			let e2 = (pws_wbf - ((P - pws_wbf) * (g2 - WBF)) / (2830 - 1.44 * WBF)) - RH * this.PWS(g2) / 100
			if (e2 == 0 || e1 - e2 == 0) {
				break;
			} else if (Math.log10(Math.abs(e2)) < -14) {
				break;
			}
			let g3 = g2 - ((g1 - g2) * e2 / (e1 - e2)); // Calc new guess
			g1 = g2;
			e1 = e2;	// Swap old guess with current guess
			g2 = g3;	// Swap current guess with new guess
		} 			// Try again
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
		let g2 = 300;					// First guess for TF
		let g1 = 301;					// Old guess
		let e1 = PWS2 - this.PWS(g1); 	// Error of old guess
		while (true) {
			let e2 = PWS2 - this.PWS(g2) // Error of current guess
			if (e2 == 0 || e1 - e2 == 0) {
				break;
			} else if (Math.log10(Math.abs(e2)) < -14) {
				break;
			}
			let g3 = g2 - ((g1 - g2) * e2 / (e1 - e2)); //Calc new guess

			g1 = g2;
			e1 = e2;	// Swap old guess with current guess
			g2 = g3;	// Swap current guess with new guess
		}				// Try again
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
			WTR(P, TF, RH) * (psych.constants.C3 + psych.constants.C4 * TF);
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
		let g2 = TF;		// First guess for TWB
		let g1 = TF + 1;	// Old guess
		let pws_g1 = this.PWS(g1);
		let pw_rf = this.PW(TF, RH);
		let e1 = pw_rf - (pws_g1 - ((P - pws_g1) * (TF - g1)) / (2830 - 1.44 * g1)); // Error of old guess
		while (true) {
			let pws_g2 = this.PWS(g2);
			let e2 = pw_rf - (pws_g2 - ((P - pws_g2) * (TF - g2)) / (2830 - 1.44 * g2)); // Error of current guess
			if (e2 == 0 || e1 - e2 == 0) {
				break;
			} else if (Math.log10(Math.abs(e2)) < -14) {
				break;
			}
			let g3 = g2 - ((g1 - g2) * e2 / (e1 - e2)); // Calc new guess
			g1 = g2;
			e1 = e2;	// Swap old guess with current guess
			g2 = g3;	// Swap current guess with new guess
		}				// Try again
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

psych.calculations.old = {
	
	// ASHRAE Equation 3
	atmPressure(elevInFt) { // atmospheric pressure in inHg
		return (760 / 25.4) * Math.pow((1 - 0.0000068753 * elevInFt), 5.2559);
	},
	
	// ASHRAE Equation 6
	pws(temp) { // Saturation pressure over liquid water, temperature given in Rankin
		var absTemp = temp + 459.67
		var c8 = -10440.4,
			c9 = -11.29465,
			c10 = -0.027022355,
			c11 = 0.00001289036,
			c12 = -0.000000002478068,
			c13 = 6.5459673;
		
		return psych.constants.INPSI * Math.exp(
			c8 / absTemp + 
			c9 + 
			c10 * absTemp + 
			c11 * Math.pow(absTemp, 2) + 
			c12 * Math.pow(absTemp, 3) + 
			c13 * Math.log(absTemp)
		);
	},
	
	tPws(pws2) {
		
		let g1 = 301; // old guess for TF
		let g2 = 300; // first guess for TF
		
		let e1 = pws2 - psych.calculations.pws(g1); // error of guess
		
		let iterCount = 0;
		let iterLimit = 10000;
		
		while (true) {
			if (iterCount++ > iterLimit) {
				console.log("Iter limit reached", iterCount);
				return null;
			}
			let e2 = pws2 - psych.calculations.pws(g2);
			
			if (e2 == 0 || e1 - e2 == 0) {
				break;
			} else if (Math.log10(Math.abs(e2)) < -14) {
				break;
			}
			
			let g3 = g2 - ((g1 - g2) * e2 / (e1 - e2)); // new guess
			g1 = g2;
			g2 = g3;
			e1 = e2;
			
		}
		
		return g2;
	},
	
	
	// Calculations for Dry Bulb Temperature
	
	trb(p, rh, wb) {
		let pws_wb = psych.calculations.pws(wb);
		
		let g1 = 71; // old guess for TF
		let g2 = 70; // first guess for TF
		
		let e1 = (pws_wb - ((p - pws_wb) * (g1 - wb)) / (2830 - 1.44 * wb)) - rh * psych.calculations.pws(g1) / 100; // error of guess
		
		let iterCount = 0;
		let iterLimit = 10000;
		
		while (true) {
			if (iterCount++ > iterLimit) {
				console.log("Iter limit reached", iterCount);
				return null;
			}
			let e2 = (pws_wb - ((p - pws_wb) * (g2 - wb)) / (2830 - 1.44 * wb)) - rh * psych.calculations.pws(g2) / 100;;
			
			if (e2 == 0 || e1 - e2 == 0) {
				break;
			} else if (Math.log10(Math.abs(e2)) < -14) {
				break;
			}
			
			let g3 = g2 - ((g1 - g2) * e2 / (e1 - e2)); // new guess
			g1 = g2;
			g2 = g3;
			e1 = e2;
			
		}
		return g2;
	},
	
	twb(p, W, wb) {
		let pws_dp = p / (
			(psych.constants.MW / psych.constants.MA) * 
			(psych.constants.K1 / (W + psych.constants.K3)) + psych.constants.K2
		);
		
		let pws_wb = this.pws(wb)
		
		return wb + (pws_wb - pws_dp) * (2830 - 1.44 * wb) / (p - pws_wb);
	},
	
	// Calculations for Dewpoint
	
	dtr(db, rh) { // Calculate Dewpoint given Dry bulb and Relative Humidity
		if (rh < 0) return null;
		return this.tPws(this.pws(db) * rh / 100);
	},
	
	// Calculations for Humidity Ratio
	
	wd(p, dp) { // Calculate Humidity Ratio given Pressure and Dewpoint
		let pws = this.pws(dp);
		
		if (psych.constants.K2 * pws >= p) return null;
		
		return Math.max(0, (psych.constants.MW / psych.constants.MA) * psych.constants.K1 * pws / (p - psych.constants.K2 * pws) - psych.constants.K3);
	},
	
	wtr(p, db, rh) {
		if (rh < 0) return null;
		let dp = this.dtr(db, rh);
		
		if (dp === null) return null;
		
		return this.wd(p, dp);
	}
	
};