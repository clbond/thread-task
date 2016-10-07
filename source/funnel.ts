import {Executable, Task} from './task';

import {FunctionPair} from './function-pair';

export type TaskCollection<T> = Array<FunctionPair<T> | Executable<T>>;

/// Run multiple asynchronous tasks on separate threads and collect the
/// results into a single promise. Each task must return type T.
export class Funnel<R> {
  public static run<T>(functions: TaskCollection<T>): Promise<Array<T>> {
    return new Funnel<T>(functions).run();
  }

  constructor(private functions: Array<FunctionPair<R> | Executable<R>>) {}

  run(): Promise<Array<R>> {
    const tasks = this.functions.map(f => new Task(f));

    const promises = tasks.map(t => t.run().promise);

    return Promise.all(promises);
  }
}
