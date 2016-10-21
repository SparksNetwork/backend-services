

## Getting started

**Clone**:
```bash
git clone git@github.com:SparksNetwork/backend-services
```

**Requirements**:
* Apex (apex.run)
* nodejs

```
yarn install
```

## Running tests

```
npm run test
OR
ava **/*test.js
OR
npm run test:watch
OR
ava **/*test.js -w
```

## Structure

* functions

    Each function in functions will be deployed to AWS lambda. If there is a function.json file this will be used to configure the function, otherwise the defaults in project.json are used.
    
    If function.json specifies a stream `{"stream": "commands"}` then the lambda function will be set up to rn on messages of the specified Kinesis stream.
    
* lib/domain

    This location should be used for domain specific functionality, like calculating payment amounts etc.
    
* lib/ExternalFactories

    This location should be used for factory functions that return connections/gateways to external services and APIs
    
* lib

    General libraries
    
* test

    This location is for test helper functions. Actual tests should be located with the file being tested.
    
# Deploying

Each function is deployed to AWS lambda separately. The build process runs `tsc` and then `browserify` to produce a single JavaScript program with only the libraries used by the function.

```bash
apex infra plan
apex infra apply
apex deploy
```

## Local development

Run kinesalite:

```
npm install -g kinesalite
kinesalite --ssl
```

OR

```
docker run -d -p 4567:4567 vsouza/kinesis-local -p 4567 --ssl
```

Run the dispatcher:

```
KINESIS_ENDPOINT=https://localhost:4567 nf run npm start
```

Now run the function you're writing with the simulator specifying the stream name and function name:

```
KINESIS_ENDPOINT=https://localhost:4567 node simulator/kinesis-simulator.js commands crud
```