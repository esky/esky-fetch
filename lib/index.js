'use strict';

exports.__esModule = true;
exports.default = undefined;

var _lib = require('./lib');

Object.defineProperty(exports, 'default', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_lib).default;
  }
});

require('isomorphic-fetch');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }