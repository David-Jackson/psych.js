import { constants } from "./constants.ts";
import { Point } from "./point.ts";
import { PointBuilder } from "./pointbuilder.js";

// Collection of Utility Calculations
export const utilities = { 
    humidification: {
		// Determines the humidification effiency between two points.
		// Assumes that pt1 is heated/cooled to pt2's enthalpy.
		// Thus calculates the efficiency between pt1's humidity ratio, pt2's humidity ratio, 
		// and the humidity ratio at saturation given pt2's enthalpy.
		efficiency(pt1: Point, pt2: Point) {
			const intermediatePt = new PointBuilder()
				.withElevation(pt2)
				.withHumidityRatio(pt1)
				.withEnthalpy(pt2)
				.build();
			const saturationPt = new PointBuilder()
				.withElevation(pt2)
				.withRelativeHumidity(100)
				.withEnthalpy(pt2)
				.build();
			return (pt2.properties.W - intermediatePt.properties.W) /
				(saturationPt.properties.W - intermediatePt.properties.W); // %
		},

		evaporationRate(inletPoint: Point, outletPoint: Point, volumeInCFM: number) {
			const density = 1 / outletPoint.properties.v; // lb/ft^3
			const massFlowRate = density * volumeInCFM; // lb/min
			return (outletPoint.properties.W - inletPoint.properties.W) * massFlowRate / constants.densityOfWater; // gpm
		},

		// returns an outlet point saturated to a given efficiency of an inlet point
		maximumSaturation(pt: Point, saturationEfficiency = 1.00) {
			const saturationPt = new PointBuilder()
				.withElevation(pt)
				.withRelativeHumidity(100)
				.withEnthalpy(pt)
				.build();
			
				const maxW = (saturationEfficiency * (saturationPt.properties.W - pt.properties.W)) + pt.properties.W;

			return new PointBuilder()
				.withElevation(pt)
				.withEnthalpy(pt)
				.withHumidityRatio(maxW)
				.build();
		}
	},

	dehumidification: {
		efficiency(pt1: Point, pt2: Point) {
			return 1 - (pt2.properties.W / pt1.properties.W);
		}
	},

	cooling: {
		capacity(inletPoint: Point, outletPoint: Point, volumeInCFM: number) {
			const density = 1 / outletPoint.properties.v; // lb/ft^3
			const massFlowRate = density * volumeInCFM * 60; // lb/hr
			return -(outletPoint.properties.h - inletPoint.properties.h) * massFlowRate; // BTU/hr
		},

		// rate at which the cooling coil removes water from the air
		condensationRate(inletPoint: Point, outletPoint: Point, volumeInCFM: number) {
			const density = 1 / outletPoint.properties.v; // lb/ft^3
			const massFlowRate = density * volumeInCFM; // lb/min
			return -(outletPoint.properties.W - inletPoint.properties.W) * massFlowRate / constants.densityOfWater; // gpm
		},

		flowrate(inletPoint: Point, outletPoint: Point, volumeInCFM: number, deltaTofCoolingFluid: number) {
			const capacity = this.capacity(inletPoint, outletPoint, volumeInCFM);
			const specificHeatOfWater = 1.0; // BTU / (lb * degF) //0.9602 // water with 15% glycol //
			return capacity / (specificHeatOfWater * deltaTofCoolingFluid * constants.densityOfWater * 60); // gpm
		}
	},

	heating: {
		capacity(inletPoint: Point, outletPoint: Point, volumeInCFM: number) {
			if (inletPoint.properties.W != outletPoint.properties.W) {
				console.warn("Inlet and outlet points don't have some Humidity Ratio, using inlet point's Humidity Ratio");
			}
			const density = 1 / outletPoint.properties.v; // lb/ft^3
			const massFlowRate = density * volumeInCFM * 60; // lb/hr
			return (outletPoint.properties.h - inletPoint.properties.h) * massFlowRate; // BTU/hr
		}
	},

}