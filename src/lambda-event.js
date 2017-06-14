'use strict';

let _ = require('lodash'),
    Ajv = require('ajv'),
    HttpError = require('./http-error.js'),
    Locale = require('locale');

let API_GATEWAY_URL_REGEXP = /\.execute-api\..*\.amazonaws\.com$/;

class LambdaEvent {

    constructor () {
        /**
         * This is an utility library that handles events coming from Lambda Integration Proxy and converts them to
         * standardized node objects. event format is documented here:
         * http://docs.aws.amazon.com/apigateway/latest/developerguide/
         *              api-gateway-set-up-simple-proxy.html#api-gateway-simple-proxy-for-lambda-input-format
         * @class LambdaHandlerUtils
         * @returns {*}
         */

        this.Errors = {
            BODY_IS_NULL: 'Missing object in event body',
            BODY_NOT_JSON: 'Expected application/json body',
            JSON_IS_UNPARSABLE: 'JSON parsing returned error ',
            JSON_IS_INVALID: 'Resource does not conform to validation schema ',
            PRINCIPAL_INVALID: 'Principal is invalid',
            PRINCIPAL_NOT_STRING: 'Principal is not a string',
            PRINCIPAL_MISSING: 'Principal is missing',
            PRINCIPAL_SCHEMA_MISSING: 'Principal schema is not provided',
            UUID_NOT_STRING: 'UUID is not a string',
            UUID_MISSING: 'UUID is missing',
            UUID_NOT_MATCH: 'UUID does not match format',
            LOCALE_FORMAT: 'locale param in query string is not in the locale format',
            ACCEPT_HEADER_FORMAT: 'Accept-Language header is not in the locale format'

        };

    }

    /**
     * <h1>Extract Resource from Event</h1>
     * Extracts event body and validates it against a JSON schema.
     * If there is no body, `event.body` is `null`. In this case we send 400.
     * Otherwise `event.body` is a string.
     * If there is no `Content-Type` header, we assume it to be `application/json`.
     * If the content type is not application/json, we send 415.
     * Otherwise we try to parse it as a JSON string. If the parsing fails, we send 400.
     * Otherwise if the object fails schema validation, we send 422.
     * @param event The event object coming from invocation, passed to a Lambda function
     * @param schema Domain specific validation schema for this body
     */
    extractResourceFromEvent (event, schema) {
        if (_.isNil(event.body)) {
            throw new HttpError(HttpError.statusCodes.BAD_REQUEST, this.Errors.BODY_IS_NULL);
        }
        let contentType = event.headers[ 'Content-Type' ];
        if (contentType === undefined || !contentType.match(/^application\/json/)) {
            throw new HttpError(HttpError.statusCodes.UNSUPPORTED_MEDIA_TYPE);
        }
        let resource = this.parseJSON(event.body, HttpError.statusCodes.BAD_REQUEST);
        this.validateJSON(resource, schema);
        return resource;
    }

    /**
     * Parse JSON into an object and performs a formal validation, checking if syntax is correct
     * @param string
     * @param errorStatusCode
     */
    parseJSON (string, errorStatusCode) {
        try {
            return JSON.parse(string);
        } catch
            (error) {
            throw new HttpError(errorStatusCode, this.Errors.JSON_IS_UNPARSABLE + error.message);
        }
    }


    /**
     * Validate Resource JSON against a schema
     * @param object Object to be validated
     * @param schema JSON schema to be used for validation
     */
    validateJSON (object, schema) {
        let ajv = new Ajv({ allErrors: true });
        if (ajv.validate(schema, object)) {
            return;
        }
        let validationErrors = ajv.errors.map(function (error) {
            return { message: error.message, path: error.dataPath };
        });

        let validationError = new HttpError(
            HttpError.statusCodes.UNPROCESSABLE_ENTITY,
            this.Errors.JSON_IS_INVALID + JSON.stringify(schema)
        );
        validationError.causes = validationErrors;
        throw validationError;
    }


