'use strict';

var NspError = require('../../src/nsp-error.js');

describe('NspError', function () {

    describe('constructor()', function () {
        it('should be an internal server error', function () {
            var e = new NspError();
            expect(e).toEqual(jasmine.any(Error));
            expect(e.name).toBe('NspError');
            expect(e.code).toBe('INTERNAL_SERVER_ERROR');
            expect(e.message).toBe('Generic error');
            expect(e.causes).toBeEmptyArray();
            expect(e.stack).toBeString();
        });

        it('should be an unprocessable error with custom message and causes', function () {
            var e = new NspError(NspError.codes.UNPROCESSABLE, 'message', [ 'cause1', 'cause2' ]);
            expect(e).toEqual(jasmine.any(Error));
            expect(e.name).toBe('NspError');
            expect(e.code).toBe('UNPROCESSABLE');
            expect(e.message).toBe('message');
            expect(e.stack).toBeString();
            expect(e.toString()).toBe('NspError: message');
            expect(e.causes).toEqual([ 'cause1', 'cause2' ]);
        });

        it('should be a forbidden error', function () {
            var e = new NspError(NspError.codes.FORBIDDEN);
            expect(e).toEqual(jasmine.any(Error));
            expect(e.name).toBe('NspError');
            expect(e.code).toBe('FORBIDDEN');
            expect(e.message).toBe('The principal is not authorized to execute this task');
            expect(e.causes).toBeEmptyArray();
            expect(e.stack).toBeString();
            expect(e.toString()).toBe('NspError: The principal is not authorized to execute this task');
        });

        it('should be a not found error', function () {
            var e = new NspError(NspError.codes.NOT_FOUND);
            expect(e).toEqual(jasmine.any(Error));
            expect(e.name).toBe('NspError');
            expect(e.code).toBe('NOT_FOUND');
            expect(e.message).toBe('Not found');
            expect(e.causes).toBeEmptyArray();
            expect(e.stack).toBeString();
            expect(e.toString()).toBe('NspError: Not found');
        });

        it('should be a not implemented error with custom message and a cause', function () {
            var e = new NspError(NspError.codes.NOT_IMPLEMENTED, 'message', 'cause');
            expect(e).toEqual(jasmine.any(Error));
            expect(e.name).toBe('NspError');
            expect(e.code).toBe('NOT_IMPLEMENTED');
            expect(e.message).toBe('message');
            expect(e.stack).toBeString();
            expect(e.toString()).toBe('NspError: message');
            expect(e.causes).toEqual([ 'cause' ]);
        });

        it('should be an invalid error', function () {
            var e = new NspError(NspError.codes.INVALID);
            expect(e).toEqual(jasmine.any(Error));
            expect(e.name).toBe('NspError');
            expect(e.code).toBe('INVALID');
            expect(e.message).toBe('Invalid request');
            expect(e.stack).toBeString();
            expect(e.toString()).toBe('NspError: Invalid request');
        });
    });

});
