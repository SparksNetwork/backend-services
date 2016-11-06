import {CreateContainerOptions} from "~dockerode/lib/docker";
import * as Docker from 'dockerode';
import * as R from 'ramda';
import * as net from 'net';
import Container = require("~dockerode/lib/container");
import {ContainerResult} from "~dockerode/lib/container";
import {Observable, Observer} from "rxjs";
import {ContainerListOptions} from "~dockerode/lib/docker";
import {ContainerListItem} from "~dockerode/lib/container";
import {AttachOptions} from "~dockerode/lib/container";
import {Stream} from "stream";
import {install as ecrInstall} from "./ecr";
import {install as circleciInstall} from './circleci';

export interface ImagePull {
  image: string;
  status?: string;
  pulled?: boolean;
}

const docker = new Docker();

function findContainer(name: string, list: ContainerListItem[]): ContainerListItem | undefined {
  return R.find(R.compose(R.contains('/' + name), R.propOr([], 'Names')))(list) as any;
}

const pullers = [];
export function registerPuller(test, fn) {
  if (typeof test !== 'function') {
    test = R.test(test);
  }

  pullers.push({test, fn});
}

ecrInstall();
circleciInstall();

export function pullImage(image: string): Observable<ImagePull> {
  const puller = R.find(p => p.test(image), pullers);
  const fn = puller ? puller.fn : pullDockerImage;

  return Observable.create(async function (obs) {
    try {
      const observable = fn(image);
      let status: ImagePull = {image, pulled: false};

      observable.subscribe({
        next: n => {
          status = n;
          obs.next(n);
        },
        error: e => {
          obs.error(e);
        },
        complete: () => {
          if (status.pulled) {
            obs.complete();
          } else {
            handleNext();
          }
        }
      });

      function handleNext() {
        const next = pullImage(status.image);
        next.subscribe(obs);
      }
    } catch (err) {
      obs.error(err);
    }
  });
}

export function pullDockerImage(image: string, options?): Observable<ImagePull> {
  if (!options) {
    options = {};
  }

  return Observable.create(async function (obs: Observer<ImagePull>) {
    try {
      obs.next({
        status: 'Downloading image',
        image
      });

      function onProgress(event) {
        obs.next({
          image,
          status: event.status,
          pulled: false
        });
      }

      function onFinished(err) {
        if (err) {
          return obs.error(err);
        }
        obs.next({
          image,
          pulled: true
        });
        obs.complete();
      }

      docker.pull(image, options, function (err, stream) {
        if (err) {
          return obs.error(err);
        }
        docker.modem.followProgress(stream, onFinished, onProgress);
      });
    } catch (err) {
      obs.error(err);
    }
  });
}

export function listContainers(options: ContainerListOptions): Promise<ContainerListItem[]> {
  return new Promise((resolve, reject) => {
    docker.listContainers(options, function (err, items) {
      if (err) {
        return reject(err);
      }
      resolve(items);
    })
  });
}

export async function containerRunning(name: string): Promise<boolean> {
  const containers = await listContainers({});
  return Boolean(findContainer(name, containers));
}

export async function getContainerByName(name: string): Promise<Container | undefined> {
  const containers = await listContainers({all: true});
  const item: ContainerListItem = findContainer(name, containers);

  if (item) {
    return docker.getContainer(item.Id);
  }
}

function sleep(timeout: number, cb?): Promise<void> {
  return new Promise(function (resolve) {
    setTimeout(resolve, timeout * 1000);
  }).then(function () {
    if (cb) {
      cb(null);
    }
  });
}

function waitForPort(port, attempt?, cb?): Promise<void> {
  return new Promise(function (resolve, reject) {
    if (typeof attempt === 'function') {
      cb = attempt;
    }
    if (typeof attempt !== 'number') {
      attempt = 1;
    }

    if (attempt > 10) {
      return reject('timeout');
    }

    function createClient() {
      return net.createConnection({
        host: 'localhost',
        port: port
      });
    }

    const client = createClient();
    client.on('connect', function () {
      client.end();
      resolve();
    });

    client.on('error', function () {
      client.end();
      setTimeout(function () {
        waitForPort(port, attempt + 1)
          .then(() => resolve())
          .catch(reject);
      }, 500);
    })
  })
    .then(function () {
      if (cb) {
        cb(null);
      }
    })
    .catch(function (err) {
      if (cb) {
        cb(err);
      }
      throw err;
    });
}

export function startAndWaitContainer(name, opts: CreateContainerOptions, port: number, sleepFor: number): Observable<string> {
  return Observable.create(async function (obs) {
    try {
      if (!opts.Image) {
        return obs.error('No image specified');
      }

      function create(opts): Promise<Container> {
        return new Promise(function (resolve, reject) {
          docker.createContainer(opts, function (err, container) {
            if (err) {
              return reject(err);
            }
            resolve(container);
          });
        });
      }

      function getState(container: Container): Promise<ContainerResult> {
        return new Promise(function (resolve, reject) {
          container.inspect({}, function (err, result: ContainerResult) {
            if (err) {
              return reject(err);
            }
            resolve(result);
          });
        });
      }

      function start(container: Container): Promise<void> {
        return new Promise(function (resolve, reject) {
          container.start(function (err) {
            if (err) {
              return reject(err);
            }
            resolve();
          });
        });
      }

      obs.next('Checking status');
      let container = await getContainerByName(name);

      if (!container) {
        obs.next('Creating container');
        opts.name = name;
        container = await create(opts);
      }

      const state: ContainerResult = await getState(container);

      if (!state.State.Running) {
        obs.next('Starting container');
        await start(container)
      }

      obs.next('Waiting');
      await sleep(sleepFor);

      obs.next('Connecting');
      await waitForPort(port);

      obs.complete();
    } catch (err) {
      obs.error(err);
    }
  });
}

export function createContainer(options: CreateContainerOptions): Promise<Container> {
  return new Promise(function (resolve, reject) {
    docker.createContainer(options, function (err, container) {
      if (err) {
        return reject(err);
      }
      resolve(container);
    });
  });
}

export function attachContainer(container: Container, options: AttachOptions): Promise<Stream> {
  options.stream = true;

  return new Promise(function (resolve, reject) {
    container.attach(options, function (err, stream) {
      if (err) {
        return reject(err);
      }
      resolve(stream);
    });
  });
}

function writeNamedLines(name: string, lines: string) {
  const ary = lines.split("\n");
  const msg = ary
    .map(line => line.trim())
    .map(line => `[${name}] ` + line)
    .join("\n");
  console.log(msg);
}

function listenTo(name: string, stream: Stream) {
  let timeout;
  let buffer = '';
  stream.on('data', function (data) {
    buffer += data;
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(function () {
      timeout = null;
      writeNamedLines(name, buffer);
      buffer = '';
    }, 250);
  });
}

export function startAndListen(name: string, container: Container): Observable<string> {
  return Observable.create(async function (obs) {
    try {
      obs.next('Attaching container');
      const stream = await attachContainer(container, {
        stdin: false,
        stdout: true,
        stderr: true
      });

      obs.next('Starting container');
      stream.on('error', () => container.remove(() => {
      }));
      stream.on('end', () => container.remove(() => {
      }));
      listenTo(name, stream);

      container.start(function (err) {
        if (err) {
          return obs.error(err);
        }
        obs.complete();
      });
    } catch (err) {
      obs.error(err);
    }
  });
}



