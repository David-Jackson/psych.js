// Different Processes:
// Heating
// Cooling
// Humidifying
// Fan Reheat

// processes = [Cooling, Heating, Humidifying, Fan]

var DEFAULT_COOLING_FLUID_DELTA_T = 20;
var DEFAULT_HEATING_FLUID_DELTA_T = 60;
var DEFAULT_MAX_SATURATION_EFFICIENCY = 0.95;

class AirUnit {
    constructor(inlets, outlets, volume, equipment) {
        if (inlets.length > 2 || outlets.length > 2) {
            console.error("Not designed to have more than two inlet or outlet setpoints", inlets, outlets);
            return;
        }
        if (inlets.length < outlets.length) {
            while (outlets.length != inlets.length) {
                inlets.push(inlets[0]);
            }
        } else {
            while (outlets.length != inlets.length) {
                outlets.push(outlets[0]);
            }
        }
        this.inlets = inlets;
        this.outlets = outlets;
        this.volume = volume;
        this.equipment = equipment;
    }

    calculate() {
        this.processes = [];
        for (var setpointIndex = 0; setpointIndex < this.inlets.length; setpointIndex++) {
            var hasFan = false;

            this.processes[setpointIndex] = [];
            var inlet = this.inlets[setpointIndex];
            var outlet = this.outlets[setpointIndex];


            var equipmentCount = this.equipment.length;
            if (this.equipment[this.equipment.length - 1] == Fan) {
                hasFan = true;
                equipmentCount = this.equipment.length - 1;
                var fanProcess = this.equipment[this.equipment.length - 1];
                fanProcess = new fanProcess(inlet, outlet, this.volume, []);
                fanProcess.calculate();
                this.processes[setpointIndex][this.equipment.length - 1] = fanProcess;
                outlet = fanProcess.inlet;
            }

            var currentInlet = inlet;
            for (var i = 0; i < equipmentCount; i++) {
                var process = this.equipment[i];
                process = new process(currentInlet, outlet, this.volume, this.equipment.slice(i + 1));
                var currentInlet = process.calculate();
                this.processes[setpointIndex][i] = process;
            }

            if (hasFan) {
                var fanProcess = this.processes[setpointIndex][this.equipment.length - 1];
                if (currentInlet.properties.db != fanProcess.inlet.properties.db &&
                    currentInlet.properties.W != fanProcess.inlet.propertiesW) {

                    fanProcess = new FanFixedInlet(currentInlet, this.volume, []);
                    fanProcess.calculate();
                    this.processes[setpointIndex][this.equipment.length - 1] = fanProcess;

                }
            }
        }
    }

    draw() {
        this.processes.forEach(p => p.forEach(equipment => equipment.draw()));
    }

    #mergeLoads(load1, load2) {
        var res = Object.assign({}, load1);
        for (var item in load2) {
            if (!res[item]) {
                res[item] = load2[item];
            } else {
                res[item] = Math.max(res[item], load2[item]);
            }
        }
        return res;
    }

    getLoads() {
        if (this.processes) {
            var spec = {volume: this.volume};

            this.processes.forEach(process => {
                var pastSections = {};
                process.forEach(section => {
                    var sectionName = section.constructor.name;
                    if (!pastSections[sectionName]) pastSections[sectionName] = 0;
                    pastSections[sectionName]++;
                    sectionName = sectionName + "_" + pastSections[sectionName];

                    if (!spec[sectionName]) spec[sectionName] = {};
                    spec[sectionName] = this.#mergeLoads(spec[sectionName], section.loads);
                });
            });

            return spec;
        }
    }

    hasEquipment(...processClasses) {
        return this.equipment.reduce((acc, p) => acc || (processClasses.indexOf(p) != -1), false);
    }

}

class DryingLineAirUnit extends AirUnit {
    constructor(inlets, dryingLineOutlets, volume, equipment) {
        if (dryingLineOutlets.length != 2) {
            console.error("A DryingLineAirUnit must have only two desired outlet setpoints");
            return;
        }

        super(inlets, dryingLineOutlets, volume, equipment);

        this.dryingLine = new psych.Line.LineOfConstantDBandRH({}, ...dryingLineOutlets);

        // while the dryingLineOutlets won't always be the actual outlets, 
        // upon initialization, we will assume those are the outlets.
        // Actual outlet setpoints will be calculated in `calculate()`
    }

