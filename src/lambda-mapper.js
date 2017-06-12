'use strict';

const Promise = require('bluebird');

/**
 * Uncomment this to provide principal schema checking
 * const principalSchema = require('../resources/json-schemas/principal.json');
 */

const LambdaMapper = function (logger, logic, lambdaEvent) {

    this.sayHello = function (event) {
        logger.verbose('LambdaMapper/sayHelllo');
        return Promise.try(function () {
            /**
             * uncomment this if you want to use a Neosperience custom authorizer,
             * that should be specified in serverless.yml
             * var principal = lambdaEvent.extractPrincipalFromEvent(event,principalSchema);
             **/
            return logic.sayHello();
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
