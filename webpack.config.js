'use strict';

const path = require('path');

const loaders = require('./webpack/loaders');

module.exports = {
  entry: path.join(__dirname, 'source', 'index.ts'),

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: '/',
    sourceMapFilename: '[name].js.map',
    chunkFilename: '[id].chunk.js',
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
