window.psych = window.psych || {};

psych.Line = function(opts) {

    this.startPoint = null;
    this.endPoint = null;

    this.granularity = 0;

    this.evaluator = null;
    this.evaluatorInput = null;

    this.graphPoints = [];

    this.isValid = function() {
        return (this.startPoint && 
            this.endPoint) != null;
    }

    this.calculate = function() {
        if(this.isValid()) {
            if (granularity == 0) {
                graphPoints.push([this.startPoint])
            }
        }
    }

    this.calculate();

}