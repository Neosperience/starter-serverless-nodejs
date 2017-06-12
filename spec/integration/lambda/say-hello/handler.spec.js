'use strict';

const Handler = require('../../../../src/lambda/say-hello/handler.js');

describe('Lambda/sayHello [Integration]', function () {
    let context,
        sut;

    beforeEach(function () {
        context = {};
        sut = Handler.handler;
    });

    describe('Handler()', function () {
        it('should return 401 for a missing principal', function () {

            var event = {
                body: null,
                httpMethod: 'GET',
                headers: {
                    'X-Forwarded-Proto': 'http',
                    'X-Forwarded-Port': '80',
                    Host: 'localhost'
                },
                path: '/say/hello',
                pathParameters: {},
                requestContext: {}
            };
            return sut(event, context, function (err, result) {
                expect(result.statusCode).toBe(401);
                expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
            });
        });

        it('should return 200 with a message', function () {
            var event = {
                body: null,
                httpMethod: 'GET',
                headers: {
                    'X-Forwarded-Proto': 'http',
                    'X-Forwarded-Port': '80',
                    Host: 'localhost'
                },
                path: '/say/hello',
                pathParameters: {},
                requestContext: {
                    authorizer: {
                        principalId: '{ "organizationId": "owner1" }'
                    }
                }
            };
            return sut(event, context, function (err, result) {                
                expect(result.statusCode).toBe(200);
                expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
                expect(result.body).toBeDefined();
            });
        });
    });
});
