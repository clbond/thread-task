import {TaskBlob} from './blob';
import {serializationCode} from './importer';
import {deserialize} from './serialize';

/// A task which runs in a separate thread and produces a simple return value of some sort
export class Task<R> {
  static run<Result>(func: (arg?) => Result): Promise<Result> {
    return new Task<Result>(func).run();
  }

  constructor(private func: (arg?) => R) {}

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
    const functionString = this.func.toString();

    const wrapped = `
      ${serializationCode()};
      
      var func = ${functionString};
     
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
