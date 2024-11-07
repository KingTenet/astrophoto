const utils = require("./utils");
const Stepper = require("./Stepper");
const DriveScrew = require("./DriveScrew");
const MotorController = require("./MotorController");
const BarnDoor = require("./BarnDoor");
const Programme = require("./Programme");
const ZeroSwitch = require("./ZeroSwitch");
const GPIO = require("./GPIO");

if (utils.find("mock", process.argv)) {
    GPIO.mock();
}

if (utils.find("debug", process.argv)) {
    GPIO.debug();
}

const MS_PER_MINUTE = 60 * 1000;
const MIN_MOTOR_DELAY = 0;
var minutesExposure = parseInt(process.argv[2]) || 0.5;
console.log("Minutes exposure argv[2]=" + minutesExposure);

const stepper = new Stepper(6, 13, 19, 26, Stepper.HALF_STEP_SEQUENCE);
// var motor = new MotorController(2048, MIN_MOTOR_DELAY, stepper);
var motor = new MotorController(200, MIN_MOTOR_DELAY, stepper);
var driveScrew = new DriveScrew(4, motor);
var zeroSwitch = new ZeroSwitch(17);
var barnDoor = new BarnDoor(150, driveScrew, zeroSwitch);
var programme = new Programme(barnDoor, driveScrew, motor, stepper);

programme.start(minutesExposure * MS_PER_MINUTE);
programme.logStatus(Math.round(minutesExposure * MS_PER_MINUTE / 20));
