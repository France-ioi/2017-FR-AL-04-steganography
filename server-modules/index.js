const path = require("path");
const generate = require("./generate");
const outRootDir =
  process.env.OUT_DIR || path.resolve(path.dirname(__dirname), "generated");

module.exports.config = {
  cache_task_data: false
};

module.exports.taskData = async function (args, callback) {
  const {publicData} = await generateTaskData(
    args.task.params,
    args.task.random_seed
  );
  console.log("publicData :", publicData);
  callback(null, publicData);
};

module.exports.requestHint = function (args, callback) {
  callback(new Error("no hints"));
};

module.exports.gradeAnswer = async function (args, task_data, callback) {
  try {
    const {privateData} = await generateTaskData(
      args.task.params,
      args.task.random_seed
    );
    const answer = JSON.parse(args.answer.value);
    const {secret} = privateData;
    var answerNoSpaces = answer.replace(/[^1-9]+/g, "");
    const is_full_solution = answerNoSpaces === secret;
    const score = is_full_solution ? 50 : 0;
    let message = "";
    if (is_full_solution) {
      message = " Votre réponse est correcte.";
    } else {
      message = " Votre réponse est incorrecte.";
    }
    callback(null, {
      score,
      message
    });
  } catch (error) {
    callback(error, null);
  }
};

/**
 * task methods
 */

function generateTaskData (params, random_seed) {
  return new Promise(function (resolve, reject) {
    const callback = function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    };
    generate(params, random_seed, callback);
  });
}
