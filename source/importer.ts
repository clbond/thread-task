const rawCode = require('raw-loader!./serialize.ts');

export const serializationCode = () => {
  return `
    var exports = {};
    
    ${rawCode};
  `;
};
