# psych.js
A javascript library for psychrometric calculations. See the viewer [here](https://david-jackson.github.io/psych.js/viewer).

## Components

psych.js is composed of 4 main components: calculations, points, point builders, and mixed flows.

### Calculations 

These are all calculations needed to determine different properties of moist air. Calculations are based on ASHRAE IP equations and were originally written by [Jim Pakkala, PE](https://www.linkedin.com/in/jimpakkala) in VBA and were then translated into this javascript library by David Jackson. 

### Points 

Psychrometric points are points on the psychrometric chart that contain the following psychrometric properties:
- Elevation
- Atmospheric Pressure
- Dry bulb temperature
- Wet bulb temperature
- Humidity Ratio
- Relative Humidity
- Enthalpy
- Dew point temperature

### Point Builders

Point builders are simple builders that are used to create points. There are only three properties needed to calculate the rest of the psychrometric properties: elevation and any two of the other point properties.

*Currently there is no implementation for calculating a point given the wet bulb temperature and enthalpy, this feature still needs to be developed.*

### Mixed Flows

*Still under development*