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
      new Task(() => {}).run().then(done);
    });

  it('should be able to run a basic task with run()',
    done => {
      Task.run(() => {
        console.log('I am doing this from my task!');
        return 1;
      })
      .then(taskResult => {
        expect(taskResult).toBe(1);
        done();
      });
    });

  it('should be able to return complex object types across thread boundaries, intact',
    done => {
      Task.run(() => {
        const complexObject = {a: 1, b: {c: 'foobar'}};

        Object.setPrototypeOf(complexObject, {base: () => 'return value!'});

        return complexObject;
      })
      .then((taskResult: any) => {
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

     const f = (passedArgument): void => {
       // this is running inside of a worker
       if (passedArgument.protofunc() !== 'foobar') {
         throw new Error('Invalid value!');
       }
     };

     Task.run(new FunctionPair(f, argument)).then(done);
   });
});
