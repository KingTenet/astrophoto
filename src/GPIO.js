var fs = require('fs');
var oneOf = require('./utils').oneOf;

var sysFsPath = '/sys/class/gpio/gpio';
var USE_MAPPINGS = false;
var pinMapping = {
    16: 23,
};

var HIGH = "HIGH";
var LOW = "LOW";
var INPUT = "INPUT";
var OUTPUT = "OUTPUT";
var MOCKED = false;
var DEBUG = false;

function mock() {
    MOCKED = true;
}

function debug() {
    DEBUG = true;
}

function printDebug(msg, callback) {
    if (DEBUG) {
        console.log(msg);
    }
    callback.apply(this, Array.prototype.slice.call(arguments, 2));
}

function validate(value) {
    if (!oneOf(value, [HIGH, LOW])) {
        throw new Error("Value must be 'HIGH' or 'LOW'");
    }
}

function validateDirection(direction) {
    if (!oneOf(direction, [INPUT, OUTPUT])) {
        throw new Error("Direction must be 'INPUT' or 'OUTPUT'");
    }
}

function getPin(pin) {
    return USE_MAPPINGS
        ? pinMapping[pin]
        : pin
}

function getPath(pin) {
    return (MOCKED ? "./mock/gpio" : sysFsPath)+ getPin(pin);
}

function getValue(value) {
    if (MOCKED) {
        return value === HIGH ? "1\n" : "0\n";
    }
    return value === HIGH ? "1" : "0";
}

function getSymbol(value) {
    if (MOCKED) {
        return value === "1\n" ? HIGH : LOW;
    }
    return (value === "1" || value === "1\n") ? HIGH : LOW;
}

function read(pinNumber, userCallback) {
    const callback = userCallback || noOp;
    const readPath = getPath(pinNumber) + "/value";
    fs.readFile(
        readPath,
        'utf8',
        printDebug.bind(this, "read from file " + readPath, function(err, value) {
            callback(err, getSymbol(value));
        })
    );
}

function open(pinNumber, direction, userCallback) {
    validateDirection(direction);
    const directionPath = getPath(pinNumber) + '/direction';
    const callback = userCallback || noOp;
    fs.writeFile(
        directionPath,
        direction === INPUT
            ? "in"
            : "out",
        printDebug.bind(this, "wrote direction " + direction + " to " + directionPath, callback)
    );
}

function write(pinNumber, value, userCallback) {
    validate(value);
    const callback = userCallback || noOp;
    const writePath = getPath(pinNumber) + "/value";
    fs.writeFile(
        writePath,
        getValue(value),
        'utf8',
        printDebug.bind(this, "wrote " + value + " to file " + writePath, callback)
    );
}

function noOp() {}

module.exports.mock = mock;
module.exports.debug = debug;
module.exports.read = read;
module.exports.open = open;
module.exports.write = write;
module.exports.noOp = noOp;
module.exports.HIGH = HIGH;
module.exports.LOW = LOW;
module.exports.INPUT = INPUT;
module.exports.OUTPUT = OUTPUT;
