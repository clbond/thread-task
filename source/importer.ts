export const serializationCode =
  require('raw-loader!babel-loader?comments=false&compact=true&minified=true!./serialize.ts');

export const pipeCode =
  require('raw-loader!babel-loader?comments=false&compact=false&minified=false!./pipe.ts');
