import * as clc from 'cli-color';
import * as Throbber from 'cli-color/throbber'

export function exitErr(error) {
  console.error('ERROR:', error);
  process.exit(1);
}

/**
 * Given an async task this will log to the console the task name and a spinner
 * like so:
 *
 *   [name] /
 *
 * And then when finished it will change it to:
 *
 *   [name] done 206ms
 *
 * @param name
 * @param fn
 * @returns {(args:...[any])=>undefined}
 */
export function asyncTime(name, fn) {
  const grey = clc.xterm(252);
  return function(...args) {
    const start = Date.now();
    process.stdout.write(grey('[', name, '] '));

    const throbber = Throbber(str => {
      process.stdout.write(str);
    }, 200);
    throbber.start();

    const cb = args.slice(-1)[0];
    const newcb = function(err, ...cbargs) {
      throbber.stop();
      process.stdout.write(clc.erase.line);
      process.stdout.write(clc.move.left(clc.windowSize.width));

      if (err) {
        process.stdout.write(clc.red('[', name, '] error: ', err));
      } else {
        const time = Date.now() - start;
        process.stdout.write(clc.green('[', name, '] done ') + clc.cyan(time, 'ms'));
      }

      process.stdout.write("\n");
      cb(err, ...cbargs);
    };
    args.splice(-1, 1, newcb);
    fn.apply(this, args);
  }
}

