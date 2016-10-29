import * as apex from 'apex.js';
import SnsEvent = Lambda.SnsEvent;
import SnsEventRecord = Lambda.SnsEventRecord;
import {Route53, AutoScaling, EC2} from 'aws-sdk';

interface AsgEvent {
  AutoScalingGroupName: string;
  EC2InstanceId: string;
  Event: string;
}

async function asgIps(asgName:string):Promise<string[]> {
  const asg = new AutoScaling({region: 'us-west-2'});
  const ec2 = new EC2({region: 'us-west-2'});

  const asgInfo = await asg.describeAutoScalingGroups({
    AutoScalingGroupNames: [asgName],
    MaxRecords: 1
  }).promise();

  const instanceIds = asgInfo.AutoScalingGroups[0].Instances.map(instance => instance.InstanceId);

  const ec2Info = await ec2.describeInstances({
    DryRun: false,
    InstanceIds: instanceIds
  }).promise();

  const ips = [];

  ec2Info.Reservations.forEach(reservation => {
    reservation.Instances.forEach(instance => {
      instance.NetworkInterfaces.forEach(ni => {
        if (ni.Association && ni.Association.PublicIp) {
          ips.push(ni.Association.PublicIp);
        }
      });
    });
  });

  return ips;
}

async function registerAll(asgName:string, zone:string, record:string) {
  const route53 = new Route53({});

  try {
    const zones = await route53.listHostedZonesByName({
      DNSName: zone
    }).promise();
    const zoneId = zones.HostedZones[0].Id;
    const ips = await asgIps(asgName);

    console.log('Registering', {
      asgName,
      zone,
      record,
      ips
    });

    return route53.changeResourceRecordSets({
      HostedZoneId: zoneId,
      ChangeBatch: {
        Changes: [
          {
            Action: 'UPSERT',
            ResourceRecordSet: {
              Name: [record, zone].join('.'),
              Type: 'A',
              TTL: 60,
              ResourceRecords: ips.map(ip => ({Value: ip}))
            }
          }
        ]
      }
    }).promise();
  } catch(error) {
    console.error('Uh oh!');
    console.error(error);
  }
}

async function processLaunch(msg:AsgEvent) {
  if (msg.AutoScalingGroupName === 'kafka') {
    await registerAll(msg.AutoScalingGroupName, 'aws.sparks.network', 'zookeeper');
    await registerAll(msg.AutoScalingGroupName, 'aws.sparks.network', 'kafka');
  }
}

async function processTerminate(msg:AsgEvent) {
  if (msg.AutoScalingGroupName === 'kafka') {
    await registerAll(msg.AutoScalingGroupName, 'aws.sparks.network', 'zookeeper');
    await registerAll(msg.AutoScalingGroupName, 'aws.sparks.network', 'kafka');
  }
}

async function processRecord(record:SnsEventRecord) {
  const msg:AsgEvent = JSON.parse(record.Sns.Message);

  if (msg.Event === 'autoscaling:EC2_INSTANCE_LAUNCH') {
    await processLaunch(msg);
  }

  if (msg.Event === 'autoscaling:EC2_INSTANCE_TERMINATE') {
    await processTerminate(msg);
  }
}

export default apex(async function(event:SnsEvent) {
  console.log('dns-register', event);

  return Promise.all(event.Records.map(record => {
    return processRecord(record);
  }));
})