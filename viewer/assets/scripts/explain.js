window.psych = window.psych || {};

psych.explain = function (instance) {
    if (instance instanceof CoolingCoil) {
        if (!instance.loads) {
            console.error("Instance not calculated", instance);
            return;
        }
        
    }
}