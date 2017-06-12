'use strict';

const Promise = require('bluebird');

const Logic = function (logger) {

    this.sayHello = function () { // example function required by logic
        logger.verbose('Logic/sayHello'); // injected object is called
        return Promise.try(function () { // always wrap into a Promise.try to handle errors
            return 'Hello World';
        });
    };

};

Logic.$inject = ['logger'];

module.exports = Logic;