    calculate() {
        this.dryingLine.calculate();

        this.outlets = [];

        this.inlets.forEach(inlet => {

            // if inlet has higher absolute humidity than the line, 
            // the outlet is the highest W of the line
            if (this.dryingLine.isGreaterThan("W", inlet.properties.W)) {
                this.outlets.push(this.dryingLine.getPointOfHighest("W"));
                return;
            }

            
            // if inlet has lower absolute humidity and enthalpy than the line, 
            // the outlet is the lowest W of the line
            if (this.dryingLine.isLessThan("W", inlet.properties.W) && this.dryingLine.isLessThan("h", inlet.properties.h)) {
                this.outlets.push(this.dryingLine.getPointOfLowest("W"));
                return;
            }

            // in any other case we do one of three things:
            // 1. Heat to the line (inlet on left side of line)
            // 2. Cool to the line (inlet on right side of line and absolute humidity is between the line)
            // 3. Cool and Humidify to the line (inlet on right side of line and absolute humidity is below the line)
            
            // How to tell which side of the line our inlet is? 
            // Check the W intersection point and see the DB temp difference is +/-
            var heatingCoolingIntersectionPoint = this.dryingLine.findIntersection("W", inlet.properties.W);

            if (!heatingCoolingIntersectionPoint) {
                // the inlet W is not between the line, so humidify and cool
                this.outlets.push(this.dryingLine.getPointOfLowest("W"));
                return;

            }


            // heat or cool to intersection point
            // except we have to adjust the intersection point
            // right now (20220915) the `findIntersection` finds the closest point that is 
            // in the `linePoints` list in the drying line, so the absolute humidity is close,
            // but not exactly the same, which throws the heating and cooling calculation out of whack
            // so let's make a small adjustment
            
            this.outlets.push(new psych.PointBuilder()
                .withElevation(heatingCoolingIntersectionPoint)
                .withDryBulb(heatingCoolingIntersectionPoint)
                .withHumidityRatio(inlet)
                .build()
            );
            return;

        });

        super.calculate();
    }

    draw() {
        this.dryingLine.draw();
        super.draw();
    }


}

class AirProcess {
    constructor(inlet, desiredOutlet, volume = 0, downstreamProcesses = []) {
        this.inlet = inlet;
        this.desiredOutlet = desiredOutlet;
        this.volume = volume;
        this.downstreamProcesses = downstreamProcesses;
        this.loads = {};
    }

    calculate() {

    }

    calculateLoads() {

    }

    draw() {

    }

    isDownstream(...processClasses) {
        return this.downstreamProcesses.reduce((acc, p) => acc || (processClasses.indexOf(p) != -1), false)
    }
}

class MixedFlow {
    constructor(point1, volume1, point2, volume2) {
        this.point1 = point1;
        this.point2 = point2;
        this.volume1 = volume1;
        this.volume2 = volume2;

        this.point1.properties.volume = this.volume1;
        this.point2.properties.volume = this.volume2;
    }

    calculate() {
        this.actualOutlet = psych.MixedFlow(this.point1, this.point2);
    }

    draw() {
        graph.addPoints(graph.colors.points.grey, this.point1, this.point2, this.actualOutlet);
        graph.addLine(graph.colors.lines.orange, [this.point1, this.point2]);
    }
}

class Burner extends AirProcess {
    calculate() {
        var pointBuilder = new psych.PointBuilder()
            .withElevation(this.inlet)
            .withHumidityRatio(this.inlet);

        if (this.inlet.properties.W < this.desiredOutlet.properties.W) { // W is lower than outlet

            if (this.isDownstream(Humidifier)) { // W is lower than outlet, humidifier is downstream

                if (this.inlet.properties.h < this.desiredOutlet.properties.h) { // W and h is lower than outlet, humidifier is downstream
                    // Heat to enthalpy, humidifier will take it to setpoint
                    pointBuilder.withEnthalpy(this.desiredOutlet);
                } else { // W is lower than outlet, humidifier is downstream, but h is higher than outlet
                    // Do nothing
                    this.actualOutlet = this.inlet;
                }

            } else { // W is lower than outlet, humidifier is NOT downstream

                if (this.inlet.properties.db < this.desiredOutlet.properties.db) { // W and DB is lower than outlet, humidifier is NOT downstream
                    // Heat to DB
                    pointBuilder.withDryBulb(this.desiredOutlet);
                } else { // W is lower than outlet, humidifier is NOT downstream, but DB is higher than outlet
                    // Do nothing
                    this.actualOutlet = this.inlet;
                }

            }

        } else { // W is higher than outlet

            if (this.inlet.properties.db < this.desiredOutlet.properties.db) { // W is higher than outlet, DB is lower than outlet

                if (this.isDownstream(CoolingCoil) && (this.isDownstream(HeatingCoil, Burner))) { // W is higher than outlet, DB is lower than outlet, cooling and reheat is downstream
                    // Do nothing
                    this.actualOutlet = this.inlet;
                } else { // W is higher than outlet, DB is lower than outlet, cooling and reheat is NOT downstream
                    // Heat to DB
                    pointBuilder.withDryBulb(this.desiredOutlet);
                }

            } else {
                // Do nothing
                this.actualOutlet = this.inlet;
            }

        }

        if (!this.actualOutlet) this.actualOutlet = pointBuilder.build();

        this.calculateLoads();

        return this.actualOutlet;
    }

