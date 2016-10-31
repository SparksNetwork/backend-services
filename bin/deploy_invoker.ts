require('source-map-support').install();

import {ECS} from 'aws-sdk';
import {exec} from "child_process";
import async = require("async");
import {exitErr} from "./lib/util";

function getVersion(cb: (error, version: string) => void) {
  exec('git rev-parse --short HEAD', function (error, stdout) {
    cb(error, 'v' + (stdout || '').trim());
  });
}

const ecs = new ECS({region: 'us-west-2'});

function getTaskDefinitionArn(cb: (error, arn: string) => void) {
  ecs.listTaskDefinitions({
    familyPrefix: 'invoker',
    status: 'ACTIVE'
  }, function (err, response) {
    if (response.taskDefinitionArns.length === 0) {
      ecs.listTaskDefinitions({
        familyPrefix: 'invoker',
        status: 'INACTIVE'
      }, function(err, response) {
        console.log(response.taskDefinitionArns);
        cb(err, response.taskDefinitionArns[0]);
      })
    } else {
      cb(err, response.taskDefinitionArns[0]);
    }
  });
}

function getTaskDefinition(cb: (error, definition) => void) {
  async.waterfall([
    getTaskDefinitionArn,
    function (arn, cb) {
      ecs.describeTaskDefinition({
        taskDefinition: arn
      }, function (err, response) {
        cb(err, response.taskDefinition);
      });
    }
  ], cb);
}

function makeTaskDefinition({taskDefinition, version}:{taskDefinition: ECS.TaskDefinition, version: string}, cb: (error, response: ECS.RegisterTaskDefinitionResponse) => void) {
  taskDefinition.containerDefinitions[0].image = '878160042194.dkr.ecr.us-west-2.amazonaws.com/invoker:' + version;

  ecs.listTaskDefinitions({
    familyPrefix: 'invoker',
    status: 'ACTIVE'
  }, function(err, listResponse) {
    if (err) { return cb(err, null); }

    ecs.registerTaskDefinition({
      containerDefinitions: taskDefinition.containerDefinitions,
      family: 'invoker',
      taskRoleArn: taskDefinition.taskRoleArn
    }, function(err, registerResponse) {
      if (err) { return cb(err, null); }

      async.each(listResponse.taskDefinitionArns, function(arn, cb) {
        ecs.deregisterTaskDefinition({
          taskDefinition: arn
        }, cb)
      }, function(err) {
        if (err) { return cb(err, null); }
        cb(null, registerResponse);
      })
    });
  })
}

function updateService({makeTaskDefinition}:{makeTaskDefinition: ECS.RegisterTaskDefinitionResponse}, cb: (error) => void) {
  console.log(makeTaskDefinition);
  const taskDef:string = [makeTaskDefinition.taskDefinition.family, makeTaskDefinition.taskDefinition.revision].join(':');

  ecs.updateService({
    cluster: 'dispatch',
    service: 'invoker',
    taskDefinition: taskDef,
  }, cb);
}

async.auto({
  taskDefinition: getTaskDefinition,
  version: getVersion,
  makeTaskDefinition: ['taskDefinition', 'version', makeTaskDefinition],
  updateService: ['makeTaskDefinition', updateService]
}, 10, function (err, responses) {
  if (err) {
    exitErr(err);
  }
  console.log('Successfully updated task definition to image', responses.version);
});
