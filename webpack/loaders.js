exports.ts = {
  test: /\.ts$/,
  loader: 'awesome-typescript-loader',
  query: {
    babelCore: 'babel-core',
  },
};

exports.istanbulInstrumenter = {
  enforce: 'post',
  test: /^(.(?!(test|serialize)))*\.ts$/,
  loader: 'istanbul-instrumenter-loader',
};
