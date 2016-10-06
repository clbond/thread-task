import 'babel-polyfill';
import 'core-js/es6';
import 'core-js/es7/reflect';
import 'ts-helpers';

const looseRequire: {context?: Function} = require;

const testContext = looseRequire.context('./', true, /^(.(?!tests))*\.ts$/);

testContext('./index.ts');

testContext.keys().forEach(
  key => {
    if (/\.test\.ts$/.test(key)) {
      testContext(key);
    }
  });
