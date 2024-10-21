import { psych } from "../psych.ts";
import { assertEquals, assertExists, assertAlmostEquals } from "@std/assert";

// Test point creation with PointBuilder
Deno.test('should create a point with PointBuilder', () => {
    const point = new psych.PointBuilder()
        .withElevation(600)
        .withDryBulb(70)
        .withRelativeHumidity(50)
        .build();
    assertExists(point);
    assertEquals(point.properties.elevation, 600);
    assertAlmostEquals(point.properties.rh, 50, 1e-4);
    assertExists(point.properties.wb);
    assertExists(point.properties.h);
});

// Test point creation of 100% RH point (WB should equal DB)
Deno.test('should create a point with 100% RH', () => {
    const point = new psych.PointBuilder()
        .withElevation(600)
        .withDryBulb(70)
        .withRelativeHumidity(100)
        .build();
    assertExists(point);
    assertEquals(point.properties.elevation, 600);
    assertAlmostEquals(point.properties.rh, 100, 1e-4);
    assertAlmostEquals(point.properties.wb, point.properties.db, 1e-3);
});