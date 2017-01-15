
const express = require('express');
const path = require('path');
const alkindiTaskServer = require('alkindi-task-lib/server');

alkindiTaskServer({
  webpackConfig: require('../webpack.config.js'),
  generate: require('./generate'),
  serverHook: function (app) {
    app.use('/test-images', express.static(path.resolve(path.dirname(__dirname), 'test-images')));
  }
});

