'use strict';

var config = require('../config/config.js'),
    intravenous = require('intravenous');

function Container () {
    var container = intravenous.create({
        onDispose: function (obj) {
            obj.dispose();
        }
    });

    container.register('logger', require('./util/logger.js'));
    container.register('logger.config', config.logger);
    container.register('lambda-event', require('./lambda-event'));

    container.register('lambda-mapper', require('./lambda-mapper'));
    container.register('logic', require('./logic.js'));
    return container;
}

module.exports = Container;
