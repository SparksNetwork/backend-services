import * as apex from 'apex.js';
import {spread} from "./spread";
import {firebase} from './ExternalFactories/Firebase';

interface LambdaFunction {
  (event, context?): Promise<any>;
}

function errorLogger(fn) {
  return async function(...args:any[]):Promise<any> {
    try {
      return await fn(...args);
    } catch(error) {
      console.error('Uncaught exception');
      console.error(error);
      if(error.stack) { console.error(error.stack); }
      throw error;
    }
  }
}


function lambda(name:string, ...fns:LambdaFunction[]) {
  return apex(errorLogger(firebase(name, spread(...fns))));
}

const λ = lambda;
export {λ, lambda};

