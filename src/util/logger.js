'use strict';

var winston = require('winston'),
    _ = require('lodash');

function Logger (config) {
    winston.Logger.call(this);
    var self = this;
    _.forEach(config, function (cfg, key) {
        self.add(winston.transports[cfg.type], _.assignIn({ name: key }, cfg.options));
    });
}

Logger.prototype = _.create(winston.Logger.prototype, {
    constructor: Logger
});

Logger.$inject = ['logger.config'];

module.exports = Logger;
