declare namespace ajv {
  export interface Thenable <R> {
    then <U> (onFulfilled?: (value: R) => U | Thenable<U>, onRejected?: (error: any) => U | Thenable<U>): Thenable<U>;
  }

  export interface ValidateFunction {
    (
      data: any,
      dataPath?: string,
      parentData?: Object | Array<any>,
      parentDataProperty?: string | number,
      rootData?: Object | Array<any>
    ): boolean | Thenable<boolean>;
    errors?: Array<ErrorObject>;
    schema?: Object;
  }

  export interface ErrorObject {
    keyword: string;
    dataPath: string;
    schemaPath: string;
    params: any;
    // Excluded if messages set to false.
    message?: string;
    // These are added with the `verbose` option.
    schema?: Object;
    parentSchema?: Object;
    data?: any;
  }
}
