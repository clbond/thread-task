export class FunctionPair<Result> {
  public args: Array<any>;

  constructor(public func: (args?) => Result, ...args: Array<any>) {
    this.args = args;
  }
}
