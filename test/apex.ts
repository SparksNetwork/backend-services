/**
 * This is a testing function that converts the return of an apex.js function
 * from callback format to a promise.
 *
 * @param fn function that has been wrapped in apex.js
 * @param event The event to pass to the function
 * @returns {Promise<T>}
 */
export async function apex(fn, event) {
  return new Promise((resolve, reject) => {
    fn(event, {}, (err, data) => {
      if (err) { return reject(err); }
      return resolve(data);
    });
  });
}

