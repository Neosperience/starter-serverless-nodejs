'use strict';

const _ = require('lodash'),
    LambdaEvent = require('../../src/lambda-event');

describe('LambdaEvent.js', function () {

    let sut;
    beforeEach(function () {
        sut = new LambdaEvent();
    });

    describe('extractResourceFromEvent', function () {
        const resourceSchema = require('./fixtures/testSchema.json');
        const resource = { message: 'a resource' };
        const event = {
            body: JSON.stringify(resource),
            headers: { 'Content-Type': 'application/json' }
        };
        beforeEach(function () {
            spyOn(sut, 'parseJSON').and.returnValue(resource);
            spyOn(sut, 'validateJSON').and.returnValue(true);
        });
        describe('throws an error', function () {
            it('if event is undefined', function () {
                expect(function () {
                    sut.extractResourceFromEvent(undefined, resourceSchema);
                }).toThrow();
            });
            it('if event does not have a body', function () {
                expect(function () {
                    let badEvent = _.cloneDeep(event);
                    delete badEvent.body;
                    sut.extractResourceFromEvent(badEvent, resourceSchema);
                }).toThrow();
            });
            it('if event has a null body', function () {
                expect(function () {
                    let badEvent = _.cloneDeep(event);
                    badEvent.body = null;
                    sut.extractResourceFromEvent(badEvent, resourceSchema);
                }).toThrow();
            });

            it('if event does not have a content type header', function () {
                expect(function () {
                    let badEvent = _.cloneDeep(event);
                    delete badEvent.headers[ 'Content-Type' ];
                    sut.extractResourceFromEvent(badEvent, resourceSchema);
                }).toThrow();
            });
            it('if event does content type is not application/json', function () {
                expect(function () {
                    let badEvent = _.cloneDeep(event);
                    badEvent.headers[ 'Content-Type' ] = 'application/xml';
                    sut.extractResourceFromEvent(badEvent, resourceSchema);
                }).toThrow();
            });

        });
        describe('returns a resource', function () {
            it('parsed from event', function () {
                let resource = sut.extractResourceFromEvent(event, resourceSchema);
                expect(sut.parseJSON).toHaveBeenCalled();
                expect(sut.validateJSON).toHaveBeenCalled();
                expect(resource).toBeDefined();
            });
        });
    });

    describe('extractPrincipalFromEvent', function () {
        const principalEvent = { organizationId: 'A52ECB9A-B6E4-40EE-BC0C-5B3B653A9161' };
        const principalSerialized = JSON.stringify(principalEvent);
        const principalSchema = require('../../resources/json-schemas/principal.json');
        const event = {
            requestContext: {
                authorizer: {
                    principalId: principalSerialized
                }
            }
        };

        beforeEach(function () {
            spyOn(sut, 'parseJSON').and.returnValue(principalEvent);
            spyOn(sut, 'validateJSON').and.returnValue(true);
        });

        describe('throws an error', function () {
            it('if principal schema is not defined', function () {
                expect(function () {
                    sut.extractPrincipalFromEvent(event, undefined);
                }).toThrow();
            });
            it('if principal string is not defined', function () {
                expect(function () {
                    sut.extractPrincipalFromEvent(undefined, principalSchema);
                }).toThrow();
            });
            it('if principal event is defined but authorizer is not', function () {
                expect(function () {
                    let badEvent = _.cloneDeep(event);
                    delete badEvent.requestContext.authorizer;
                    sut.extractPrincipalFromEvent(badEvent, principalSchema);
                }).toThrow();
            });
            it('if principal event is defined but authorizer does not have a principalId', function () {
                expect(function () {
                    let badEvent = _.cloneDeep(event);
                    delete badEvent.requestContext.authorizer.principalId;
                    sut.extractPrincipalFromEvent(badEvent, principalSchema);
                }).toThrow();
            });
            it('if event.requestContext.authorizer.principalId is not a string', function () {
                expect(function () {
                    let badEvent = _.cloneDeep(event);
                    badEvent.requestContext.authorizer.principalId = 42;
                    sut.extractPrincipalFromEvent(badEvent, principalSchema);
                }).toThrow();
            });

        });

        describe('returns a principal', function () {
            it('if authorizer is properly set up  and a schema is provided', function () {
                let principal = sut.extractPrincipalFromEvent(event, principalSchema);
                expect(principal).toBeDefined();
                expect(principal.organizationId).toBeDefined();
            });
        });
    });

    describe('parseJSON', function () {
        it('parses a valid JSON into an object', function () {
            let event = { name: 'Test Me' };
            let jsonString = JSON.stringify(event);
            let resource = sut.parseJSON(jsonString, 500);
            expect(resource).toBeDefined();
            expect(resource).toEqual(event);
        });

        it('throws an error if JSON is not valid', function () {
            let badJson = 'this is a bad json';
            expect(function () {
                sut.parseJSON(badJson);
            }).toThrow();
        });
    });

    describe('validateJSON', function () {
        const schema = require('./fixtures/testSchema.json');

        it('returns gracefully if object is valid for a given schema', function () {
            expect(function () {
                sut.validateJSON({ firstName: 'John', lastName: 'Doe' }, schema);
            }).not.toThrow();
        });

        it('throws an error if object is not valid', function () {
            expect(function () {
                sut.validateJSON({ firstName: 'John' }, schema);
            }).toThrow();
        });
    });

    describe('deserializedDate', function () {
        it('converts a date string in format YYYY-MM-DDThh:mm:ss into a date object', function () {
            let dateString = '2017-12-21T12:32:12';
            let val = sut.deserializeDate(dateString);

            let date = new Date(dateString);
            expect(typeof val).toBe('object');
            expect(val).toEqual(date);
        });
        it('does nothing i attribute is not in the given format', function () {
            let dateString = {
                testDate: 'not a date'
            };
            let date = JSON.parse(JSON.stringify(dateString)).testDate;
            let val = sut.deserializeDate(date);
            expect(val).toEqual(dateString.testDate);
        });
    });

    describe('mangleEntityDates', function () {
        let entity = {
            firstName: 'John',
            lastName: 'Doe',
            created: '2016-12-21T12:32:12',
            lastUpdated: '2017-12-21T12:32:12'
        };

        it('converts every date string attribute with format YYYY-MM-DDThh:mm:ss into a date object', function () {
            let entityCopy = _.cloneDeep(entity);
            sut.mangleEntityDates(entityCopy);
            expect(entityCopy.created).toEqual(new Date(entity.created));
            expect(entityCopy.lastUpdated).toEqual(new Date(entity.lastUpdated));
        });
        it('does nothing if attribute is not in the given format', function () {
            let entityCopy = _.cloneDeep(entity);
            sut.mangleEntityDates(entityCopy);
            expect(entityCopy.firstName).toEqual(entity.firstName);
            expect(entityCopy.lastName).toEqual(entity.lastName);
        });
    });

    describe('wasModifiedSince', function () {
        describe('checks a date and a modification string', function () {
            it('returns an error if modification string is not a serialized date', function () {
                let d = new Date();
                expect(function () {
                    sut.wasModifiedSince(d, 'Not a Date');
                }).toThrow();
            });
            it('returns true if date is older than modification string', function () {
                let date = new Date('2017-12-21T12:32:12');
                let modifiedDate = '2016-12-21T12:32:12';
                expect(sut.wasModifiedSince(date, modifiedDate)).toBeTruthy();
            });
            it('returns true if modification date is not defined', function () {
                let date = new Date('2017-12-21T12:32:12');
                expect(sut.wasModifiedSince(date, undefined)).toBeTruthy();
            });
            it('returns false if date is newer than modification string', function () {
                let date = new Date('2016-12-21T12:32:12');
                let modifiedDate = '2017-12-21T12:32:12';
                expect(sut.wasModifiedSince(date, modifiedDate)).not.toBeTruthy();
            });
        });
    });

    describe('getMethodFromEvent', function () {
        it('returns the name of HTTP method of an event', function () {
            let event = { httpMethod: 'GET' };
            expect(sut.getMethodFromEvent(event)).toEqual('GET');
        });
    });

    describe('getResourceUrlFromEvent', function () {
        let masterEvent = {
            headers: {
                'X-Forwarded-Proto': 'http',
                'Host': 'testHost'
            },
            requestContext: {
                stage: 'unit-test'
            },
            path: '/path/to/my/resource'

        };

        describe('retrieves resource location from event ', function () {
            it('with an http standard port)', function () {
                let event = _.cloneDeep(masterEvent);
                event.headers[ 'X-Forwarded-Port' ] = '80';
                let control = event.headers[ 'X-Forwarded-Proto' ] + '://' + event.headers.Host + event.path;
                expect(sut.getResourceUrlFromEvent(event)).toEqual(control);
            });
            it('with an https standard port', function () {
                let event = _.cloneDeep(masterEvent);
                event.headers[ 'X-Forwarded-Proto' ] = 'https';
                event.headers[ 'X-Forwarded-Port' ] = '443';
                let control = event.headers[ 'X-Forwarded-Proto' ] + '://' + event.headers.Host + event.path;
                expect(sut.getResourceUrlFromEvent(event)).toEqual(control);
            });

            it('with a custom HTTP port', function () {
                let event = _.cloneDeep(masterEvent);
                event.headers[ 'X-Forwarded-Port' ] = '3240';
                let control = event.headers[ 'X-Forwarded-Proto' ] + '://' + event.headers.Host + ':3240' + event.path;
                expect(sut.getResourceUrlFromEvent(event)).toEqual(control);
            });
        });

    });


    describe('extractUUIDFromEvent', function () {
        describe('given a serialized UUID as JSON', function () {
            describe('throws an error', function () {
                it('if UUID is undefined', function () {
                    expect(function () {
                        sut.extractUUIDFromEvent({ pathParameters: { uuid: undefined } });
                    }).toThrow();
                });

                it('if UUID is not a string', function () {
                    expect(function () {
                        sut.extractUUIDFromEvent({ pathParameters: { uuid: 42 } });
                    }).toThrow();

                });
                it('if UUID does not match schema', function () {
                    expect(function () {
                        sut.extractUUIDFromEvent({ pathParameters: { uuid: '543234' } });
                    }).toThrow();

                });
            });
        });
        describe('returns an UUID lower case string', function () {
            it('when param is an UUID', function () {
                const goodUUID = 'AC7D69C2-66BE-4099-9698-ABA6BA2F1420';
                let result = sut.extractUUIDFromEvent({ pathParameters: { uuid: goodUUID } });
                expect(result).toEqual(goodUUID.toLowerCase());
            });
        });
    });

    describe('extractLocaleFromEvent', function () {
        let goodEvent = {
            queryStringParameters: {
                locale: 'it'
            },
            headers: {
                'Accept-Language': 'en'
            }
        };

        describe('given a serialized UUID as JSON', function () {
            it('returns undefined if locale param and Accept-Language header are undefined', function () {
                let badEvent = _.cloneDeep(goodEvent);
                delete badEvent.queryStringParameters.locale;
                delete badEvent.headers[ 'Accept-Language' ];
                let result = sut.extractLocaleFromEvent(badEvent);
                expect(result).not.toBeDefined();
            });
            describe('throws an error', function () {
                it('if locale param is undefined, Accept-Language header is not a locale format', function () {
                    let badEvent = _.cloneDeep(goodEvent);
                    badEvent.headers[ 'Accept-Language' ] = 'fake';
                    delete badEvent.queryStringParameters.locale;
                    expect(function () {
                        sut.extractLocaleFromEvent(badEvent);
                    }).toThrow();
                });
                it('if locale param is defined but is not a locale format', function () {
                    let badEvent = _.cloneDeep(goodEvent);
                    badEvent.queryStringParameters.locale = 'fake';
                    expect(function () {
                        sut.extractLocaleFromEvent(badEvent);
                    }).toThrow();
                });
            });
        });
        describe('returns a locale string', function () {
            it('from locale param if both locale and Accept-Language header are defined', function () {
                let locales = sut.extractLocaleFromEvent(goodEvent);
                expect(locales).toBeDefined();
                expect(locales[ 0 ].toString()).toEqual(goodEvent.queryStringParameters.locale);
            });
            it('from Accept-Language header if locale is undefined', function () {
                let eventNoParam = _.cloneDeep(goodEvent);
                delete eventNoParam.queryStringParameters.locale;
                let locales = sut.extractLocaleFromEvent(eventNoParam);
                expect(locales).toBeDefined();
                expect(locales[ 0 ].toString()).toEqual(goodEvent.headers[ 'Accept-Language' ]);

            });
        });
    });

    describe('resolveResourceUrl', function () {
        let fakeEvent = {};
        const resolvedBasePath = 'http://resolved/to/path';
        beforeEach(function () {
            spyOn(sut, 'getResourceUrlFromEvent').and.returnValue(resolvedBasePath);
        });
        it('returns a resolved resource URL with resource UUID', function () {
            let uuid = '80A04C5B-8B2C-407D-8060-A9B4150DDFE5';
            expect(sut.resolveResourceUrl(fakeEvent, uuid)).toEqual(resolvedBasePath + '/' + uuid);
        });
    });

    describe('buildErrorResponseEvent', function () {
        const event = { body: 'Event body' };
        const resolvedBasePath = 'http://resolved/to/path';
        const method = 'TEST';

        beforeEach(function () {
            spyOn(sut, 'getMethodFromEvent').and.returnValue(method);
            spyOn(sut, 'getResourceUrlFromEvent').and.returnValue(resolvedBasePath);
            spyOn(sut, 'buildResponseEvent').and.returnValue({ statusCode: 500, body: JSON.stringify(event) });
        });

        describe('returns a response errror event', function () {
            let error = new Error('test error');
            it('with a specific error code', function () {
                let response = sut.buildErrorResponseEvent(event, error, 404);
                expect(sut.buildResponseEvent).toHaveBeenCalled();
                expect(sut.getMethodFromEvent).toHaveBeenCalled();
                expect(sut.getResourceUrlFromEvent).toHaveBeenCalled();
                expect(response).toBeDefined();
                expect(response.statusCode).toBe(500);
                expect(response.body).toBeDefined();
            });
            it('with a default error code', function () {
                let response = sut.buildErrorResponseEvent(event, error);
                expect(sut.buildResponseEvent).toHaveBeenCalled();
                expect(sut.getMethodFromEvent).toHaveBeenCalled();
                expect(sut.getResourceUrlFromEvent).toHaveBeenCalled();
                expect(response).toBeDefined();
                expect(response.statusCode).toBe(500);
                expect(response.body).toBeDefined();
            });
        });
    });

    describe('buildSuccessResponseEvent', function () {
        const event = { body: 'Event body' };
        let result = { message: 'success' };

        beforeEach(function () {
            spyOn(sut, 'buildResponseEvent').and.returnValue({
                statusCode: 200,
                body: JSON.stringify(result)
            });
        });

        describe('returns a response  event', function () {
            it('with a specific error code', function () {
                let response = sut.buildSuccessResponseEvent(event, result, 201);
                expect(sut.buildResponseEvent).toHaveBeenCalled();
                expect(response).toBeDefined();
                expect(response.statusCode).toBe(200);
                expect(response.body).toBeDefined();

            });
            it('with a default error code', function () {
                let response = sut.buildSuccessResponseEvent(event, result);
                expect(sut.buildResponseEvent).toHaveBeenCalled();
                expect(response).toBeDefined();
                expect(response.statusCode).toBe(200);
                expect(response.body).toBeDefined();
            });
        });
    });

    describe('buildResponseEvent', function () {
        const event = { body: 'Event body' };
        let result = { message: 'success' };

        it('returns an event obejct', function () {
            let response = sut.buildResponseEvent(event, result, 300);
            expect(response).toBeDefined();
            expect(response.statusCode).toEqual(300);
            expect(response.body).toEqual(JSON.stringify(result));
        });

    });
});
