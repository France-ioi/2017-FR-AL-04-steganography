
const express = require('express');
const path = require('path');
const alkindiTaskServer = require('alkindi-task-lib/server');

 const outRootDir = process.env.OUT_DIR || path.resolve(path.dirname(__dirname), 'generated');

alkindiTaskServer({
  webpackConfig: require('../webpack.config.js'),
  generate: require('./generate'),
  serverHook: function (app) {
    app.use('/test-images', express.static(path.resolve(path.dirname(__dirname), 'test-images')));
    app.use('/generated', express.static(outRootDir));
  }
});

