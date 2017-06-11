'use strict';

var Config = require('../config/config.js');

module.exports.getLoggerMock = function () {
    var noop = function () {
    };
    return {
        silly: noop,
        debug: noop,
        verbose: noop,
        info: noop,
        warn: noop,
        error: noop
    };
};

module.exports.thenFail = function (data) {
    var formatted = data;
    if (data !== undefined) {
        try {
            formatted = JSON.stringify(data);
        } catch (e) {
            formatted = data;
        }
    }
    fail('Promise rejection expected, instead fulfilled with: ' + formatted);
};

module.exports.getConfig = function () {
    return Config;
};
