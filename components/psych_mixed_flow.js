window.psych = window.psych || {};

psych.MixedFlow = function(pt1, pt2) {
	this.requiredParameters = ["elevation", "db", "W", "volume", "v"];
	this.requiredParameters.forEach(function(p) {
		if (!pt1.properties[p]) {
			console.error(p + " not defined in Point 1");
			return null;
		}
		if (!pt2.properties[p]) {
			console.error(p + " not defined in Point 2");
			return null;
		}
	});
	
	if (pt1.properties.elevation != pt2.properties.elevation) {
		console.error("Elevations of the provided points do not match.");
		return null;
	}
	
	var mFlow1 = pt1.properties.volume * 60 / pt1.properties.v;
	var mFlow2 = pt2.properties.volume * 60 / pt2.properties.v;
	var mFlow3 = mFlow1 + mFlow2;
	
	console.log(mFlow1, mFlow2, mFlow3, pt2.properties.db - (pt2.properties.db - pt1.properties.db) * (mFlow1 / mFlow3));
	
	return new psych.Point({
		volume: pt1.properties.volume + pt2.properties.volume,
		elevation: pt1.properties.elevation,
		db: pt2.properties.db - (pt2.properties.db - pt1.properties.db) * (mFlow1 / mFlow3),
		W: pt2.properties.W - (pt2.properties.W - pt1.properties.W) * (mFlow1 / mFlow3)
	});
};