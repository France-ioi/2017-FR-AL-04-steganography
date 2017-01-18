
const express = require('express');
const path = require('path');
const alkindiTaskServer = require('alkindi-task-lib/server');

 const outRootDir = process.env.OUT_DIR || path.resolve(path.dirname(__dirname), 'generated');

alkindiTaskServer({
  webpackConfig: require('../webpack.config.js'),
  generate: require('./generate'),
  serverHook: function (app) {
    app.use('/images', express.static(path.resolve(path.dirname(__dirname), 'images')));
    app.use('/generated', express.static(outRootDir));
  }
});

function gradeAnswer (full_task, task, answer, callback) {
  const {secret} = full_task;
  var answerNoSpaces = answer.replace(/[^1-9]+/g, '');
  const is_full_solution = answerNoSpaces === secret;
  const is_solution = is_full_solution;
  const feedback = is_full_solution;
  const score = is_full_solution ? 50 : 0;
  callback(null, {
    feedback, score, is_solution, is_full_solution
  });
}
