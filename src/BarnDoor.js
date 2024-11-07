var LOGGING = false;

function doLog(msg) {
    if (LOGGING) {
        console.log(msg);
    }
}

function BarnDoor(driveScrewOffset, driveScrew, zeroSwitch, maxAngle) {
    // driveScrewOffset in mm
    var ready = false;
    function degressToRadians(degrees) {
        return 2 * Math.PI * degrees / 360;
    }

    function radiansToDegrees(radians) {
        return radians * 360 / (2 * Math.PI);
    }

    function transformToOffset(degrees) {
        return 2 * driveScrewOffset * Math.sin(degressToRadians(degrees / 2));
    }

    function transformToAngle(offset) {
        return 2 * radiansToDegrees( Math.asin(offset / (2 * driveScrewOffset)) );
    }

    this.getCurrentAngle = function() {
        return transformToAngle(driveScrew.getCurrentOffset());
    };

    this.reset = function(callback) {
        driveScrew.reset(function(err, degrees) {
            callback(err, transformToAngle(degrees));
        });
    };

    this.calibrate = function(callback) {
        zeroSwitch.start(function() {
            var triggered = false;
            function moveBack() {
                if (!triggered) {
                    driveScrew.moveBackward(function() {
                        moveBack();
                    });
                }
            }

            moveBack();
            zeroSwitch.onTriggered(function() {
                console.log("Triggered");
                ready = true;
                triggered = true;
                callback();
            });
        });
    };

    this.log = function(msg, pad) {
        if (pad) {
            pad(msg);
        }
        else {
            console.log("Barn Door: " + msg);
        }
    };

    this.getStatus = function(pad) {
        this.log("Moved " + this.getCurrentAngle() + " degrees", pad);
    };

    this.moveForward = function(callback) {
        driveScrew.moveForward(function(err, degrees) {
            callback(err, transformToOffset(degrees));
        });
    };

    this.moveBackward = function(callback) {
        driveScrew.moveBackward(function(err, degrees) {
            callback(err, transformToOffset(degrees));
        });
    };

    this.moveToAngle = function(targetAngle, callback) {
        if (!ready) {
            throw new Error("Barn door must be configured before starting");
        }
        doLog("Starting to move to angle " + targetAngle);
        driveScrew.moveToOffset(transformToOffset(targetAngle), function(err, degrees) {
            // console.log(":Hrere");
            callback(err, transformToAngle(degrees));
        });
    };

    return this;
}

module.exports = BarnDoor;
