var LOGGING = false;

function log(msg) {
    if (LOGGING) {
        console.log(msg);
    }
}

function DriveScrew(pitch, motorController) {
    // pitch mm/rotation
    function transformToDegrees(targetOffset) {
        return targetOffset * 360 / pitch;
    }

    function transformToOffset(degrees) {
        return degrees * pitch / 360;
    }

    this.reset = function(callback) {
        motorController.reset(function(err, degrees) {
            callback(err, transformToOffset(degrees));
        });
    };

    this.log = function(msg, pad) {
        if (pad) {
            pad(msg);
        }
        else {
            console.log("Screw: " + msg);
        }
    };

    this.getStatus = function(pad) {
        this.log("Moved " + this.getCurrentOffset() + "        mm", pad);
    };

    this.moveForward = function(callback) {
        motorController.rotateForward(function(err, degrees) {
            callback(err, transformToOffset(degrees));
        });
    };

    this.moveBackward = function(callback) {
        motorController.rotateBackward(function(err, degrees) {
            callback(err, transformToOffset(degrees));
        });
    };

    this.moveToOffset = function(targetOffset, callback) {
        log("Starting to move to offset " + targetOffset);
        motorController.rotateToDegrees(transformToDegrees(targetOffset), function(err, degrees) {
            var offset = transformToOffset(degrees);
            log("Arrived at offset " + offset);
            callback(err, offset);
        });
    };

    this.getCurrentOffset = function() {
        return transformToOffset(motorController.getCurrentDegrees());
    };

    this.getMinOffsetDelta = function() {
        return transformToOffset(motorController.getMinDegreesDelta());
    };

    return this;
}

module.exports = DriveScrew;