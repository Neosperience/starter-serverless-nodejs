# Serverless NodeJS Starter project
This project is intended to make you as fast as possible starting a new  service project using the following technologies

* NodeJS 6.10
* Lodash 4.17.4
* Bluebird 3.5.0
* Winston 2.3.1
* Jasmine 2.6.0
* Istanbul 0.4.5
* Intravenous 0.1.4-beta
* Ajv 5.0.0 (with schema draft 0.6, 0.4 not supported anymore)
* Serverless 1.15.2

## Getting started
To start a new service project, you don't need the full repository history, just make an archive of this repo

```bash
git archive -o my-starter-project.zip --remote https://path/to/this/repo
```

Now you must **cd** into the folder and run

```bash
git init
```

Then edit **package.json** setting appropriate values for

* name
* displayName
* contributors
* repository
* bugs
* homepage

Once you've finished wit package.json, edit also this **README.md** file

Finally run

```bash
npm install
```
> **NOTE**: you could experience some NPM error when running _npm install_. This is probably related to a mismatch between _package-lock.json_ file and your npm version. If this occur, just delete _package-lock.json_ and run ```npm install``` again.

Now everything is set up, you can create your repo first commit:

```bash
git add .
git commit -m "Initial project setup"
```

If you wish, you could also set a remote destination with

```bash
git remote add origin https://path/to/remote/repo.git
git push --all
```
Now you're done and can start adding your project' specific code.

And, of course, you can deploy this service with
```bash
serverless deploy --region <YOUR_REGION> --stage <YOUR_STAGE>
```

## About Lambda Event mappings
This starter project comes with the assumption every service will be handled through Serverless and LambdaProxy is the preferred way of mapping services. To this reason, we provided a set of classes:

* lambda-event.js
* HTTPError
* lambda-mapper.js
* resources/json-schemas/principal.schema.json

### lambda-event.js
LambdaEvent is an utility class that provides a set of functions to extract and validate data coming from a [LambdaProxy Input](http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-set-up-simple-proxy.html#api-gateway-simple-proxy-for-lambda-input-format) integration. it allow to abstract away all the structure of the event and request only semantic objects for resources, uuids, principals and so on. 
LambdaEvent supports also response packaging into a [LambdaProxy Output](http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-set-up-simple-proxy.html#api-gateway-simple-proxy-for-lambda-output-format) Event either as error or as a result.

#### Principals
> This is an important note about Neosperience usage of principals. Read this before using LamdbaEvent functions, to fully understand their meaning.
> For your convenience, check on principal has been disabled in lamdba-mapper.js

AWS does not imply any particular structure for event principals. It just defines them as provided back from a lambda authorizer
Regarding principals, at Neosperience, we make the assumption it is **always** a JSON. Using a JSON instead of a play string has many advantages, such as out-of-the-box format validation and semantic validation through [JSON-Schema](https://jsonschema.net). 

Whenever a principal is extracted from event using LambdaEvent methods, it is required to pass a JSON containing JSONSchema for this principal and validation is performad before extraction.
LamdbaEvent utility class does not require any particular schema, but _lambda-mapper.js_ uses the standard Neosperience Principal schema to validate request.

#### Entities
LamdbaEvent provides support for entity extraction from Lambda event and their validation using a custom schema
