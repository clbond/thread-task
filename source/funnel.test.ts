import {Funnel} from './funnel';

import {FunctionPair} from './function-pair';

describe('Funnel', () => {
  it('should be able to pass arguments to funneled/threaded tasks',
     done => {
       const functions = [];
       for (let i = 0; i < 10; ++i) {
         functions.push(
           new FunctionPair(
             (passedArgument) => {
               console.log(`Executing thread ${passedArgument}`);
               return passedArgument;
             },
             i));
       }

       Funnel.run(functions).then(
         results => {
           expect(results.length).toBe(10);

           for (let i = 0; i < results.length; ++i) {
             expect(results[i]).toBe(i);
           }

           done();
         });
     });

  it('should be able to spawn 100 threaded tasks and collect the results',
    done => {
      const functions = [];
      for (let i = 0; i < 5; ++i) {
        functions.push(() => {
          return 1;
        });
      }

      Funnel.run(functions).then(
        results => {
          expect(results.length).toBe(5);

          for (let i = 0; i < results.length; ++i) {
            expect(results[i]).toBe(1);
          }

          done();
        });
    });
});
