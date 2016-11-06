import * as R from 'ramda';
import Container = require("~dockerode/lib/container");
import Exec = require("~dockerode/lib/exec");
import {getContainerByName} from "./docker";
import {Observable} from "rxjs";

export function createTopic(name):Observable<string> {
  return Observable.create(async function(obs) {
    obs.next('Getting kafka container');
    const container = await getContainerByName('kafka');
    if(!container) { return obs.error('No kafka container running'); }

    const topicCommand = `unset JMX_PORT && bin/kafka-topics.sh --topic ${name} --partitions 1 --replication-factor 1 --zookeeper \${ZOOKEEPER_PORT_2181_TCP_ADDR}:2181 --create`;

    obs.next('Creating exec');
    container.exec({
      Cmd: [
        'bash',
        '-c',
        topicCommand
        ],
      AttachStdout: true,
      AttachStderr: true,
      AttachStdin: false
    }, function(err, exec:Exec) {
      if (err) { return obs.error(err); }

      obs.next('Creating topic');
      exec.start({}, function(err, stream) {
        if (err) { return obs.error(err); }

        let buffer = '';

        stream.on('data', function(data) {
          buffer = buffer + data.toString();
        });

        stream.on('end', function() {
          if (R.test(/already exists/, buffer) || R.test(/Created topic/, buffer)) {
            obs.complete();
          } else {
            obs.error(buffer);
          }
        })
      });
    });
  });
}

