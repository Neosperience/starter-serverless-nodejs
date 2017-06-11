'use strict';

var _ = require('lodash'),
    Ajv = require('ajv'),
    fs = require('fs'),
    nconf = require('nconf'),
    path = require('path'),
    schema = require('./schema.json');

nconf.env();
var env = !_.isNil(nconf.get('ENV')) ? '.' + nconf.get('ENV') : '';
var configFile = path.join(__dirname, 'config' + env + '.json');
fs.accessSync(configFile, fs.R_OK);
nconf.use('config', { type: 'file', file: configFile });

module.exports = nconf.get();

var ajv = new Ajv();
if (!ajv.validate(schema, module.exports)) {
    throw 'Invalid configuration:\n' + JSON.stringify(ajv.errors, null, 4);
}
