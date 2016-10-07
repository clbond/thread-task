## thread-task

What is `thread-task`? In essence, it is a multithreaded task library for web
applications. "But web applications are single-threaded," you say! Indeed they
are. But modern browsers implement something called a _web worker_. The issue
with using web workers is that the API is silly and workers in general are
very limited in that they can only pass very basic back and forth to each other.
Using `thread-task`, you get a `Task` object that is much closer to something
like [Task](https://msdn.microsoft.com/en-us/library/system.threading.tasks.task(v=vs.110).aspx)
from the .NET runtime: you provide a function that represents a task that needs
to be run in the background on another thread, and when that task finishes,
it gives the result back to your main application. But it does so in a way that
lets you send complex objects and data structures -- much more complex than
could be done using plain web workers. It also provides a nice `Pipe` class
that allows you to communicate between your worker thread and your main
application thread in a way that is simple and understandable.

Another key difference is that unlike with a web worker, you can pass complex
argument objects to your `Task` and it will have access to those arguments when
it executes your task.

Putting all of this together, it allows you to move expensive operations into
a concurrent thread in a way that is dead simple, and in a way that lets you
communicate using your real state objects, no matter how complex they are!

Note also that the library supports having long-running background threads.
You can make use of such threads using the `Pipe` system to transmit complex
data types back and forth from your background thread and your primary
application thread. When you have some work that needs to be done, just pipe
it over and wait for the response.

## Usage

Let's look first at the simplest, most contrived possible use of `Task`:

```typescript
  const {promise} = Task.run(() => {
    console.log('I am doing this from my task!');
    return 1;
  });

  promise.then(taskResult => {
    console.log('The result from the background task was: ', taskResult);
  });
```

This will produce this output in the browser console:

```
I am doing this from my task!
The result from the background task was: 1
```

This is not all that useful. First off, it is not a realistic use-case because
we are not passing any data to the task. It's unlikely that your application
will be able to run background operations without any context or arguments.
So let's get a bit more creative with this, and create a task that accepts
a `multiply` function that will multiply the value it is given by 10. But this
logic originates in the main application and is provided to your task as an
argument. Then we convert that number to a string representation of a base16
number:

```typescript
  const myTask = (multiply: (value: number) => number) => multiply(500);

  const result = await Task.run(myTask,
    function (v) { // multiply function
      return v * 2;
    });

  console.log('Task returned: ', result);
```

This would produce this message in this console:

```
Task returned: 1000
```

Or, let's say we have an even more complex operation that first has to request
some data from a server and then process it inside of the worker thread:

```typescript
  const myTask = (dataUri: string) => {
    return fetch(dataUri)
      .then(r => r.json())
      .then(j => {
        return j.map(v => {
          for (let j = 0; j < 10000; ++j) {
            // simulate a CPU-hog operation
          }

          return v * 10;
        });
      });
  };

  const taskResult = await Task.run(myTask, 'http://foobar.com/test-data');

  console.log('Result: ', taskResult);
```

If our service were returning a JSON document of `[0, 1, 2]`, this would
produce in the console:

```
Result: [0, 10, 20]
```

## Communication

So far so good. What if we have an even more complex use case where we want to
pass data to and from the `Task` while it is running in the background? No
problem; `thread-task` includes the concept of a `Pipe` that allows you to do
this. Note that while web workers already have a message-passing API that you
can use without `thread-task`, that message-passing system only allows you to
transfer extremely simple JSON objects. If your object has a circular reference,
or a prototype other than `Object.prototype`, or if it contains some instance
method functions, you cannot pass these to a web worker without `task-thread`.
With `task-thread`, you can pass objects of absolutely **any** complexity through:

* A communication `Pipe` object
* Task argument list
* Task return value / result

The only limitation here is that if you are passing functions to a task or from
a task, it will work, but your functions absolutely **cannot** reference closure
variables of any kind unless you know for a fact that they will be available in
the separate worker thread context (which they almost never will be). So you can
pass a function, but do not rely on closure values inside that function if you
expect to be passing it to a `Task` or receiving it from a `Task`.

### Communication example

This example nicely illustrates the library's ability to transmit complex values
back and forth, including class instances, through the pipe system. This would
be impossible just using plain web workers without `thread-task`. This code is
taken from the `Task` unit tests in `task.test.ts`:

```typescript
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
```

Or this test, which does something similar but passes the structure in the
opposite direction, modifies the structure inside the task, and passes it
back to the application:

```typescript
  it('should be able to give a complex data type to a Task and get it back in a return value',
    done => {
      class UselessDataStructure {
        private elements = new Set<string>();

        add(value: string) {
          this.elements.add(value);
        }

        size(): number {
          return this.elements.size;
        }
      }

      const run = async () => {
        const structure = new UselessDataStructure();

        const fromTask = await Task.run<UselessDataStructure>(
          struct => {
            struct.add('a');
            struct.add('b');
            struct.add('c');
            return struct;
          },
          structure).promise;

        expect(fromTask.size()).toBe(3);

        done();
      };

      run();
    });
```