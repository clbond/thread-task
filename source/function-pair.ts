import {Pipe} from './pipe';

export class FunctionPair<Result> {
  public args: Array<any>;

  constructor(public func: (pipe?: Pipe, ...args) => Result, ...args: Array<any>) {
    this.args = args;
  }
}
