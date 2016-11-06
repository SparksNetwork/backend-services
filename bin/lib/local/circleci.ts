import * as got from 'got';
import * as R from 'ramda';
import {Observable, Observer} from "rxjs";
import {ImagePull, registerPuller} from "./docker";

const schema = 'circleci:';
const reg = new RegExp('^' + schema);

async function circleciRequest(path):Promise<any> {
  return (await got('https://circleci.com/api/v1.1/' + path, {
    json: true,
  })).body;
}

export function getImageFromCircleci(image:string):Observable<ImagePull> {
  return Observable.create(async function (obs: Observer<ImagePull>) {
    try {
      if (R.test(reg, image)) {
        image = image.slice(schema.length);
      }

      obs.next({status: 'Fetching builds', image});

      const builds = await circleciRequest(`project/github/${image}/tree/master?filter=successful`)
      if (!builds || builds.length === 0) {
        return obs.error('No builds');
      }

      obs.next({status: 'Fetching artifacts', image});
      const num = builds[0].build_num;
      const artifacts = await circleciRequest(`project/github/${image}/${num}/artifacts`);
      if (!artifacts || artifacts.length === 0) {
        return obs.error('No artifacts');
      }
      const imageArtifact = R.find(R.propEq('pretty_path', '$CIRCLE_ARTIFACTS/image'), artifacts);
      if (!imageArtifact) {
        return obs.error('No image artifact');
      }

      obs.next({status: 'Fetching artifact', image});
      const imageResponse = await got(imageArtifact.url);
      const nextImage = imageResponse.body.trim();

      obs.next({
        pulled: false,
        image: nextImage,
        status: 'Artifact found'
      });

      obs.complete();
    } catch(err) {
      obs.error(err);
    }
  });
}

export function install() {
  registerPuller(reg, getImageFromCircleci);
}