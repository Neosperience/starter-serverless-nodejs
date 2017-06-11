'use strict';

const Promise = require('bluebird');

let logger;

class Logic {

    constructor (injectedLogger) { // logger param is passed into constructor and set to variable
        logger = injectedLogger;
    }

    sayHello () { // example function required by logic
        logger.verbose('Logic/sayHello'); // injected object is called
        return Promise.try(function () { // always wrap into a Promise.try to handle errors
            return 'Hello World';
        });
    }

}

Logic.$inject = ['logger'];

module.exports = function (logger) {
    return new Logic(logger);
};
