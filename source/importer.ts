// NOTE: This code is to import the dependencies that thread-task requires in order
// to bootstrap individual workers. This code is serialized and blobbed and then run
// inside the context of a worker. The actual work code is sent through other means.

export const serializationCode =
  require('raw-loader!babel-loader?comments=false&compact=false&minified=false!./serialize.ts');

export const pipeCode =
  require('raw-loader!babel-loader?comments=false&compact=true&minified=true!./pipe.ts');
