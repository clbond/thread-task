import {Task} from './task';
import {FunctionPair} from './function-pair';

describe('Task', () => {
  it('factory should not throw', () => {
    expect(() => {
      new Task(() => {});
    }).not.toThrow();
  });

  it('should be able to run a basic task with constructor and run',
    done => {
      new Task(() => {}).run().promise.then(done);
    });

  it('should be able to run a basic task with run()',
    done => {
      Task.run(() => {
        console.log('I am doing this from my task!');
        return 1;
      })
      .promise.then(taskResult => {
        expect(taskResult).toBe(1);
        done();
      });
    });

  it('should be able to pass arguments to task',
    done => {
      const {pipe} = Task.run(
        (pipe, foo, bar) => {
          pipe.postMessage({
            argsCorrect: foo === 'foo' && bar === 'bar',
          });
        },
        'foo',
        'bar');

      pipe.subscribe(m => {
        expect(m.argsCorrect).toBe(true);
        done();
      })
    });

  it('should be able to run an asynchronous operation using a Promise in the task',
    done => {
      const {promise} = Task.run(() => {
        return new Promise(resolve => {
          setTimeout(resolve, 500);
        });
      });

      promise.then(() => done());
    });

  it('should be able to return complex object types across thread boundaries, intact',
    done => {
      Task.run(() => {
        const complexObject = {a: 1, b: {c: 'foobar'}};

        Object.setPrototypeOf(complexObject, {base: () => 'return value!'});

        return complexObject;
      })
      .promise.then((taskResult: any) => {
        // this was returned from our worker
        expect(taskResult.a).toBe(1);
        expect(taskResult.b.c).toBe('foobar');
        expect(taskResult.hasOwnProperty('base')).toBe(false);
        expect(typeof Object.getPrototypeOf(taskResult).base).toBe('function');
        expect(taskResult.base()).toBe('return value!');

        done();
      });
    });

  it('should be able to pass complex arguments to across thread boundaries to tasks',
   done => {
     const argument = {myArgument: 'foo'};

     Object.setPrototypeOf(argument, {protofunc: () => 'foobar'});

     const f = function (passedArgument) {
       // this is running inside of a worker
       if (passedArgument.protofunc() !== 'foobar') {
         throw new Error('Invalid value!');
       }
     };

     Task.run(f, argument).promise.then(done);
   });

   it('should be able send a message from a task to the application using a pipe',
     done => {
       const task = Task.run(pipe => {
         pipe.postMessage({hello: 'world'});
       });

       task.pipe.subscribe(
         message => {
           expect(message.hello).toBe('world');
           done();
         });
     });

    it('should be able to send a message from thie application to a task through a pipe',
      done => {
        const task = Task.run(pipe => {
          return new Promise(resolve => {
            pipe.subscribe(message => {
              pipe.postMessage({gotTheMessageSon: true});
              resolve();
            })
          });
        });

        task.pipe.subscribe(message => {
          expect(message.gotTheMessageSon).toBe(true);
        });

        task.pipe.postMessage({test: 'foo'});

        task.promise.then(done);
      });

    it('should be able to pass a complex class instance through a Pipe and call one of its methods',
       done => {
         const task = Task.run(pipe => {
           class MyClass {
             private instanceVariable = 10;

             public myFunction() {
               return `My instance variable is ${this.instanceVariable}`;
             }
           }

           pipe.postMessage(new MyClass());
         });

         task.pipe.subscribe(
           myClassInstance => {
             const returnValue = myClassInstance.myFunction();
             expect(returnValue).toBe('My instance variable is 10');
             done();
           });
       });
});
