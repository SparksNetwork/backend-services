import * as apex from 'apex.js';
import SnsEvent = Lambda.SnsEvent;
import SnsEventRecord = Lambda.SnsEventRecord;
import {EC2, AutoScaling, ECS, Lambda} from 'aws-sdk';
import ContainerInstance = ECS.ContainerInstance;
import DescribeAutoScalingGroupsResponse = AutoScaling.DescribeAutoScalingGroupsResponse;
import DescribeInstancesResponse = EC2.DescribeInstancesResponse;
import DescribeTaskDefinitionResponse = ECS.DescribeTaskDefinitionResponse;
import RegisterTaskDefinitionResponse = ECS.RegisterTaskDefinitionResponse;
import StartTaskResponse = ECS.StartTaskResponse;
import ListContainerInstancesResponse = ECS.ListContainerInstancesResponse;
import DescribeContainerInstancesResponse = ECS.DescribeContainerInstancesResponse;

interface AsgEvent {
  AutoScalingGroupName: string;
  EC2InstanceId: string;
  Event: string;
}

const clusterName: string = 'kafka';
const region: string = 'us-west-2';
const brokerIdKey: string = 'brokerId';

function awsError(name:string) {
  return function(error:any) {
    console.error('An error occurred calling', name);
    console.error(error);
    throw error;
  }
}

function awsCall<U>(obj, apiName: string, params):Promise<U> {
  console.log('calling', apiName);
  return obj[apiName](params).promise()
    .catch(awsError(apiName))
}

async function getBrokerIds(asgName: string) {
  const asg = new AutoScaling({region});
  const ec2 = new EC2({region});

  const asgInfo = await awsCall<DescribeAutoScalingGroupsResponse>(asg, 'describeAutoScalingGroups', {
    AutoScalingGroupNames: [asgName]
  });

  const instanceIds = asgInfo.AutoScalingGroups[0].Instances.map(instance => instance.InstanceId);

  const instanceInfo = await awsCall<DescribeInstancesResponse>(ec2, 'describeInstances', {
    InstanceIds: instanceIds,
    DryRun: false,
    Filters: [{
      Name: "tag-key",
      Values: [brokerIdKey]
    }]
  });

  const ids = [];

  instanceInfo.Reservations.forEach(r =>
    r.Instances.forEach(i =>
      i.Tags.filter(tag => tag.Key === 'brokerId').forEach(tag => {
        ids.push(tag.Value);
      })
    )
  );

  return ids.map(Number);
}

async function describeContainerInstances() {
  const ecs = new ECS({region});

  const containerInstanceIds = await awsCall<ListContainerInstancesResponse>(ecs, 'listContainerInstances', {
    cluster: clusterName,
  });

  return await awsCall<DescribeContainerInstancesResponse>(ecs, 'describeContainerInstances', {
    cluster: clusterName,
    containerInstances: containerInstanceIds.containerInstanceArns
  })
}

async function getContainerInstanceId(ec2InstanceId: string) {
  let containerInstance:ContainerInstance;

  while(!containerInstance) {
    const containerInstances = await describeContainerInstances();

    containerInstance = containerInstances.containerInstances.find(ci =>
      ci.ec2InstanceId === ec2InstanceId
    );
  }

  return containerInstance.containerInstanceArn;
}

async function makeTask(brokerId:number) {
  const ecs = new ECS({region});

  const existingDefinition = (await awsCall<DescribeTaskDefinitionResponse>(ecs, 'describeTaskDefinition', {
    taskDefinition: 'kafka'
  })).taskDefinition;

  const containerDefinition = existingDefinition.containerDefinitions[0];
  containerDefinition.mountPoints = [
    {
      sourceVolume: 'efs',
      containerPath: '/data',
      readOnly: false
    }
  ];

  return await awsCall<RegisterTaskDefinitionResponse>(ecs, 'registerTaskDefinition', {
    family: `kafka-${brokerId}`,
    taskRoleArn: existingDefinition.taskRoleArn,
    containerDefinitions: [containerDefinition],
    volumes: [{
      name: 'efs',
      host: {
        sourcePath: `/mnt/efs/kafka/${brokerId}`
      }
    }]
  })
}