    /**
     * Parse a string date with format YYYY-MM-DDThh:mm:ss into a js object, otherwhise returns the object untouched
     * @param value Date in string format
     * @returns {Date|*}
     */
    deserializeDate (value) {
        if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
            return new Date(value);
        } else {
            return value;
        }
    }


    /**
     * Converts every serialized date into a Date object. Ignores strings not matching format YYYY-MM-DDThh:mm:ss
     * @param entity The Object to be mangled
     */
    mangleEntityDates (entity) {
        for (let key in entity) {
            if (entity.hasOwnProperty(key)) {
                let value = entity[ key ];

                let deserializedDate = this.deserializeDate(value);
                if (value !== deserializedDate) {
                    entity[ key ] = deserializedDate;
                }
            }
        }
    }


    /**
     * Receives a date and a modified guard string that express check. Verifies wether last modify date comes after
     * control string
     * @param lastModified Date to be checked
     * @param ifModifiedSinceStr Desired last modify string date
     * @returns {boolean}
     */
    wasModifiedSince (lastModified, ifModifiedSinceStr) {
        if (ifModifiedSinceStr === undefined) {
            return true;
        }
        let ifModifiedSince = new Date(ifModifiedSinceStr);
        if (isNaN(ifModifiedSince)) {
            throw new HttpError(HttpError.statusCodes.BAD_REQUEST, 'Invalid If-Modified-Since header: ' +
                '"' + ifModifiedSinceStr + '"');
        }
        lastModified = new Date(1000 * Math.floor(lastModified.getTime() / 1000));
        return lastModified.getTime() > ifModifiedSince.getTime();
    }


