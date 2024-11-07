var gpio = require("./gpionew");
var utils = require("./utils");
var Stepper = require("./Stepper");

const HALF_STEP_SEQUENCE = [
  [
    gpio.HIGH,
    gpio.HIGH,
    gpio.LOW,
    gpio.LOW,
    gpio.LOW,
    gpio.LOW,
    gpio.LOW,
    gpio.HIGH,
  ],
  [
    gpio.LOW,
    gpio.HIGH,
    gpio.HIGH,
    gpio.HIGH,
    gpio.LOW,
    gpio.LOW,
    gpio.LOW,
    gpio.LOW,
  ],
  [
    gpio.LOW,
    gpio.LOW,
    gpio.LOW,
    gpio.HIGH,
    gpio.HIGH,
    gpio.HIGH,
    gpio.LOW,
    gpio.LOW,
  ],
  [
    gpio.LOW,
    gpio.LOW,
    gpio.LOW,
    gpio.LOW,
    gpio.LOW,
    gpio.HIGH,
    gpio.HIGH,
    gpio.HIGH,
  ],
];

const FULL_STEP_SEQUENCE = [
  [gpio.HIGH, gpio.LOW, gpio.LOW, gpio.LOW],
  [gpio.LOW, gpio.HIGH, gpio.LOW, gpio.LOW],
  [gpio.LOW, gpio.LOW, gpio.HIGH, gpio.LOW],
  [gpio.LOW, gpio.LOW, gpio.LOW, gpio.HIGH],
];

function SequencerOld(pin, sequence) {
  this.configure = function (onStarted) {
    gpio.open(pin, gpio.OUTPUT, onStarted);
  };

  this.nextPosition = function (position, callback) {
    gpio.write(pin, sequence[utils.mod(position, sequence.length)], callback);
  };

  return this;
}

function Sequencer(pin, sequence) {
  var currentValue;
  this.configure = function (onStarted) {
    gpio.open(pin, gpio.OUTPUT, onStarted);
  };

  this.nextPosition = function (position, callback) {
    var nextValue = sequence[utils.mod(position, sequence.length)];
    if (nextValue === currentValue) {
      callback();
      return;
    }
    gpio.write(pin, nextValue, function () {
      currentValue = nextValue;
      callback();
    });
  };

  return this;
}

function moveTo(targetPosition, seq, prefix, callback) {
  var started = Date.now();
  var position = 0;
  moveNext();
  function moveNext(err) {
    // console.log(position);
    if (err) {
      console.log(err);
      return;
    }
    if (targetPosition === position) {
      var timeTaken = Date.now() - started;
      console.log(
        prefix +
          " Finished " +
          targetPosition +
          " writes in " +
          timeTaken +
          "ms, " +
          timeTaken / targetPosition +
          "ms per write"
      );
      callback();
      return;
    }
    position += 1;
    // console.log(position);
    seq.nextPosition(position, moveNext);
  }
}

function stepperMoveTo(stepper, targetPosition, prefix, callback) {
  var started = Date.now();
  moveNext();
  function moveNext(err) {
    if (err) {
      console.log(err);
      return;
    }
    if (stepper.getPosition() === targetPosition) {
      var timeTaken = Date.now() - started;
      console.log(
        prefix +
          " Finished " +
          targetPosition +
          " writes in " +
          timeTaken +
          "ms, " +
          timeTaken / targetPosition +
          "ms per write"
      );
      callback();
      return;
    }
    // console.log(position);
    stepper.stepForward(moveNext);
  }
}

function performanceAll(steps) {
  function performance(
    prefix,
    singlePinSequence,
    singlePinStepperSequence,
    allPinsStepperSequence,
    callback
  ) {
    var sequencer = new SequencerOld(6, singlePinSequence);
    var sequencerNew = new Sequencer(6, singlePinSequence);
    var stepperHalf = new Stepper(
      6,
      null,
      null,
      null,
      singlePinStepperSequence,
      SequencerOld
    );
    var stepperHalfNew = new Stepper(
      6,
      null,
      null,
      null,
      singlePinStepperSequence,
      Sequencer
    );
    var stepperAllHalf = new Stepper(
      6,
      13,
      19,
      26,
      allPinsStepperSequence,
      SequencerOld
    );
    var stepperAllHalfNew = new Stepper(
      6,
      13,
      19,
      26,
      allPinsStepperSequence,
      Sequencer
    );

    function pad(str) {
      var target = "                                ";
      if (str.length < target.length) {
        return str + target.slice(str.length);
      }
      return str;
    }

    sequencer.configure(function (err) {
      if (err) {
        console.log(err);
        return;
      }

      moveTo(steps, sequencer, prefix + pad("Sequencer: "), function () {
        moveTo(
          steps,
          sequencerNew,
          prefix + pad("Sequencer New: "),
          function () {
            console.log("");
            stepperMoveTo(
              stepperHalf,
              steps,
              prefix + pad("Stepper Single: "),
              function () {
                stepperMoveTo(
                  stepperHalfNew,
                  steps,
                  prefix + pad("Stepper Single New: "),
                  function () {
                    console.log("");
                    stepperMoveTo(
                      stepperAllHalf,
                      steps,
                      prefix + pad("Stepper All: "),
                      function () {
                        stepperMoveTo(
                          stepperAllHalfNew,
                          steps,
                          prefix + pad("Stepper All New: "),
                          function () {
                            console.log("\n");
                            callback();
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          }
        );
      });
    });
  }

  performance(
    "Half step: ",
    HALF_STEP_SEQUENCE[0],
    Stepper.DEBUG_HALF_STEP_SEQUENCE,
    Stepper.HALF_STEP_SEQUENCE,
    function () {
      performance(
        "Full step: ",
        FULL_STEP_SEQUENCE[0],
        Stepper.DEBUG_FULL_STEP_SEQUENCE,
        Stepper.FULL_STEP_SEQUENCE,
        function () {
          console.log("Finished all");
        }
      );
    }
  );
}

if (utils.find("mock", process.argv)) {
  gpio.mock();
}

if (utils.find("debug", process.argv)) {
  gpio.debug();
}

performanceAll(1e4);
