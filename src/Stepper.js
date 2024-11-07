var gpio = require('./GPIO');
var utils = require("./utils");
var assertOneOf = utils.assertOneOf;
var Queue = utils.Queue;

const HALF_STEP_SEQUENCE = [
    [gpio.HIGH, gpio.HIGH, gpio.LOW , gpio.LOW , gpio.LOW , gpio.LOW , gpio.LOW , gpio.HIGH],
    [gpio.LOW , gpio.HIGH, gpio.HIGH, gpio.HIGH, gpio.LOW , gpio.LOW , gpio.LOW , gpio.LOW ],
    [gpio.LOW , gpio.LOW , gpio.LOW , gpio.HIGH, gpio.HIGH, gpio.HIGH, gpio.LOW , gpio.LOW ],
    [gpio.LOW , gpio.LOW , gpio.LOW , gpio.LOW , gpio.LOW , gpio.HIGH, gpio.HIGH, gpio.HIGH],
];

const FULL_STEP_SEQUENCE = [
    [gpio.HIGH, gpio.LOW , gpio.LOW , gpio.LOW ],
    [gpio.LOW , gpio.HIGH, gpio.LOW , gpio.LOW ],
    [gpio.LOW , gpio.LOW , gpio.HIGH, gpio.LOW ],
    [gpio.LOW , gpio.LOW , gpio.LOW , gpio.HIGH],
];

const DEBUG_HALF_STEP_SEQUENCE = [
    [gpio.HIGH, gpio.HIGH, gpio.LOW , gpio.LOW , gpio.LOW , gpio.LOW , gpio.LOW , gpio.HIGH]
];

const DEBUG_FULL_STEP_SEQUENCE = [
    [gpio.HIGH, gpio.LOW , gpio.LOW , gpio.LOW ],
];

function Sequencer(pin, sequence) {
    var currentValue;
    this.configure = function(onStarted) {
        gpio.open(pin, gpio.OUTPUT, onStarted);
    };

    this.nextPosition = function(position, callback) {
        var nextValue = sequence[utils.mod(position, sequence.length)];
        if (nextValue === currentValue) {
            callback();
            return;
        }
        gpio.write(pin, nextValue, function() {
            currentValue = nextValue;
            callback();
        });
    };

    return this;
}

function Stepper(pinInput1, pinInput2, pinInput3, pinInput4, sequences, sequencer) {
    assertOneOf(sequences, [FULL_STEP_SEQUENCE, HALF_STEP_SEQUENCE, DEBUG_HALF_STEP_SEQUENCE, DEBUG_FULL_STEP_SEQUENCE], "sequencers must be one of half step or full step");
    const pins = [pinInput1, pinInput2, pinInput3, pinInput4];
    const sequencers = sequences.map(function(sequence, id) {
        if (sequencer) {
            return new sequencer(pins[id], sequence);
        }
        return new Sequencer(pins[id], sequence);
    });
    var targetPosition = 0;
    var actualPosition = 0;
    var queue = new Queue();

    start();

    function start() {
        queue.push(sequencers.map(function(sequencer) {
            return sequencer.configure.bind(this);
        }), function(err) {
            if (err) {
                throw new Error(err);
            }
        });
    }

    function step(newPosition, callback) {
        targetPosition = newPosition;
        queue.push(sequencers.map(function(sequencer) {
            return sequencer.nextPosition.bind(this, newPosition);
        }), function(err) {
            if (err) {
                queue.cancel(function () {
                    callback(err);
                });
                return;
            }
            actualPosition = newPosition;
            callback(null, newPosition);
        });
    }

    this.reset = function(callback) {
        queue.cancel(function(err) {
            targetPosition = 0;
            actualPosition = 0;
            callback(err, actualPosition);
        });
    };

    this.log = function(msg, pad) {
        if (pad) {
            pad(msg);
        }
        else {
            console.log("Stepper: " + msg);
        }
    };

    this.getStatus = function(pad) {
        this.log("Moved " + this.getPosition() + " steps", pad);
    };

    this.cancel = function(callback) {
        queue.cancel(function(err) {
            callback(err, actualPosition);
        });
    };

    this.stepForward = function(callback) {
        step(targetPosition + 1, callback);
    };

    this.stepBackward = function(callback) {
        step(targetPosition - 1, callback);
    };

    this.getPosition = function() {
        return actualPosition;
    };

    this.halfStep = sequences === HALF_STEP_SEQUENCE;

    return this;
}

Stepper.HALF_STEP_SEQUENCE = HALF_STEP_SEQUENCE;
Stepper.FULL_STEP_SEQUENCE = FULL_STEP_SEQUENCE;
Stepper.DEBUG_HALF_STEP_SEQUENCE = DEBUG_HALF_STEP_SEQUENCE;
Stepper.DEBUG_FULL_STEP_SEQUENCE = DEBUG_FULL_STEP_SEQUENCE;

module.exports = Stepper;

