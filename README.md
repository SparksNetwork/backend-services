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

## Making a function

Let's imagine we want to make a function for a new model called Bobs. A user can create, update and remove a Bob.

We've defined the schemas for Bob objects in the `sparks-schemas` project already.

1. Create a new function directory in `functions`

2. Create a function.json file. 

3. We want this function to react to Bob commands and persist Bob data. So we'll attach it to the `commands` stream. Put this in function.json:

```json
{
  "stream": "commands"
}
```

4. Create index.ts. This file will need to export a function that receives Kinesis Stream records. Apex provides a helper for this:

```typescript
import * as apex from 'apex.js';

export default apex(async function(event) {
  
});
```

5. We're only interested in Bob commands, not all commands, so we need to filter the events. We can use the `StreamFunction` helper for this:

```typescript
import * as apex from 'apex.js';
import {spread} from "../../lib/spread";
import {StreamFunction} from "../../lib/StreamFunction";

const create = StreamFunction('command.Bob.create', async function(message) {});
const update = StreamFunction('command.Bob.update', async function(message) {});
const remove = StreamFunction('command.Bob.remove', async function(message) {});

export default apex(spread(create, update, remove));
```

Here we use the spread function to send each event to all 3 functions, and the StreamFunction function to filter so that our function body only receives the appropriate message.

6. Persist the data somewhere. We'll want the data to go to firebase. However, our function must not write to firebase as that the role of a repository service. We already have a repository service for firebase, so we'll use that. What our function needs to do is **transform** the messages from command messages into data messages, and then put them on the `data.firebase` Kinesis Stream. To do that we can use the `StreamTransform` function which expects to be returned an array of messages:

```typescript
import * as apex from 'apex.js';
import {spread} from "../../lib/spread";
import {StreamTransform} from "../../lib/StreamFunction";

const create = StreamTransform('command.Bob.create', async function(message) {
  return [createMessageHere]
});
const update = StreamTransform('command.Bob.update', async function(message) {
  return [updateMessageHere]
});
const remove = StreamTransform('command.Bob.remove', async function(message) {
  return [removeMessageHere]
});

export default apex(spread(create, update, remove));
```

7. Use the data helpers to produce the messages:

```typescript
import * as apex from 'apex.js';
import {spread} from "../../lib/spread";
import {StreamTransform} from "../../lib/StreamFunction";
import {firebaseUid} from '../../lib/ExternalFactories/Firebase';
import {dataCreate, dataUpdate, dataRemove} from '../../helpers';

const create = StreamTransform('command.Bob.create', async function(message) {
  return [dataCreate(message.domain, firebaseUid(), message.uid, message.payload.values)]
});
const update = StreamTransform('command.Bob.update', async function(message) {
  return [dataUpdate(message.domain, message.payload.key, message.uid, message.payload.values)]
});
const remove = StreamTransform('command.Bob.remove', async function(message) {
  return [dataRemove(message.domain, message.payload.key, message.uid)]
});

export default apex(spread(create, update, remove));
```

8. Apply business rules:

```typescript
import * as apex from 'apex.js';
import {spread} from "../../lib/spread";
import {StreamTransform} from "../../lib/StreamFunction";
import {firebaseUid} from '../../lib/ExternalFactories/Firebase';
import {dataCreate, dataUpdate, dataRemove} from '../../helpers';

const create = StreamTransform('command.Bob.create', async function(message) {
  
  const values = Object.assign({},
    message.payload.values,
    {
      bobCreatedAt: Date.now()
    }
  );
  
  return [dataCreate(message.domain, firebaseUid(), message.uid, values)]
});
const update = StreamTransform('command.Bob.update', async function(message) {
  return [dataUpdate(message.domain, message.payload.key, message.uid, message.payload.values)]
});
const remove = StreamTransform('command.Bob.remove', async function(message) {
  return [dataRemove(message.domain, message.payload.key, message.uid)]
});

export default apex(spread(create, update, remove));
```

9. Finally, we can use default helpers for the transformations that are standard:

```typescript
import * as apex from 'apex.js';
import {spread} from "../../lib/spread";
import {StreamTransform} from "../../lib/StreamFunction";
import {firebaseUid} from '../../lib/ExternalFactories/Firebase';
import {dataCreate, dataUpdate, dataRemove} from '../../helpers';
import {UpdateTransform, RemoveTransform} from "../../helpers/CommandToDataTransform";

const create = StreamTransform('command.Bob.create', async function(message) {
  
  const values = Object.assign({},
    message.payload.values,
    {
      bobCreatedAt: Date.now()
    }
  );
  
  return [dataCreate(message.domain, firebaseUid(), message.uid, values)]
});

export default apex(spread(
  create,
  UpdateTransform('command.Bob.update'),
  RemoveTransform('command.Bob.remove')
));
```

10. And that is our function. We can now build and deploy:

```bash
-> bin/build
Changes in bob
[BUILD] typescript
[BUILD] apex
100% 1:0=0s bob
-> bin/plan -refresh=false
Writing roles
Writing attachments
Writing functions
Planning
-> bin/apply
```

## Global structure

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
    
# Building and deploying

Each function is deployed to AWS lambda separately. The build process runs `tsc` and then `browserify` to produce a single JavaScript program with only the libraries used by the function.

In the `bin/` folder there are helper commands for the build process:

* `apply`: Run `terraform apply terraform.plan` in the infrastructure directory.
* `attach.ts`: Generates `infrastructure/attach.tf` by reading the stream names from each `function.json` file.
* `build`: Create a zip file for each function in `dist/`. If `dist/` already exists then it will only build changed functions.
* `build_function`: Wrapper script (used by apex, see project.json) for build_function.ts
* `build_function.ts`: This script takes each function and produces a single JavaScript file named `main.js` with the dependencies bundled using browserify. It also injects the firebase credentials.
* `lambda.ts`: Generates `infrastructure/lambda.tf` by reading all the available functions.
* `plan`: Run `terraform plan` in the infrastructure directory. This script runs the generation scripts before plan so that everything is ready for terraform. It takes any terraform plan arguments, for example `-refresh=false`
* `roles.ts`: Generates `infrastructure/roles.tf`, making a role for each function with permissions to read from the attached Kinesis Stream. It also applies any custom policy in the function policy.json file.
* `variables.ts`: Generates `infrastructure/variables.tf`

## Running:

To build and deploy everything:

```bash
bin/build
bin/plan -refresh=false # for speeds
bin/apply
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