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
        rules: Object.keys(loaders).map(k => loaders[k])
      },
    },

    webpackServer: { noInfo: true },

    reporters: ['spec'].concat(coverage),

    remapIstanbulReporter: {
      src: 'coverage/chrome/coverage-final.json',
      reports: {
        html: 'coverage',
      },
    },

    coverageReporter: {
      reporters: [
        {type: 'json'},
        {type: 'html'},
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
