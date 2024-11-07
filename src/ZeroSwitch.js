var GPIO = require('./GPIO');

function ZeroSwitch(pin) {
    var checks;
    function isTriggered(callback) {
        GPIO.read(pin, function(err, value) {
            if (err) {
                console.log(err);
                throw new Error("Couldn't read GPIO");
            }
            checks+=1;
            callback(value === GPIO.HIGH);
        });
    }

    this.start = function(callback) {
        GPIO.open(pin, GPIO.INPUT, function(err) {
            if (err) {
                console.log(err);
                console.log("Failed to start ZeroSwitch");
                return;
            }
            callback();
        });
    };

    this.onTriggered = function(callback) {
        checkTriggered();
        function checkTriggered() {
            isTriggered(function(triggered) {
                if (triggered) {
                    callback();
                }
                else {
                    checkTriggered();
                }
            });
        }
    };

    return this;
}

module.exports = ZeroSwitch;