    calculateLoads() {
        this.loads = {
            power: psych.calculations.heating.capacity(
                this.inlet, this.actualOutlet, this.volume)
        };
    }

    draw() {
        if (this.inlet.properties.db != this.actualOutlet.properties.db) {
            graph.addPoints(graph.colors.points.grey, this.inlet, this.actualOutlet);
            graph.addLine(graph.colors.lines.red, [this.inlet, this.actualOutlet]);
        }
    }
}

class Humidifier extends AirProcess {
    calculate() {
        var pointBuilder = new psych.PointBuilder()
            .withElevation(this.inlet)
            .withEnthalpy(this.inlet);

        if (this.inlet.properties.h > this.desiredOutlet.properties.h) { // enthalpy is higher than outlet

            if (this.isDownstream(CoolingCoil)) { // enthalpy is higher than outlet, cooling is downstream

                if (this.inlet.properties.W < this.desiredOutlet.properties.W) { // enthalpy is higher than outlet, W is lower than outlet, cooling is downstream
                    // Humidify to W
                    pointBuilder.withHumidityRatio(this.desiredOutlet);
                } else { // enthalpy and W is higher than outlet, cooling is downstream
                    // Do nothing
                    this.actualOutlet = this.inlet;
                }

            } else { // enthalpy is higher than outlet, cooling is NOT downstream

                if (this.inlet.properties.db > this.desiredOutlet.properties.db) { // enthalpy and DB is higher than outlet, cooling is NOT downstream
                    // Humidify to DB
                    pointBuilder.withDryBulb(this.desiredOutlet);
                } else { // enthalpy is higher than outlet, DB is lower than outlet, cooling is NOT downstream
                    // Do nothing
                    this.actualOutlet = this.inlet;
                }
            }

        } else { // enthalpy is lower than outlet

            if (this.isDownstream(Burner, HeatingCoil)) { // enthalpy is lower than outlet, heating is downstream

                if (this.inlet.properties.W < this.desiredOutlet.properties.W) { // enthalpy and humidity ratio is lower than outlet, heating is downstream
                    // Humidify to W
                    pointBuilder.withHumidityRatio(this.desiredOutlet);
                } else { // enthalpy is lower than outlet, humidity ratio is higher than outlet, heating is downstream
                    // Do nothing
                    this.actualOutlet = this.inlet;
                }
                
            } else { // enthalpy is lower than outlet, heating is NOT downstream

                if (this.inlet.properties.db > this.desiredOutlet.properties.db) { // enthalpy is lower than outlet, DB is higher than outlet, heating is NOT downstream
                    // Humidify to DB
                    pointBuilder.withDryBulb(this.desiredOutlet);
                } else { // enthalpy and DB is lower than outlet, heating is NOT downstream
                    // Do nothing
                    this.actualOutlet = this.inlet;
                }

            }

        }

        if (!this.actualOutlet) this.actualOutlet = pointBuilder.build();

        this.calculateLoads();

        if (this.loads.efficiency == Infinity) this.loads.efficiency = 0;

        if (this.loads.efficiency > DEFAULT_MAX_SATURATION_EFFICIENCY) {
            // limiting a humidifier to it's saturation efficiency
            this.actualOutlet = psych
                .calculations
                .humidification
                .maximumSaturation(this.inlet, DEFAULT_MAX_SATURATION_EFFICIENCY);

            this.calculateLoads();
        }

        return this.actualOutlet;
    }

    calculateLoads() {
        this.loads = {
            efficiency: psych.calculations.humidification.efficiency(
                this.inlet, this.actualOutlet),
            evaporationRate: psych.calculations.humidification.evaporationRate(
                this.inlet, this.actualOutlet, this.volume)
        };
    }

