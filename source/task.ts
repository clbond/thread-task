import {TaskBlob} from './blob';

import {
  pipeCode,
  serializationCode,
} from './importer';

import {
  deserialize,
  serialize,
} from './serialize';

import {FunctionPair} from './function-pair';

import {Pipe, PipeImpl} from './pipe';

export type Executable<T> = FunctionPair<T> | ((pipe?: Pipe, ...args) => T);

export interface TaskResult<R> {
  /// A promise that will be resolved when the task completes
  promise: Promise<R>;

  /// Thread communication pipe
  pipe: Pipe;
}

/// A task which runs in a separate thread and produces a value of type {@link R}
export class Task<R> {
  static run<Result>(func: Executable<Result>): TaskResult<Result> {
    return new Task<Result>(func).run();
  }

  constructor(private func: Executable<R>) {}

  run(): TaskResult<R> {
    const pipe = new PipeImpl();

    const promise = new Promise((resolve, reject) => {
      const worker = new Worker(this.wrap());

      worker.onmessage = message => {
        try {
          resolve(deserialize(message.data));
        } catch (e) {
          reject(new Error(`Failed to deserialize return result: ${e.stack}`));
        }
      };

      worker.onerror = (error: Event) => {
        reject(error);
      };
    });

    return {promise, pipe};
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

    const serializedArgs = pair.args
      ? JSON.stringify(pair.args.map(a => serialize(a)))
      : [];

    const wrapped = `
      const imports = {};

      (function() {
        const exports = {};
        ${serializationCode};

        Object.assign(imports, {serialization: exports});
      })();

      (function() {
        const exports = {};
        ${pipeCode};

        Object.assign(imports, {pipe: exports});
      })();

      var executor = ${functionString};

      const deserializedArgs =
        (${serializedArgs}).map(function(a) {
          return imports.serialization.deserialize(a);
        });

      const pipe = new imports.pipe.PipeImpl();

      if (deserializedArgs.length < executor.length) {
        deserializedArgs.unshift(pipe);
      }

      var func = Function.bind.apply(executor, [null].concat(deserializedArgs));

      onmessage = function (m) {
        pipe.postIncomingMessage(imports.serialization.deserialize(m.data));
      };

      pipe.subscribeOutgoing(
        function (message) {
          postMessage(imports.serialization.serialize(message));
        });

      var returnValue = func();
      if (returnValue && typeof returnValue.then === 'function') {
        returnValue.then(
          function (promiseValue) {
            postMessage(imports.serialization.serialize(promiseValue));
          });
      }
      else {
        postMessage(imports.serialization.serialize(returnValue));
      }
    `;

    return TaskBlob.encode(wrapped);
  }
}
