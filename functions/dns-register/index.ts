import * as apex from 'apex.js';
import {Route53, AutoScaling, EC2} from 'aws-sdk';

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
      ips.push(instance.PrivateIpAddress);
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

export default apex(async function() {
  await registerAll('kafka', 'aws.sparks.network', 'zookeeper');
  await registerAll('kafka', 'aws.sparks.network', 'kafka');
})