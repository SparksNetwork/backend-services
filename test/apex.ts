export async function apex(fn, message) {
  return new Promise((resolve, reject) => {
    fn(message, {}, (err, data) => {
      if (err) { return reject(err); }
      return resolve(data);
    });
  });
}

