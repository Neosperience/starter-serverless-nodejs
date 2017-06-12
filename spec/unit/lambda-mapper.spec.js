'use strict';

describe('LambdaMapper', function () {

    const LambdaMapper = require('../../src/lambda-mapper');

    describe('is istantiable', function () {
        let mockLogger = require('../helper').getLoggerMock();
        let logic, utils;
        beforeEach(function () {
            logic = {
                updateUserLocation: function () {
                }
            };
            utils = {
                extractResourceFromEvent: function () {

                },
                extractPrincipalFromEvent: function () {
                }
            };
        });

        it('with a logger, logic and utils', function () {
            let sut = new LambdaMapper(mockLogger, logic, utils);
            expect(sut).toBeDefined();
        });

    });

});
