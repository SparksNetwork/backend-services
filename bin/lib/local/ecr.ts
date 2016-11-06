import {ECR} from 'aws-sdk';
import {Observable} from 'rxjs/Observable';
import {Observer} from "rxjs";
import {ImagePull, pullDockerImage, registerPuller} from "./docker";

const ecr = new ECR();

export function pullEcrImage(image: string): Observable<ImagePull> {
  return Observable.create(async function (obs: Observer<ImagePull>) {
    try {
      obs.next({
        status: 'Getting auth token',
        image
      });
      const authResponse = await ecr.getAuthorizationToken({
        registryIds: [image.split('.')[0]]
      }).promise();

      const authData = authResponse.authorizationData[0];
      if (!authData) {
        return obs.error('No auth data');
      }

      const [username, password] = (
        new Buffer(authData.authorizationToken, 'base64'
        ).toString()).split(':');

      const options = {
        authconfig: {
          username,
          password,
          auth: '',
          serveraddress: authData.proxyEndpoint
        }
      } as any;

      pullDockerImage(image, options).subscribe(obs);
    } catch (error) {
      obs.error(error);
    }
  });
}

export function install() {
  registerPuller(/ecr\..*\.amazonaws/, pullEcrImage);
}

