const now = Date.now;
var LOGGING = false;

function doLog(msg) {
    if (LOGGING) {
        console.log(msg);
    }
}

function MotorController(fullStepsPerRotation, minDelayBetweenSteps, stepper) {
    var stepsPerRotation = stepper.halfStep
        ? fullStepsPerRotation * 2
        : fullStepsPerRotation;

    var targetDegrees = 0;
    var lastUpdated;
    var updating;
    var resetting;

    function minTimeout(callback) {
        while (true) {
            if ((now() - lastUpdated) > minDelayBetweenSteps) {
                break;
            }
        }
        callback();
    }

    function stepToTarget(targetPosition, callback) {
        function go() {
            if (updating || resetting) {
                // console.log("here");
                // throw new Error("busy");
                process.nextTick(callback.bind(this, "Updating"));
                return;
            }
            var startPosition = stepper.getPosition();
            if (startPosition === targetPosition) {
                process.nextTick(callback.bind(this, null, targetPosition, startPosition));
                return;
            }

            updating = true;

            if (startPosition < targetPosition) {
                stepper.stepForward(function(err, position) {
                    updating = false;
                    lastUpdated = now();
                    if (position >= targetPosition || err) {
                        callback(err, targetPosition, position);
                        return;
                    }
                    minTimeout(go);
                });
            }
            else {
                stepper.stepBackward(function(err, position) {
                    updating = false;
                    lastUpdated = now();
                    if (position <= targetPosition || err) {
                        callback(err, targetPosition, position);
                        return;
                    }
                    minTimeout(go);
                });
            }
        }

        go();
    }

    function transformToSteps(degrees) {
        return Math.round((degrees * stepsPerRotation) / 360);
    }

    function transformFromSteps(steps) {
        return steps * 360 / stepsPerRotation;
    }

    this.reset = function(callback) {
        resetting = true;
        stepper.reset(function(err, actualPosition) {
            resetting = false;
            targetDegrees = 0;
            lastUpdated = undefined;
            updating = undefined;
            console.log("Motor controller reset");
            callback(err, transformFromSteps(actualPosition));
        });
    };

    this.getMinDegreesDelta = function() {
        return 360 / stepsPerRotation;
    };

    this.getCurrentDegrees = function() {
        return transformFromSteps(stepper.getPosition());
    };

    this.log = function(msg, pad) {
        if (pad) {
            pad(msg);
        }
        else {
            console.log("Motor: " + msg);
        }
    };

    this.getStatus = function(pad) {
        this.log("Moved " + this.getCurrentDegrees() + " degrees", pad);
    };

    this.stop = function(callback) {
        stepper.cancel(function(err, actualPosition) {
            callback(err, transformFromSteps(actualPosition));
        });
    };

    this.rotateForward = function(callback) {
        stepper.stepForward(function(err, actualPosition) {
            callback(err, transformFromSteps(actualPosition));
        });
    };

    this.rotateBackward = function(callback) {
        stepper.stepBackward(function(err, actualPosition) {
            callback(err, transformFromSteps(actualPosition));
        });
    };

    this.rotateToDegrees = function(requestDegrees, callback) {
        doLog("Starting rotation to " + requestDegrees);
        targetDegrees = requestDegrees;
        var started = now();
        var startPosition = stepper.getPosition();
        stepToTarget(transformToSteps(targetDegrees), function(err, actualPosition) {
            var timeTaken = now() - started;
            doLog("Rotated " + (actualPosition - startPosition) + " steps in " + timeTaken + "ms, " + (timeTaken / (actualPosition - startPosition)) + "ms per step");
            doLog("Finished rotation to " + transformFromSteps(actualPosition));
            callback(err, transformFromSteps(actualPosition));
        });
    };
}

module.exports = MotorController;