    draw() {
        if (this.inlet.properties.db != this.actualOutlet.properties.db) {
            graph.addPoints(graph.colors.points.grey, this.inlet, this.actualOutlet);
            graph.addLine(graph.colors.lines.green, [this.inlet, this.actualOutlet]);
        }
    }
}

class Dehumidifier extends AirProcess {

}

class CoolingCoil extends AirProcess {
    constructor(inlet, desiredOutlet, volume = 0, downstreamProcesses = [], deltaTofCoolingFluid = DEFAULT_COOLING_FLUID_DELTA_T) {
        super(inlet, desiredOutlet, volume, downstreamProcesses);
        this.deltaTofCoolingFluid = deltaTofCoolingFluid;
    }
    calculate() {

        if (this.inlet.properties.db > this.desiredOutlet.properties.db) { // DB is higher than outlet

            if (this.inlet.properties.W > this.desiredOutlet.properties.W) { // DB and W is higher than outlet

                if (this.isDownstream(Burner, HeatingCoil)) { // DB and W is higher than outlet, heating is downstream
                    // Cool to saturation, reheat will happen downstream
                    this.actualOutlet = new psych.PointBuilder()
                        .withElevation(this.inlet)
                        .withHumidityRatio(this.desiredOutlet)
                        .withRelativeHumidity(100)
                        .build()
                } else { // DB and W is higher than outlet, heating is NOT downstream
                    // Cool just to the DB
                    this.actualOutlet = new psych.PointBuilder()
                        .withElevation(this.inlet)
                        .withHumidityRatio(this.inlet)
                        .withDryBulb(this.desiredOutlet)
                        .build()
                    if (this.actualOutlet.properties.rh > 100) { // Check if cooling to DB hits saturation
                        this.actualOutlet = new psych.PointBuilder()
                            .withElevation(this.inlet)
                            .withDryBulb(this.desiredOutlet)
                            .withRelativeHumidity(100)
                            .build()
                    }
                }

            } else { // DB is higher than outlet, W is lower than outlet
                if (this.isDownstream(Humidifier)) { // DB is higher than outlet, W is lower than outlet, humidification is downstream

                    if (this.inlet.properties.h > this.desiredOutlet.properties.h) { // DB is higher than outlet, W is lower than outlet, humidification is downstream, and enthalpy is higher than outlet
                        // Cool to enthalpy so humidifier can take it the rest of the way
                        this.actualOutlet = new psych.PointBuilder()
                            .withElevation(this.inlet)
                            .withHumidityRatio(this.inlet)
                            .withEnthalpy(this.desiredOutlet)
                            .build()
                    } else { // DB is higher than outlet, W is lower than outlet, humidification is downstream, and enthalpy is lower than outlet
                        // Do nothing, humidifier will take it closer to the desired setpoint
                        this.actualOutlet = this.inlet; 
                    }

                } else { // DB is higher than outlet, W is lower than outlet, humidification is NOT downstream
                    // Cool just to the DB
                    this.actualOutlet = new psych.PointBuilder()
                        .withElevation(this.inlet)
                        .withHumidityRatio(this.inlet)
                        .withDryBulb(this.desiredOutlet)
                        .build()
                }
            }

        } else { // DB is lower than outlet

            if (this.inlet.properties.W > this.desiredOutlet.properties.W) { // DB is lower than outlet, W is higher than outlet
                
                if (this.isDownstream(Burner, HeatingCoil)) { // DB is lower than outlet, W is higher than outlet, heating is downstream
                    // Cool to saturation, reheat will happen downstream
                    this.actualOutlet = new psych.PointBuilder()
                        .withElevation(this.inlet)
                        .withHumidityRatio(this.desiredOutlet)
                        .withRelativeHumidity(100)
                        .build()
                } else { // DB is lower than outlet, W is higher than outlet, heating is NOT downstream
                    // Do nothing
                    this.actualOutlet = this.inlet;
                }

            } else { // DB and W is lower than outlet
                // Do nothing
                this.actualOutlet = this.inlet;
            }

        }

        this.calculateLoads();

        return this.actualOutlet;
    }

    calculateLoads() {
        this.loads = {
            power: psych.calculations.cooling.capacity(
                this.inlet, this.actualOutlet, this.volume),
            condensationRate: psych.calculations.cooling.condensationRate(
                this.inlet, this.actualOutlet, this.volume),
            coolingCoilFlowRate: psych.calculations.cooling.flowrate(
                this.inlet, this.actualOutlet, this.volume, this.deltaTofCoolingFluid)
        };
    }

