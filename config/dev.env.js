var merge = require('webpack-merge')
var prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  // SOCKET_HOST: '"http://172.18.20.97"',
  SOCKET_HOST: '"http://localhost"',
  SOCKET_PORT: '"8080"',
  MOCK: 0
})
