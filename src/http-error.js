'use strict';
var _ = require('lodash'),
    NspError = require('./nsp-error.js');

function HttpError (statusCode, message, causes) {
    this.statusCode = statusCode;
    this.statusReason = HttpError.statusReasons[this.statusCode];
    this.timestamp = new Date();
    this.message = message;
    this.causes = [];
    if (causes) {
        if (_.isArray(causes)) {
            this.causes = causes;
        } else {
            this.causes.push(causes);
        }
    }
}

HttpError.prototype = _.create(Error.prototype, {
    constructor: HttpError
});
HttpError.prototype.name = 'HttpError';

HttpError.statusCodes = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNSUPPORTED_MEDIA_TYPE: 415,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500
};

HttpError.statusReasons = {
    400: 'Bad request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not found',
    405: 'Method not allowed',
    409: 'Conflict',
    415: 'Unsupported media type',
    422: 'Unprocessable entity',
    500: 'Internal server error',
};

var NSP_ERROR_CODES_2_STATUS_CODES = {
};
NSP_ERROR_CODES_2_STATUS_CODES[NspError.codes.INVALID] = HttpError.statusCodes.BAD_REQUEST;
NSP_ERROR_CODES_2_STATUS_CODES[NspError.codes.NOT_FOUND] = HttpError.statusCodes.NOT_FOUND;
NSP_ERROR_CODES_2_STATUS_CODES[NspError.codes.FORBIDDEN] = HttpError.statusCodes.FORBIDDEN;
NSP_ERROR_CODES_2_STATUS_CODES[NspError.codes.CONFLICT] = HttpError.statusCodes.CONFLICT;
NSP_ERROR_CODES_2_STATUS_CODES[NspError.codes.UNPROCESSABLE] = HttpError.statusCodes.UNPROCESSABLE_ENTITY;
NSP_ERROR_CODES_2_STATUS_CODES[NspError.codes.INTERNAL_SERVER_ERROR] = HttpError.statusCodes.INTERNAL_SERVER_ERROR;
NSP_ERROR_CODES_2_STATUS_CODES[NspError.codes.NOT_IMPLEMENTED] = HttpError.statusCodes.METHOD_NOT_ALLOWED;

function mapNspErrorCode (errorCode) {
    return NSP_ERROR_CODES_2_STATUS_CODES[errorCode];
}

HttpError.wrapError = function (error) {
    if (!(error instanceof NspError)) {
        error = new NspError(NspError.codes.INTERNAL_SERVER_ERROR, error.message);
    }
    var httpError = new HttpError(mapNspErrorCode(error.code), error.message, error.causes);
    httpError.code = error.code;
    httpError.timestamp = error.timestamp;
    return httpError;
};

module.exports = HttpError;