    draw() {
        if (this.inlet.properties.db != this.actualOutlet.properties.db) {
            graph.addPoints(graph.colors.points.grey, this.inlet, this.actualOutlet);

            if (this.inlet.properties.W <= this.actualOutlet.properties.W) {
                graph.addLine(graph.colors.lines.blue, [this.inlet, this.actualOutlet]);
            } else {
                this.saturationPoint = new psych.PointBuilder()
                    .withElevation(this.inlet)
                    .withHumidityRatio(this.inlet)
                    .withRelativeHumidity(100)
                    .build();

                graph.addLine(graph.colors.lines.blue, [this.inlet, this.saturationPoint]);
                graph.addLineOfConstantRelativeHumidity(
                    graph.colors.lines.blue, this.saturationPoint, this.actualOutlet);
            }
        }
    }
}

class HeatingCoil extends AirProcess {
    constructor(inlet, desiredOutlet, volume = 0, downstreamProcesses = [], deltaTofHeatingFluid = DEFAULT_HEATING_FLUID_DELTA_T) {
        super(inlet, desiredOutlet, volume, downstreamProcesses);
        this.deltaTofHeatingFluid = deltaTofHeatingFluid;
    }
    calculate() {
        // logic copied from Burner.calculate()
        var pointBuilder = new psych.PointBuilder()
            .withElevation(this.inlet)
            .withHumidityRatio(this.inlet);

        if (this.inlet.properties.W < this.desiredOutlet.properties.W) { // W is lower than outlet

            if (this.isDownstream(Humidifier)) { // W is lower than outlet, humidifier is downstream

                if (this.inlet.properties.h < this.desiredOutlet.properties.h) { // W and h is lower than outlet, humidifier is downstream
                    // Heat to enthalpy, humidifier will take it to setpoint
                    pointBuilder.withEnthalpy(this.desiredOutlet);
                } else { // W is lower than outlet, humidifier is downstream, but h is higher than outlet
                    // Do nothing
                    this.actualOutlet = this.inlet;
                }

            } else { // W is lower than outlet, humidifier is NOT downstream

                if (this.inlet.properties.db < this.desiredOutlet.properties.db) { // W and DB is lower than outlet, humidifier is NOT downstream
                    // Heat to DB
                    pointBuilder.withDryBulb(this.desiredOutlet);
                } else { // W is lower than outlet, humidifier is NOT downstream, but DB is higher than outlet
                    // Do nothing
                    this.actualOutlet = this.inlet;
                }

            }

        } else { // W is higher than outlet

            if (this.inlet.properties.db < this.desiredOutlet.properties.db) { // W is higher than outlet, DB is lower than outlet

                if (this.isDownstream(CoolingCoil) && (this.isDownstream(HeatingCoil, Burner))) { // W is higher than outlet, DB is lower than outlet, cooling and reheat is downstream
                    // Do nothing
                    this.actualOutlet = this.inlet;
                } else { // W is higher than outlet, DB is lower than outlet, cooling and reheat is NOT downstream
                    // Heat to DB
                    pointBuilder.withDryBulb(this.desiredOutlet);
                }

            } else {
                // Do nothing
                this.actualOutlet = this.inlet;
            }

        }

        if (!this.actualOutlet) this.actualOutlet = pointBuilder.build();
        // end of logic copied from Burner.calculate()

        this.calculateLoads();

        return this.actualOutlet;
    }

    calculateLoads() {
        this.loads = {
            power: psych.calculations.heating.capacity(
                this.inlet, this.actualOutlet, this.volume),
            heatingCoilFlowRate: -psych.calculations.cooling.flowrate(
                this.inlet, this.actualOutlet, this.volume, this.deltaTofHeatingFluid)
        };
    }

    draw() {
        if (this.inlet.properties.db != this.actualOutlet.properties.db) {
            graph.addPoints(graph.colors.points.grey, this.inlet, this.actualOutlet);
            graph.addLine(graph.colors.lines.red, [this.inlet, this.actualOutlet]);
        }
    }
}

