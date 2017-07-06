'use strict';

var _ = require('lodash'),
    fs = require('fs');

function loadState (fileName) {
    return JSON.parse(fs.readFileSync(fileName, 'utf-8'));
}

function saveState (template, fileName) {
    fs.writeFileSync(fileName, JSON.stringify(template, null, 2), 'utf-8');
}

function pickFromTree (node, filter, getValue) {
    if (!(_.isArray(node) || _.isPlainObject(node))) {
        return [];
    }
    return _.reduce(node, function (accumulator, child, key, parent) {
        if (filter(child, key, parent)) {
            accumulator.push(getValue === undefined ? child : getValue(child, key, parent));
            return accumulator;
        } else {
            return accumulator.concat(pickFromTree(child, filter, getValue));
        }
    }, []);
}

function getDeploymentName (state) {
    var findDeployment = function (child) {
        return _.isPlainObject(child) && child.Type === ('AWS::ApiGateway::Deployment');
    };
    var getName = function (child, key) {
        return key;
    };
    return pickFromTree(state, findDeployment, getName)[0];
}

function addDependencyOnDeployment (state, deploymentName) {
    var findBasePathMapping = function (child) {
        return _.isPlainObject(child) && child.Type === 'AWS::ApiGateway::BasePathMapping';
    };
    var basePathMapping = pickFromTree(state, findBasePathMapping)[0];
    basePathMapping.DependsOn = [deploymentName];
}

var fileName = './.serverless/serverless-state.json';
var state = loadState(fileName);
var deploymentName = getDeploymentName(state);
addDependencyOnDeployment(state, deploymentName);
saveState(state, fileName);