// The following extraction of data from the event and the format of the objects
// passed to the callback are based on the `Lambda Proxy integration` of the API Gateway

    getMethodFromEvent (event) {
        return event.httpMethod;
    }


    /**
     * Builds a resource Url from a Lambda Event
     * @param event Event in Lambda Proxy format event
     * @returns {string} Url pointing to this resource
     */
    getResourceUrlFromEvent (event) {
        let protocol = event.headers[ 'X-Forwarded-Proto' ];
        let port = event.headers[ 'X-Forwarded-Port' ];
        if (protocol === 'http' && port === '80' || protocol === 'https' && port === '443') {
            port = '';
        } else {
            port = ':' + port;
        }
        let contextPath = '';
        // add stage as context path when calling API directly:
        if (API_GATEWAY_URL_REGEXP.test(event.headers.Host)) {
            contextPath = '/' + event.requestContext.stage;
        }
        return protocol + '://' + event.headers.Host + port + contextPath + event.path;
    }


    /**
     * Extracts and returns to caller the principal object contained in an event.
     * If there is no authorizer, `event.requestContext.authorizer` is `undefined`. In this case we send 401.
     * Otherwise, if `event.requestContext.authorizer.principalId` is not a string, we send 401.
     * Otherwise we try to parse it as a JSON string. If the parsing fails, we send 401.
     * Otherwise if the object fails schema validation, we send 401.
     * @param event Lambda Proxy integration event
     * @param principalSchema JSON schema representing principal structure
     * @returns {Object} the principal object
     */
    extractPrincipalFromEvent (event, principalSchema) {
        if (principalSchema === undefined) {
            throw new HttpError(HttpError.statusCodes.UNAUTHORIZED, this.Errors.PRINCIPAL_SCHEMA_MISSING);
        }
        if (event.requestContext.authorizer === undefined || !event.requestContext.authorizer.principalId) {
            throw new HttpError(HttpError.statusCodes.UNAUTHORIZED, this.Errors.PRINCIPAL_MISSING);
        }
        let principalId = event.requestContext.authorizer.principalId;
        if (!_.isString(principalId)) {
            throw new HttpError(HttpError.statusCodes.UNAUTHORIZED, this.Errors.PRINCIPAL_NOT_STRING);
        }
        let principal = this.parseJSON(
            principalId, HttpError.statusCodes.UNAUTHORIZED,
            this.Errors.PRINCIPAL_INVALID);
        this.validateJSON(
            principal,
            principalSchema,
            new HttpError(HttpError.statusCodes.UNAUTHORIZED,
                this.Errors.PRINCIPAL_INVALID));
        return principal;
    }


    /**
     * Extracts an unique ID from event
     * If there are no path parameters, `event.pathParameters` is `null`. In this case we send 400.
     * Otherwise, if uuid is not a string, we send 400.
     * @param event Lambda Proxy integration event
     * @returns {util.uuid|{v4}|*|number|uuid}
     */
    extractUUIDFromEvent (event) {
        if (event.pathParameters === null || event.pathParameters.uuid === undefined) {
            throw new HttpError(HttpError.statusCodes.BAD_REQUEST, this.Errors.UUID_MISSING);
        }
        let uuid = event.pathParameters.uuid;
        if (!_.isString(uuid)) {
            throw new HttpError(HttpError.statusCodes.BAD_REQUEST, this.Errors.UUID_NOT_STRING);
        }
        if (!uuid.toLowerCase().match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)) {
            throw new HttpError(HttpError.statusCodes.BAD_REQUEST, this.Errors.UUID_NOT_MATCH);
        }
        return uuid.toLowerCase();
    }


    /**
     * Extracts locale from invocation query string or Accept-Language header
     * @param event
     * @returns {*}
     */
    extractLocaleFromEvent (event) {
        function parseLocaleString (localeString) {
            let locales = new Locale.Locales(localeString);
            for (let i = 0; i < locales.length; i++) {
                if (locales[ i ].language.length !== 2) {
                    return null;
                }
            }
            return locales;
        }

        if (_.isPlainObject(event.queryStringParameters) && _.isString(event.queryStringParameters.locale)) {
            let qLocales = parseLocaleString(event.queryStringParameters.locale);
            if (qLocales === null) {
                throw new HttpError(HttpError.statusCodes.BAD_REQUEST, this.Errors.LOCALE_FORMAT);
            }
            if (qLocales.length > 0) {
                return qLocales;
            }
        } else if (_.isString(event.headers[ 'Accept-Language' ])) {
            let hLocales = parseLocaleString(event.headers[ 'Accept-Language' ]);
            if (hLocales === null) {
                throw new HttpError(HttpError.statusCodes.BAD_REQUEST, this.Errors.ACCEPT_HEADER_FORMAT);
            }
            if (hLocales.length > 0) {
                return hLocales;
            }
        } else {
            return undefined;
        }
    }

    /**
     * Build an url pointing to a resource expressed by event
     * @param event Lambda Proxy integration event
     * @param uuid Unique Id of the resource
     * @returns {string} Resource Url
     */
    resolveResourceUrl (event, uuid) {
        return this.getResourceUrlFromEvent(event) + '/' + uuid;
    }


    /**
     * Build a Lambda Error event as response to Lambda invocation and an error, formatted following LambdaProxy
     * integration response event
     * @param error Error generated by request
     * @param event Lambda input event
     * @param statusCode
     * @param headers
     * @returns {Object}
     */
    buildErrorResponseEvent (event, error, statusCode = 500, headers) {
        if (!(error instanceof HttpError)) {
            error = HttpError.wrapError(error);
        }
        error.method = this.getMethodFromEvent(event);
        error.resource = this.getResourceUrlFromEvent(event);
        return this.buildResponseEvent(event, error, statusCode, headers);
    }


    /**
     * Build Lambda Response event from a result
     * @param result {*} Something the function wants to send back to the caller
     * @param event Lambda input event
     * @param statusCode {Number} The HTTPStatus Code of this answer. Defaults to 200
     * @param headers {Object.<string,string>} A map containing the stringss to be used as header
     * @returns {Object}
     */
    buildSuccessResponseEvent (event, result, statusCode = 200, headers) {
        return this.buildResponseEvent(event, result, statusCode, headers);
    }


    buildResponseEvent (inputEvent, body, statusCode, headers) {
        let response = {
            statusCode: statusCode,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(body)
        };
        if (headers !== null) {
            _.assign(response.headers, headers);
        }
        return response;
    }
}

const LambdaEventWrapper = function () {
    return new LambdaEvent();
};

module.exports = LambdaEventWrapper;
