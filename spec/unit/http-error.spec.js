'use strict';

var HttpError = require('../../src/http-error.js'),
    NspError = require('../../src/nsp-error.js');

describe('HttpError', function () {
    describe('constructor()', function () {
        it('should be a 400 error with a cause', function () {
            var cause = 'Unexpected character: \';\'';
            var e = new HttpError(HttpError.statusCodes.BAD_REQUEST, 'Invalid JSON', cause);
            expect(e).toEqual(jasmine.any(Error));
            expect(e.name).toBe('HttpError');
            expect(e.statusCode).toBe(400);
            expect(e.statusReason).toBe('Bad request');
            expect(e.message).toBe('Invalid JSON');
            expect(e.causes).toEqual([cause]);
            expect(e.toString()).toBe('HttpError: Invalid JSON');
        });
        it('should be a 403 error', function () {
            var e = new HttpError(HttpError.statusCodes.FORBIDDEN, 'You cannot delete a Card');
            expect(e).toEqual(jasmine.any(Error));
            expect(e.name).toBe('HttpError');
            expect(e.statusCode).toBe(403);
            expect(e.statusReason).toBe('Forbidden');
            expect(e.message).toBe('You cannot delete a Card');
            expect(e.causes).toBeEmptyArray();
            expect(e.toString()).toBe('HttpError: You cannot delete a Card');
        });
        it('should be a 404 error', function () {
            var e = new HttpError(HttpError.statusCodes.NOT_FOUND, 'Card not found');
            expect(e).toEqual(jasmine.any(Error));
            expect(e.name).toBe('HttpError');
            expect(e.statusCode).toBe(404);
            expect(e.statusReason).toBe('Not found');
            expect(e.message).toBe('Card not found');
            expect(e.causes).toBeEmptyArray();
            expect(e.toString()).toBe('HttpError: Card not found');
        });
        it('should be a 405 error', function () {
            var e = new HttpError(HttpError.statusCodes.METHOD_NOT_ALLOWED, 'Can\'t delete a Card');
            expect(e).toEqual(jasmine.any(Error));
            expect(e.name).toBe('HttpError');
            expect(e.statusCode).toBe(405);
            expect(e.statusReason).toBe('Method not allowed');
            expect(e.message).toBe('Can\'t delete a Card');
            expect(e.causes).toBeEmptyArray();
            expect(e.toString()).toBe('HttpError: Can\'t delete a Card');
        });
        it('should be a 409 error', function () {
            var e = new HttpError(HttpError.statusCodes.CONFLICT, 'Duplicated UUID');
            expect(e).toEqual(jasmine.any(Error));
            expect(e.name).toBe('HttpError');
            expect(e.statusCode).toBe(409);
            expect(e.statusReason).toBe('Conflict');
            expect(e.message).toBe('Duplicated UUID');
            expect(e.causes).toBeEmptyArray();
            expect(e.toString()).toBe('HttpError: Duplicated UUID');
        });
        it('should be a 415 error', function () {
            var e = new HttpError(HttpError.statusCodes.UNSUPPORTED_MEDIA_TYPE, 'Content-Type must be ' +
                'application/json');
            expect(e).toEqual(jasmine.any(Error));
            expect(e.name).toBe('HttpError');
            expect(e.statusCode).toBe(415);
            expect(e.statusReason).toBe('Unsupported media type');
            expect(e.message).toBe('Content-Type must be application/json');
            expect(e.causes).toBeEmptyArray();
            expect(e.toString()).toBe('HttpError: Content-Type must be application/json');
        });
        it('should be a 422 error with causes', function () {
            var causes = ['owner is read-only', 'uuid required'];
            var e = new HttpError(HttpError.statusCodes.UNPROCESSABLE_ENTITY, 'Validation error', causes);
            expect(e).toEqual(jasmine.any(Error));
            expect(e.name).toBe('HttpError');
            expect(e.statusCode).toBe(422);
            expect(e.statusReason).toBe('Unprocessable entity');
            expect(e.message).toBe('Validation error');
            expect(e.causes).toEqual(causes);
            expect(e.toString()).toBe('HttpError: Validation error');
        });
        it('should be a 500 error', function () {
            var e = new HttpError(HttpError.statusCodes.INTERNAL_SERVER_ERROR, 'Disk full');
            expect(e).toEqual(jasmine.any(Error));
            expect(e.name).toBe('HttpError');
            expect(e.statusCode).toBe(500);
            expect(e.statusReason).toBe('Internal server error');
            expect(e.message).toBe('Disk full');
            expect(e.causes).toBeEmptyArray();
            expect(e.toString()).toBe('HttpError: Disk full');
        });
    });

    describe('wrapError()', function () {
        it('should copy `code`, `timestamp`, `message` and `causes` from passed instance of NspError', function () {
            var nspError = new NspError(NspError.codes.UNPROCESSABLE, undefined, ['error1', 'error2']);
            var httpError = HttpError.wrapError(nspError);
            expect(httpError.code).toEqual(nspError.code);
            expect(httpError.timestamp).toEqual(nspError.timestamp);
            expect(httpError.message).toEqual(nspError.message);
            expect(httpError.causes).toEqual(nspError.causes);
        });
        it('should map `NspError.codes.INTERNAL_SERVER_ERROR` to HTTP status `500 Internal server error`', function () {
            var nspError = new NspError();
            var httpError = HttpError.wrapError(nspError);
            expect(httpError.statusCode).toBe(500);
            expect(httpError.statusReason).toBe('Internal server error');
        });
        it('should map `NspError.codes.FORBIDDEN` to HTTP status `403 Forbidden`', function () {
            var nspError = new NspError(NspError.codes.FORBIDDEN);
            var httpError = HttpError.wrapError(nspError);
            expect(httpError.statusCode).toBe(403);
            expect(httpError.statusReason).toBe('Forbidden');
        });
        it('should map `NspError.codes.NOT_FOUND` to HTTP status `404 Not found`', function () {
            var nspError = new NspError(NspError.codes.NOT_FOUND);
            var httpError = HttpError.wrapError(nspError);
            expect(httpError.statusCode).toBe(404);
            expect(httpError.statusReason).toBe('Not found');
        });
        it('should map `NspError.codes.UNPROCESSABLE` to HTTP status `422 Unprocessable entity`', function () {
            var nspError = new NspError(NspError.codes.UNPROCESSABLE);
            var httpError = HttpError.wrapError(nspError);
            expect(httpError.statusCode).toBe(422);
            expect(httpError.statusReason).toBe('Unprocessable entity');
        });
        it('should map `NspError.codes.CONFLICT` to HTTP status `409 Conflict`', function () {
            var nspError = new NspError(NspError.codes.CONFLICT);
            var httpError = HttpError.wrapError(nspError);
            expect(httpError.statusCode).toBe(409);
            expect(httpError.statusReason).toBe('Conflict');
        });
        it('should map `NspError.codes.NOT_IMPLEMENTED` to HTTP status `405 Method not allowed`', function () {
            var nspError = new NspError(NspError.codes.NOT_IMPLEMENTED);
            var httpError = HttpError.wrapError(nspError);
            expect(httpError.statusCode).toBe(405);
            expect(httpError.statusReason).toBe('Method not allowed');
        });
        it('should map `NspError.codes.INVALID` to HTTP status `400 Bad request`', function () {
            var nspError = new NspError(NspError.codes.INVALID);
            var httpError = HttpError.wrapError(nspError);
            expect(httpError.statusCode).toBe(400);
            expect(httpError.statusReason).toBe('Bad request');
        });
        it('should wrap an Error not instance of NspError like an NspError with code ' +
        '`NspError.codes.INTERNAL_SERVER_ERROR` and message copied from the passed Error', function () {
            var error = new Error('Unexpected');
            var httpError = HttpError.wrapError(error);
            var nspError = new NspError(NspError.codes.INTERNAL_SERVER_ERROR, error.message);
            expect(httpError).toEqual(nspError);
        });
    });
});
