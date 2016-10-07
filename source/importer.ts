const rawCode = require('raw-loader!babel-loader?comments=false&compact=true&minified=true!./serialize.ts');

export const serializationCode = () => {
  return `
    var exports = {};
    
    ${rawCode};
  `;
};
