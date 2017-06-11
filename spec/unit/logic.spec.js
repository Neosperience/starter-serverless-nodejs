'use strict';

const helper = require('../helper');

describe('Logic.js', () => {
    const Logic = require('../../src/logic');
    let sut;

    beforeEach(() => {
        const logger = helper.getLoggerMock();
        sut = new Logic(logger);
    });

    it('is defined', () => {
        expect(sut).toBeDefined();
    });
});
