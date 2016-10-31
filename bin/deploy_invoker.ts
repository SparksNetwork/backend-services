import {ECS} from 'aws-sdk';
import {exec} from "child_process";
import async = require("async");
import TaskDefinition = ECS.TaskDefinition;
import {exitErr} from "./lib/util";
import RegisterTaskDefinitionResponse = ECS.RegisterTaskDefinitionResponse;

function getVersion(cb:(error, version:string) => void) {
  exec('git rev-parse --short HEAD', function (error, stdout) {
    cb(error, 'v' + (stdout||'').trim());
  });
}

const ecs = new ECS({region: 'us-west-2'});

function getTaskDefinitionArn(cb:(error, arn:string) => void) {
  ecs.listTaskDefinitions({
    familyPrefix: 'invoker',
    status: 'ACTIVE'
  }, function (err, response) {
    cb(err, response.taskDefinitionArns[0]);
  });
}

function getTaskDefinition(cb:(error, definition) => void) {
  async.waterfall([
    getTaskDefinitionArn,
    function(arn, cb) {
      ecs.describeTaskDefinition({
        taskDefinition: arn
      }, function(err, response) {
        cb(err, response.taskDefinition);
      });
    }
  ], cb);
}

function makeTaskDefinition({taskDefinition, version}:{taskDefinition: TaskDefinition, version: string}, cb:(error, response:RegisterTaskDefinitionResponse) => void) {
  taskDefinition.containerDefinitions[0].image = '878160042194.dkr.ecr.us-west-2.amazonaws.com/invoker:' + version;
  ecs.registerTaskDefinition({
    containerDefinitions: taskDefinition.containerDefinitions,
    family: 'invoker',
    taskRoleArn: taskDefinition.taskRoleArn
  }, cb);
}

function updateService({makeTaskDefinition}:{makeTaskDefinition: RegisterTaskDefinitionResponse}, cb:(error) => void) {
  ecs.updateService({
    cluster: 'dispatch',
    service: 'invoker',
    taskDefinition: makeTaskDefinition.taskDefinitionArn
  }, cb);
}

async.auto({
  taskDefinition: getTaskDefinition,
  version: getVersion,
  makeTaskDefinition: ['taskDefinition', 'version', makeTaskDefinition],
  updateService: ['makeTaskDefinition', updateService]
}, 10, function(err, responses) {
  if (err) { exitErr(err); }
  console.log('Successfully updated task definition to image', responses.version);
});
