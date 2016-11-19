let debug = function(...msg:any[]) {};

if(process.env["NODE_ENV"] !== 'test') {
  debug = function(...msg:any[]) {
    console.log(msg[0], ...msg);
  }
}

export {debug}

export function error(...msg:any[]) {
  console.error('[ERROR]', msg);
}
