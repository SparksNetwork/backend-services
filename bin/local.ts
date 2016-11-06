require('source-map-support').install();

import R = require("ramda");
import {
  startAndWaitContainer,
  pullImage,
  createContainer,
  ImagePull, startAndListen
} from "./lib/local/docker";
import Container = require("~dockerode/lib/container");
import {CreateContainerOptions} from "~dockerode/lib/docker";
import {execSync} from "child_process";
import {createTopic} from "./lib/local/kafka";
import Listr = require('listr');
import {Observable} from "rxjs";
import {readFileBase64, readEnvFile, serializeEnv} from "./lib/local/env";
import {writeFile} from "fs";
const execa = require('execa');

const stoppableContainers = [];
process.on('SIGINT', function () {
  console.log('int');
  interrupt();
});
process.on('SIGTERM', function () {
  console.log('term');
  interrupt();
});
process.on('exit', function () {
  console.log('exiting');
});
let interrupted = false;
function interrupt() {
  if (interrupted) {
    return console.log('alright, I\'m doing it, wait a moment would you');
  }
  interrupted = true;
  console.log(`${stoppableContainers.length} containers to stop`);
  for (let c of stoppableContainers) {
    execSync('docker stop ' + c.id);
  }
}

const zookeeperOpts: CreateContainerOptions = {
  Image: 'zookeeper:latest',
  HostConfig: {
    PortBindings: {
      '2181/tcp': [{HostPort: '2181'}]
    }
  }
};

const kafkaOpts: CreateContainerOptions = {
  Image: 'ches/kafka:0.10.1.0',
  HostConfig: {
    Links: ['zookeeper:zookeeper'],
    PortBindings: {
      '9092/tcp': [{HostPort: '9092'}]
    }
  },
  Env: []
};

const dispatchOpts: CreateContainerOptions = {
  HostConfig: {
    Links: ['kafka:kafka']
  }
};

const invokerOpts: CreateContainerOptions = {
  Cmd: 'local',
  HostConfig: {
    Links: ['kafka:kafka'],
    Binds: [
      process.cwd() + ':/app/services'
    ]
  }
};

function startDispatch(ctx): Observable<string> {
  console.log(ctx);
  return Observable.create(async function (obs) {
    try {
      obs.next('Loading credentials');
      const firebaseCredentials = await readFileBase64('firebase.json');
      obs.next('Loading environment');
      const env = await readEnvFile('.env');
      env['CREDENTIALS'] = firebaseCredentials;

      obs.next('Creating container');
      const options: CreateContainerOptions = Object.assign({}, dispatchOpts);
      options.Image = ctx.dispatch;
      options.Env = serializeEnv(env);
      const container = await createContainer(options);
      stoppableContainers.push(container);

      obs.next('Starting container');
      startAndListen('dispatch', container).subscribe(obs);
    } catch (err) {
      obs.error(err);
    }
  });
}

function startInvoker(ctx): Observable<string> {
  return Observable.create(async function (obs) {
    try {
      obs.next('Loading environment');
      const env = await readEnvFile('.env');

      obs.next('Creating container');
      const options: CreateContainerOptions = Object.assign({}, invokerOpts);
      options.Image = ctx.invoker;
      options.Env = serializeEnv(env);
      const container = await createContainer(options);
      stoppableContainers.push(container);

      startAndListen('invoker', container).subscribe(obs);
    } catch (err) {
      obs.error(err);
    }
  })
}

function pullImageStatus(o: Observable<ImagePull>) {
  return o.filter(i => Boolean(i.status)).map(R.prop('status'));
}

const tasks = new Listr([
  {
    title: 'Pull images',
    task: () => {
      return new Listr([
        {
          title: 'zookeeper',
          task: () => pullImageStatus(pullImage('zookeeper:latest'))
        },
        {
          title: 'kafka',
          task: () => pullImageStatus(pullImage('ches/kafka:0.10.1.0'))
        },
        {
          title: 'dispatch',
          task: ctx => {
            const pull = pullImage('circleci:SparksNetwork/backend-dispatch');
            pull.subscribe(i => ctx.dispatch = i.image);
            return pullImageStatus(pull);
          }
        },
        {
          title: 'invoker',
          task: ctx => {
            const pull = pullImage('circleci:SparksNetwork/backend-invoker');
            pull.subscribe(i => ctx.invoker = i.image);
            return pullImageStatus(pull);
          }
        }
      ], {concurrent: true});
    }
  },
  {
    title: 'Start Zookeeper',
    task: () => {
      return startAndWaitContainer('zookeeper', zookeeperOpts, 2181, 1);
    }
  },
  {
    title: 'Start Kafka',
    task: () => {
      return startAndWaitContainer('kafka', kafkaOpts, 9092, 1)
    }
  },
  {
    title: 'Create topics',
    task: () => {
      return new Listr([
        {
          title: 'commands',
          task: () => createTopic('commands')
        },
        {
          title: 'data.firebase',
          task: () => createTopic('data.firebase')
        },
        {
          title: 'data.emails',
          task: () => createTopic('data.emails')
        }
      ], {concurrent: true})
    }
  },
  {
    title: 'Create config',
    task: () => {
      return new Listr([
        {
          title: 'schemas.json',
          task: () => {
            return execa('cp', ['node_modules/sparks-schemas/schemas.json', 'schemas.json']);
          }
        },
        {
          title: 'functions.json',
          task: async function() {
            const data = (await execa('node', ['bin/functions.js'])).stdout;
            return new Promise((resolve, reject) => {
              writeFile('functions.json', data, err => err ? reject(err) : resolve());
            });
          }
        }
      ]);
    }
  },
  {
    title: 'Start Dispatch and Invoker',
    task: () => {
      return new Listr([
        {
          title: 'dispatch',
          task: startDispatch
        },
        {
          title: 'invoker',
          task: startInvoker
        }
      ], {concurrent: true})
    }
  }
]);

tasks.run({})
  .then(function () {
    console.log('running');
  })
  .catch(function (err) {
    console.error('An error occurred');
    console.error(err);
    process.exit(1);
  });

