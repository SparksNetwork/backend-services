declare module "listr" {
  type PlainTask = (ctx:any) => any;
  type PromiseTask = (ctx:any) => Promise<any>;
  type ListrTask = (ctx:any) => Listr;

  interface Task {
    title:string;
    skip?: PlainTask | PromiseTask;
    task: PlainTask | PromiseTask;
  }

  type TaskList = Task[];

  interface ListrOptions {
    concurrent?: boolean;
    renderer?: string | {};
  }

  class Listr {
    constructor(tasks:TaskList, options?:ListrOptions)
    add(task:Task):Listr;
    run(context?:any):Promise<any>;
    run<T>(context:T):Promise<T>;

    context:any;
    task: Task | TaskList;
  }

  export = Listr;
}