function Queue() {
    var queue = [];
    var processing;
    var cancelCallback;

    function next() {
        if (!processing && queue.length) {
            processing = queue.shift();
            processing.forEach(function(func) {
                func();
            });
        }
    }

    function finished() {
        processing = null;
        handleCancellation();
        next();
    }

    function handleCancellation() {
        if (!processing && cancelCallback) {
            cancelCallback();
            cancelCallback = undefined;
        }
    }

    this.cancel = function(callback) {
        queue = [];
        cancelCallback = callback;
        handleCancellation();
    };

    this.push = function(batch, callback) {
        var returned = 0;
        function collect(err) {
            returned += 1;
            if (err || returned === batch.length) {
                finished();
                callback(err);
            }
        }
        queue.push(batch.map(function(func) {
            return func.bind(null, collect);
        }));
        next();
    };
}

function oneOf() {
    var value = arguments[0];
    var options = arguments[1];
    for (var i = 0; i < options.length; i++) {
        if (value === options[i]) {
            return true
        }
    }
    return false;
}

function assertOneOf() {
    if (oneOf(arguments[0], arguments[1])) {
        return true;
    }
    throw new Error(arguments[2]);
}

/**
 * Self-adjusting interval to account for drifting
 *
 * @param {function} workFunc  Callback containing the work to be done
 *                             for each interval
 * @param {int}      interval  Interval speed (in milliseconds) - This
 * @param {function} errorFunc (Optional) Callback to run if the drift
 *                             exceeds interval
 */
function AdjustingInterval(interval, workFunc, errorFunc) {
    var that = this;
    var expected, timeout;
    this.interval = interval;

    this.start = function() {
        expected = Date.now() + this.interval;
        timeout = setTimeout(step, this.interval);
    };

    this.stop = function() {
        clearTimeout(timeout);
    };

    function step() {
        var drift = Date.now() - expected;
        if (drift > that.interval) {
            if (errorFunc) {
                errorFunc();
            }
        }
        workFunc();
        expected += that.interval;
        timeout = setTimeout(step, Math.max(0, that.interval-drift));
    }
}

function mod(a, b) {
    return ((a % b) + b) % b;
}

function find(a, b) {
    for (var i = 0; i < b.length; i++) {
        if (a === b[i]) {
            return true;
        }
    }
    return false;
}

module.exports.oneOf = oneOf;
module.exports.assertOneOf = assertOneOf;
module.exports.AdjustingInterval = AdjustingInterval;
module.exports.Queue = Queue;
module.exports.mod = mod;
module.exports.find = find;
