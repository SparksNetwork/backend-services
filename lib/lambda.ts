import * as apex from 'apex.js';
import {spread} from "./spread";
import {firebase} from './ExternalFactories/Firebase';

interface LambdaFunction {
  (event, context?): Promise<any>;
}

function lambda(name:string, ...fns:LambdaFunction[]) {
  return apex(firebase(name, spread(...fns)));
}

const λ = lambda;
export {λ, lambda};
