import {Executable, Task} from './task';

/// Run multiple asynchronous tasks on separate threads and collect the
/// results into a single promise. Each task must of course be completely
/// independent and should return a value of type R.
export class Funnel<R> {
  public static run<T>(functions: Array<Executable<T>>) {
    return new Funnel<T>(functions).run();
  }

  constructor(private functions: Array<Executable<R>>) {}

  run(): Promise<Array<R>> {
    const tasks = this.functions.map(f => new Task(f));

    const promises = tasks.map(t => t.run());

    return Promise.all(promises);
  }
}
