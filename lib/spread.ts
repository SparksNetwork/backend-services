/**
 * Given a list of functions, returns a function that when called with any
 * arguments will send all the arguments to all of the functions and then run
 * Promise.all on the results. Effectively, spread to these functions and
 * collect the results.
 *
 * @usage:
 *
 *   async function statFile(filename) { ... }
 *   async function readFile(filename) { ... }
 *
 *   const statRead = spread(statFile, readFile)
 *   const [stat, contents] = await statRead('myfile.txt');
 *
 * @param fns
 * @returns {(args:...[any])=>Promise<(T1|T2|T3|T4|T5|T6|T7|T8|T9|T10)[]>}
 */
export function spread(...fns) {
  return function(...args) {
    const promises = fns.map(fn => fn(...args));
    return Promise.all(promises);
  }
}

