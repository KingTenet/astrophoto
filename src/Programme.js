const now = Date.now;

function doLog(msg) {
    if (false) {
        console.log(msg);
    }
}

function pad(prefix) {
    return function(msg) {
        console.log(prefix + msg);
    }
}

const DEBUG_IDENTITY = 1; // Should be set to 1 for normal operation
const MS_PER_MINUTE = 60 * 1000;

function Programme(barnDoor, driveScrew, motor, stepper) {
    const ANGLE_PER_DAY = 360 * DEBUG_IDENTITY;
    const MS_PER_DAY = MS_PER_MINUTE * 60 * 24;
    var started;
    var statusTimeout;
    var iterations = 0;

    function timeMsToAngle(timeMs) {
        return timeMs * ANGLE_PER_DAY / MS_PER_DAY;
    }

    function angleToTime(angle) {
        return angle * MS_PER_DAY / ANGLE_PER_DAY;
    }

    function getStatus(pad) {
        pad(iterations + " iterations");
    }

    function logAll() {
        getStatus(pad(           "Programme:     "));
        barnDoor.getStatus(pad(  "  Barn Door:   "));
        driveScrew.getStatus(pad("  Drive Screw: "));
        motor.getStatus(pad(     "  Motor:       "));
        stepper.getStatus(pad(   "  Stepper:     "));
    }

    this.logStatus = function(timeout) {
        statusTimeout = setInterval(function() {
            logAll();
        }, timeout);
    };

    this.start = function(exposureMs) {
        if (started) {
            throw new Error("Programme started");
        }

        barnDoor.calibrate(function() {
            barnDoor.reset(function(err, angle) {
                console.log("Starting at angle " + angle);
                started = now();
                move();
            });
        });

        function move() {
            var moveStart = now();
            var offsetMs = moveStart - started;

            iterations += 1;
            if (moveStart - angleToTime() > 1000) {
                throw new Error("Cannot keep up");
            }
            barnDoor.moveToAngle(
                timeMsToAngle(offsetMs),
                function(err, angle) {
                    doLog("Arrived at angle " + angle);
                    if (offsetMs > exposureMs) {
                        console.log("Finished in " + (now() - started) + "ms");
                        if (statusTimeout) {
                            clearInterval(statusTimeout);
                        }
                        return;
                    }
                    move();
                }
            );
        }
    };
}

module.exports = Programme;