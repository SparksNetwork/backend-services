export function spread(...fns) {
  return function(...args) {
    const promises = fns.map(fn => fn(...args));
    return Promise.all(promises);
  }
}

