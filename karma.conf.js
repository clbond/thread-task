const loaders = require('./webpack/loaders');
const plugins = require('./webpack/plugins');

const runConfiguration = config => {
  if (config.singleRun) {
    return {
      coverage: ['coverage'],
      loglevel: config.LOG_INFO,
    };
  }
  return {
    coverage: [],
    loglevel: config.LOG_DEBUG,
  };
};

module.exports = (config) => {
  const {coverage, loglevel} = runConfiguration(config);

  config.set({
    frameworks: [
      'jasmine',
      'chai',
    ],

    plugins: [
      'karma-jasmine',
      'karma-chai',
      'karma-sourcemap-writer',
      'karma-sourcemap-loader',
      'karma-webpack',
      'karma-coverage',
      'karma-remap-istanbul',
      'karma-spec-reporter',
      'karma-chrome-launcher',
      'karma-transform-path-preprocessor',
    ],

    files: [
      './source/tests.ts',
      {
        pattern: '**/*.map',
        served: true,
        included: false,
        watched: true,
      },
    ],

    preprocessors: {
      '**/*.ts': [
        'webpack',
        'sourcemap',
        'transformPath',
      ],
      '**/!(*.test|tests.*).(ts|js)': [
        'sourcemap',
      ],
    },

    transformPathPreprocessor: {
      transformer: path => path.replace(/\.ts$/, '.js'),
    },

    webpack: {
      plugins,
      entry: './source/tests.ts',
      devtool: 'inline-source-map',
      resolve: {
        extensions: [
          '.webpack.js',
          '.web.js',
          '.js',
          '.ts',
        ],
      },
      module: {
        rules: combinedLoaders(),
      },
    },

    webpackServer: { noInfo: true },

    reporters: ['spec']
      .concat(coverage)
      .concat(coverage.length > 0 ? ['karma-remap-istanbul'] : []),

    remapIstanbulReporter: {
      src: 'coverage/chrome/coverage-final.json',
      reports: {
        html: 'coverage',
      },
    },

    coverageReporter: {
      reporters: [
        { type: 'json' },
      ],
      subdir: b => b.toLowerCase().split(/[ /-]/)[0],
    },

    logLevel: loglevel, 

    autoWatch: config.singleRun === false,

    browsers: [
      'Chrome',
    ],
  });
};

function combinedLoaders() {
  return Object.keys(loaders).reduce(function reduce(aggregate, k) {
    switch (k) {
    case 'istanbulInstrumenter':
      return aggregate;
    case 'ts':
      return aggregate.concat([ // force inline source maps
        Object.assign(loaders[k],
          { query: { babelOptions: { sourceMaps: 'both' }, skipDeclarationFilesCheck: true } })]);
    default:
      return aggregate.concat([loaders[k]]);
    }
  },
  []);
}

