import {TaskBlob} from './blob';

import {serializationCode} from './importer';

import {
  deserialize,
  serialize,
} from './serialize';

import {FunctionPair} from './function-pair';

export type Executable<T> = FunctionPair<T> | (() => T);

/// A task which runs in a separate thread and produces a simple return value of some sort
export class Task<R> {
  static run<Result>(func: Executable<Result>): Promise<Result> {
    return new Task<Result>(func).run();
  }

  constructor(private func: Executable<R>) {}

  run(): Promise<R> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(this.wrap());

      worker.onmessage = message => {
        const data = deserialize(message.data);

        resolve(data);
      };

      worker.onerror = (error: Event) => {
        reject(error);
      };

      worker.postMessage({start: true});
    });
  }

  private wrap(): string {
    let pair: FunctionPair<R>;

    if (this.func instanceof FunctionPair === false) {
      pair = new FunctionPair(<(args?) => R> this.func);
    }
    else {
      pair = <FunctionPair<R>> <any> this.func;
    }

    const functionString = pair.func.toString();

    const wrapped = `
      ${serializationCode()};
      
      const args = ${pair.args ? JSON.stringify(pair.args.map(a => serialize(a))) : []};
      
      var f = ${functionString};
      
      const deserializedArgs =
        args.map(function(a) {
          return exports.deserialize(a);
        });
      
      var func = Function.bind.apply(f, [null].concat(deserializedArgs));
     
      onmessage = function (m) { // start
        if (m.data == null || m.data.start !== true) {
          throw new Error('Received unknown message');
        }

        var returnValue = func();
        
        if (returnValue) {
          if (typeof returnValue.then === 'function') {
            returnValue.then(
              function (promiseValue) {
                postMessage(exports.serialize(promiseValue));
              });
            return;
          }
        }
        
        postMessage(exports.serialize(returnValue));
      };
    `;

    return TaskBlob.encode(wrapped);
  }
}