async function startKafka(msg: AsgEvent, brokerId:number) {
  const ecs = new ECS({region});
  const ec2 = new EC2({region});
  const containerInstanceId = await getContainerInstanceId(msg.EC2InstanceId);
  const instanceInfo = await ec2.describeInstances({
    DryRun: false,
    InstanceIds: [msg.EC2InstanceId]
  }).promise();
  const instance = instanceInfo.Reservations[0].Instances[0];

  const containerInstances = await describeContainerInstances();
  const instances = await awsCall<DescribeInstancesResponse>(ec2, 'describeInstances', {
    InstanceIds: containerInstances.containerInstances.map(instance => instance.ec2InstanceId),
    DryRun: false
  });

  const privateIps = instances.Reservations.map(r => r.Instances[0].PrivateIpAddress);
  const zkConnection = privateIps.map(ip => `${ip}:2181`).join(',');
  await makeTask(brokerId);

  return await awsCall<StartTaskResponse>(ecs, 'startTask', {
    containerInstances: [containerInstanceId],
    taskDefinition: `kafka-${brokerId}`,
    cluster: clusterName,
    overrides: {
      containerOverrides: [{
        name: 'kafka',
        environment: [
          {
            name: 'KAFKA_ADVERTISED_HOST_NAME',
            value: instance.PublicDnsName
          },
          {
            name: 'KAFKA_BROKER_ID',
            value: `${brokerId}`
          },
          {
            name: "ZOOKEEPER_CONNECTION_STRING",
            value: zkConnection
          }
        ]
      }]
    }
  })
}

async function createBrokerId(msg: AsgEvent) {
  const asg = new AutoScaling({region: 'us-west-2'});
  const ec2 = new EC2({region: 'us-west-2'});

  const asgInfo = await asg.describeAutoScalingGroups({
    AutoScalingGroupNames: [msg.AutoScalingGroupName]
  }).promise();

  await ec2.waitFor('systemStatusOk', {
    InstanceIds: [msg.EC2InstanceId],
    DryRun: false,
  }).promise();

  const instanceIds = asgInfo.AutoScalingGroups[0].Instances.map(instance => instance.InstanceId);
  let brokerId = instanceIds.indexOf(msg.EC2InstanceId);

  while (true) {
    const otherIds = await getBrokerIds(msg.AutoScalingGroupName);
    if (brokerId > 0 && otherIds.indexOf(brokerId) === -1) {
      break;
    }
    brokerId += 1;
  }

  await ec2.createTags({
    Resources: [msg.EC2InstanceId],
    Tags: [
      {
        Key: 'brokerId',
        Value: `${brokerId}`
      }
    ]
  }).promise();

  return brokerId;
}

async function systemStatus(instanceId: string) {
  const ec2 = new EC2({region});

  const statuses = await ec2.describeInstanceStatus({
    DryRun: false,
    InstanceIds: [instanceId],
  }).promise();

  const instanceStatus = statuses.InstanceStatuses[0];
  const status = [
    instanceStatus.InstanceState.Name,
    instanceStatus.InstanceStatus.Status,
    instanceStatus.SystemStatus.Status
  ];

  const ok = status[0] === 'running' && status[1] === 'ok' && status[2] === 'ok';
  console.log('got system status:', status, ok);
  return ok;
}

async function invokeWith(record: SnsEventRecord) {
  const lambda = new Lambda({region});

  console.log('invoking in 5s');
  return new Promise((resolve, reject) => {
    setTimeout(function() {
      awsCall(lambda, 'invoke', {
        InvocationType: 'Event',
        FunctionName: process.env['LAMBDA_FUNCTION_NAME'],
        Payload: JSON.stringify({Records: [record]})
      }).then(resolve).catch(reject);
    }, 5000);
  });
}

async function processRecord(record: SnsEventRecord) {
  const msg: AsgEvent = JSON.parse(record.Sns.Message);
  console.log('Processing', msg);

  if (msg.AutoScalingGroupName !== clusterName) {
    return;
  }
  if (msg.Event !== 'autoscaling:EC2_INSTANCE_LAUNCH') {
    return;
  }

  if (await systemStatus(msg.EC2InstanceId)) {
    console.log('working on', msg);
    const brokerId = await createBrokerId(msg);
    console.log('assigned broker id', brokerId);
    await startKafka(msg, brokerId);
    console.log('started kafka');
    return brokerId;
  } else {
    console.log('delay running, system not ready');
    const invokeResponse = await invokeWith(record);
    console.log('invoked', invokeResponse);
    return -1;
  }
}

export default apex(async function (event: SnsEvent) {
  console.log('starting');
  return Promise.all(event.Records.map(processRecord));
});