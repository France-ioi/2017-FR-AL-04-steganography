
module.exports = function () {
  const task = {
    originalImagesURLs: [
      "test-images/abstract.jpg",
      "test-images/hidden.png",
      "test-images/hidden2.png",
      "test-images/hidden3.png",
      "test-images/red.png"
    ],
    hints: {}
  };
  const full_task = Object.assign({/*...*/}, task);
  return {task, full_task};
};
