'use strict';

var Logger = require('../../../src/util/logger.js');

describe('util/Logger', function () {
    var sut;

    it('should create a new logger without config', function () {
        sut = new Logger();
        expect(sut.transports).toBeEmptyObject();
        expect(sut).toHaveMethod('silly');
        expect(sut).toHaveMethod('debug');
        expect(sut).toHaveMethod('verbose');
        expect(sut).toHaveMethod('info');
        expect(sut).toHaveMethod('warn');
        expect(sut).toHaveMethod('error');
    });

    it('should create a new logger with config', function () {
        sut = new Logger({
            console: {
                type: 'Console',
                options: {
                    level: 'debug',
                    colorize: true
                }
            }
        });
        expect(sut.transports).toHaveMember('console');
        expect(sut).toHaveMethod('silly');
        expect(sut).toHaveMethod('debug');
        expect(sut).toHaveMethod('verbose');
        expect(sut).toHaveMethod('info');
        expect(sut).toHaveMethod('warn');
        expect(sut).toHaveMethod('error');
    });
});
