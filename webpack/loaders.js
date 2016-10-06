exports.ts = {
  test: /\.ts$/,
  loader: 'awesome-typescript-loader',
  query: {
    babelCore: 'babel-core',
    babelOptions: {
      presets: ['es2015'],
    },
  },
};

exports.istanbulInstrumenter = {
  enforce: 'pre',
  test: /^(.(?!\tests\.))*ts$/,
  loader: 'istanbul-instrumenter-loader',
};
