'use strict';

const Promise = require('bluebird');
const principalSchema = require('../resources/json-schemas/principal.json');

const LambdaMapper = function (logger, logic, lambdaEvent) {

    this.sayHello = function (event) {
        logger.verbose('LambdaMapper/sayHelllo');
        return Promise.try(function () {
            var principal = lambdaEvent.extractPrincipalFromEvent(event, principalSchema);
            return logic.sayHello(principal);
        })
            .then(function (result) {
                return lambdaEvent.buildSuccessResponseEvent(event, result);
            })
            .catch(function (error) {
                return lambdaEvent.buildErrorResponseEvent(event, error, error.statusCode);
            });
    };

};

LambdaMapper.$inject = ['logger', 'logic', 'lambda-event'];

module.exports = LambdaMapper;
