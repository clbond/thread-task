exports.ts = {
  test: /\.ts$/,
  loader: 'ts-loader',
};

exports.istanbulInstrumenter = {
  enforce: 'post',
  test: /^(.(?!(test|serialize)))*\.ts$/,
  loader: 'istanbul-instrumenter-loader',
};
