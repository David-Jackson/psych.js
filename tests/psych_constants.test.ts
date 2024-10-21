import { psych } from '../psych.ts';
import { assertEquals, assertExists, assertAlmostEquals } from "@std/assert";

Deno.test('should have a constant named INPSI', () => {
    assertExists(psych.constants.INPSI);
});

Deno.test('INPSI should be close to 2.036', () => {
    assertAlmostEquals(psych.constants.INPSI, 2.0360209673821683, 1e-4);
});

Deno.test('should have constants for Molecular weight and density of air and water', () => {
    assertExists(psych.constants.MA);
    assertExists(psych.constants.MW);
    assertExists(psych.constants.densityOfWater);
});

Deno.test('should have Enthalpy constants C1 through C4', () => {
    assertExists(psych.constants.C1);
    assertExists(psych.constants.C2);
    assertExists(psych.constants.C3);
    assertExists(psych.constants.C4);
});

Deno.test('should have Humidity Ratio constants K1 through K3', () => {
    assertExists(psych.constants.K1);
    assertExists(psych.constants.K2);
    assertExists(psych.constants.K3);
});

Deno.test('should have all ASHRAE Constants P1 through P13', () => {
    assertExists(psych.constants.P1);
    assertExists(psych.constants.P2);
    assertExists(psych.constants.P3);
    assertExists(psych.constants.P4);
    assertExists(psych.constants.P5);
    assertExists(psych.constants.P6);
    assertExists(psych.constants.P7);
    assertExists(psych.constants.P8);
    assertExists(psych.constants.P9);
    assertExists(psych.constants.P10);
    assertExists(psych.constants.P11);
    assertExists(psych.constants.P12);
    assertExists(psych.constants.P13);
});
