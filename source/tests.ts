import 'babel-polyfill';

import 'core-js/es6';
import 'core-js/es7/reflect';

const testContext = (<any>require).context('.', true, /^(.(?!tests\.))*ts$/);

testContext('./index.ts');

testContext.keys().forEach(
  key => {
    if (/\.test\.ts$/.test(key)) {
      testContext(key);
    }
  });
