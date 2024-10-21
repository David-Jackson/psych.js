import { psych } from "../psych.ts";
import { assertEquals, assertExists, assertAlmostEquals } from "@std/assert";

// Calculate the cooling load between two points
Deno.test('should calculate the cooling load between two points', () => {
    const ELEV = 600;
    const coilInlet = new psych.PointBuilder()
        .withElevation(ELEV)
        .withDryBulb(90)
        .withRelativeHumidity(50)
        .build();
    const coilOutlet = new psych.PointBuilder()
        .withElevation(ELEV)
        .withDryBulb(75)
        .withHumidityRatio(coilInlet)
        .build();
    const load = psych.utilities.cooling.capacity(coilInlet, coilOutlet, 10000);
    assertExists(load);
    assertAlmostEquals(load, 157577.9, 1);
});

// Calculate the heating load between two points
Deno.test('should calculate the heating load between two points', () => {
    const ELEV = 1235;
    const volume = 10000;
    const burnerInlet = new psych.PointBuilder()
        .withElevation(ELEV)
        .withDryBulb(20)
        .withRelativeHumidity(50)
        .build();
    const burnerOutlet = new psych.PointBuilder()
        .withElevation(ELEV)
        .withDryBulb(120)
        .withHumidityRatio(burnerInlet)
        .build();
    const load = psych.utilities.heating.capacity(burnerInlet, burnerOutlet, volume);
    assertExists(load);
    assertAlmostEquals(load, 944136.68, 1);
});

// Calculate the humidification efficiency between two points
Deno.test('should calculate the humidification efficiency between two points', () => {
    const ELEV = 1235;
    const humidfierInlet = new psych.PointBuilder()
        .withElevation(ELEV)
        .withDryBulb(90)
        .withRelativeHumidity(10)
        .build();
    const humidfierOutlet = new psych.PointBuilder()
        .withElevation(ELEV)
        .withDryBulb(70)
        .withEnthalpy(humidfierInlet)
        .build();
    const efficiency = psych.utilities.humidification.efficiency(humidfierInlet, humidfierOutlet);
    assertExists(efficiency);
    // 60.497% is the expected efficiency
    assertAlmostEquals(efficiency, 60.50 / 100, 0.01 / 100);
});