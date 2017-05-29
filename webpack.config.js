'use strict';

const path = require('path');

const loaders = require('./webpack/loaders');

module.exports = {
  entry: path.join(__dirname, 'source', 'index.ts'),

  output: {
    filename: 'dist/[name].js',
    sourceMapFilename: 'dist/[name].js.map',
    library: 'main',
    libraryTarget: 'umd',
  },

  devtool: process.env.NODE_ENV === 'production' ?
    'source-map' :
    'inline-source-map',

  resolve: {
    extensions: [
      '.webpack.js',
      '.web.js',
      '.ts',
      '.js'
    ],
  },

  plugins: require('./webpack/plugins'),

  module: {
    rules: [
      loaders.ts,
    ],
  },
};
