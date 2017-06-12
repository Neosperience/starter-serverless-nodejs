'use strict';

var _ = require('lodash');

function NspError (code, message, causes) {
    Error.captureStackTrace(this, NspError);
    code = code || NspError.codes['INTERNAL_SERVER_ERROR'];
    this.code = code;
    this.message = message || NspError.messages[code];
    this.causes = [];
    this.timestamp = new Date();
    if (causes) {
        if (_.isArray(causes)) {
            this.causes = causes;
        } else {
            this.causes.push(causes);
        }
    }
}

NspError.prototype = _.create(Error.prototype, {
    constructor: NspError
});
NspError.prototype.name = 'NspError';

NspError.codes = {
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    UNPROCESSABLE: 'UNPROCESSABLE',
    CONFLICT: 'CONFLICT',
    NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
    INVALID: 'INVALID',
    FORBIDDEN: 'FORBIDDEN'
};

NspError.messages = {
    INTERNAL_SERVER_ERROR: 'Generic error',
    NOT_FOUND: 'Not found',
    UNPROCESSABLE: 'Request well formed but with semantic errors',
    CONFLICT: 'Conflict with the current state of the target resource',
    NOT_IMPLEMENTED: 'Request method not recognized or lacking the ability to fulfill it',
    INVALID: 'Invalid request',
    FORBIDDEN: 'The principal is not authorized to execute this task'
};

module.exports = NspError;