class Fan extends AirProcess {
    calculate() {
        var BTU_HR_PER_HORSEPOWER = 2546.699; // (BTU/hr) / hp

        var fanVolume = this.inlet.properties.volume;
        var fanPressure = this.inlet.properties.fanPressure;
        var fanEfficiency = this.inlet.properties.fanEfficiency;
        if (!fanVolume || !fanPressure) {
            // console.log("Fan volume or fan pressure not defined, assuming 4 degree F temperature gain across fan");

            this.inlet = new psych.PointBuilder()
                .withElevation(this.desiredOutlet)
                .withDryBulb(this.desiredOutlet.properties.db - 5)
                .withHumidityRatio(this.desiredOutlet)
                .build();
        } else {
            if (!fanEfficiency) {
                // console.log("Fan Efficiency not set, assuming 75%");
                fanEfficiency = 0.75;
            }
            var airHorsepower = fanVolume * fanPressure / 6356;
            var brakeHorsepower = airHorsepower / fanEfficiency;

            var heatAddedByFan = (brakeHorsepower - airHorsepower) * BTU_HR_PER_HORSEPOWER; // BTU/hr

            var density = 1 / this.desiredOutlet.properties.v; // lb/ft^3
            var massFlowRate = density * fanVolume * 60; // lb/hr

            var enthalpyAddedByFan = heatAddedByFan / massFlowRate; // BTU/lb

            this.inlet = new psych.PointBuilder()
                .withElevation(this.desiredOutlet)
                .withEnthalpy(this.desiredOutlet.properties.h - enthalpyAddedByFan)
                .withHumidityRatio(this.desiredOutlet)
                .build();
        }

        if (this.inlet.properties.rh > 100) {
            this.inlet = new psych.PointBuilder()
                .withElevation(this.desiredOutlet)
                .withDryBulb(this.inlet)
                .withRelativeHumidity(100)
                .build();
            this.desiredOutlet = new psych.PointBuilder()
                .withElevation(this.desiredOutlet)
                .withDryBulb(this.desiredOutlet)
                .withHumidityRatio(this.inlet)
                .build();
        }

        this.actualOutlet = this.desiredOutlet;
        return this.actualOutlet;

    }

    draw() {
        if (this.inlet.properties.db != this.actualOutlet.properties.db) {
            graph.addPoints(graph.colors.points.grey, this.inlet, this.actualOutlet);
            graph.addLine(graph.colors.lines.red, [this.inlet, this.actualOutlet]);
        }
    }
}

class FanFixedInlet extends AirProcess {
    constructor(inlet, volume = 0, downstreamProcesses = [], pressure, efficiency) {
        super(inlet, null, volume, downstreamProcesses);
        this.pressure = pressure;
        this.efficiency = efficiency;
    }
    calculate() {
        var BTU_HR_PER_HORSEPOWER = 2546.699; // (BTU/hr) / hp

        if (!this.volume || !this.pressure) {
            // console.log("Fan volume or fan pressure not defined, assuming 4 degree F temperature gain across fan");

            this.actualOutlet = new psych.PointBuilder()
                .withElevation(this.inlet)
                .withDryBulb(this.inlet.properties.db + 5)
                .withHumidityRatio(this.inlet)
                .build();
        } else {
            if (!this.efficiency) {
                // console.log("Fan Efficiency not set, assuming 75%");
                this.efficiency = 0.75;
            }
            var airHorsepower = this.volume * this.pressure / 6356;
            var brakeHorsepower = airHorsepower / this.efficiency;

            console.log("Horsepower:", airHorsepower, brakeHorsepower);

            var heatAddedByFan = (brakeHorsepower - airHorsepower) * BTU_HR_PER_HORSEPOWER; // BTU/hr

            var density = 1 / this.inlet.properties.v; // lb/ft^3
            var massFlowRate = density * this.volume * 60; // lb/hr

            var enthalpyAddedByFan = heatAddedByFan / massFlowRate; // BTU/lb

            console.log(this.volume, this.pressure, this.efficiency, "->", heatAddedByFan, enthalpyAddedByFan);

            this.actualOutlet = new psych.PointBuilder()
                .withElevation(this.inlet)
                .withEnthalpy(this.inlet.properties.h + enthalpyAddedByFan)
                .withHumidityRatio(this.inlet)
                .build();
        }

        return this.actualOutlet;

    }

    draw() {
        if (this.inlet.properties.db != this.actualOutlet.properties.db) {
            graph.addPoints(graph.colors.points.grey, this.inlet, this.actualOutlet);
            graph.addLine(graph.colors.lines.red, [this.inlet, this.actualOutlet]);
        }
    }
}


psych.AirUnitBuilder = function () {

}