const Jimp = require("jimp");
const path = require("path");
const url = require('url');
const seedrandom = require('seedrandom');
const crypto = require('crypto');
const mkdirp = require('mkdirp');

module.exports = generate;

const outRootDir = process.env.OUT_DIR || path.resolve(path.dirname(__dirname), 'generated');

var attemptedCombinations = [
   [2, 5, 3, 2],
   [3, 7, 2, 9],
   [4, 1, 5, 2],
   [5, 4, 6, 9],
   [6, 7, 5, 9],
   [7, 0, 9, 4],
   [8, 3, 0, 6],
   [9, 4, 7, 2]
];

function testAttemptedCombinations() {
   var digitBars = [
      [1,1,1,0,1,1,1], // 0
      [0,0,1,0,0,1,0], // 1
      [1,0,1,1,1,0,1], // 2
      [1,0,1,1,0,1,1], // 3
      [0,1,1,1,0,1,0], // 4
      [1,1,0,1,0,1,1], // 5
      [1,1,0,1,1,1,1], // 6
      [1,1,1,0,0,1,0], // 7
      [1,1,1,1,1,1,1], // 8
      [1,1,1,1,0,1,1]  // 9
   ];

   var combinationValid = function(digits) {
      for (var iBar = 0; iBar < 7; iBar++) {
         var fullBars = 0;
         var mainDigit = digits[0];
         for (var iDigit = 1; iDigit < digits.length; iDigit++) {
            var digit = digits[iDigit];
            fullBars += digitBars[digit][iBar];
         }
         if (digitBars[mainDigit][iBar] == 0) {
            if (fullBars > 2) {
               console.error("too many of bar " + iBar);
               return false;
            }
         }
      }
      return true;
   }

   for (var iCombi = 0; iCombi < attemptedCombinations.length; iCombi++) {
      if (!combinationValid(attemptedCombinations[iCombi])) {
         console.error("Invalid combi " + iCombi);
      }
   }
};

function genPermutation(rng) {
   var perm = [0, 1, 2, 3, 4, 5, 6, 7];
   for (var iChoice = 0; iChoice < perm.length; iChoice++) {
      var pick = Math.trunc(rng() * (perm.length - iChoice) + iChoice);
      var tmp = perm[pick];
      perm[pick] = perm[iChoice];
      perm[iChoice] = tmp;
   }
   return perm;
}

function mergeImages(rng, img1, img2, result, ratio) {
   var width = img1.bitmap.width;
   var height = img1.bitmap.height;

   for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
         var pixel1 = Jimp.intToRGBA(img2.getPixelColor(x, y));
         var pixel2 = Jimp.intToRGBA(img1.getPixelColor(x, y));
         var finalRatio = ratio;
         if (pixel2.r == 255) {
            finalRatio = 1;
            pixel2.r = 0;
         } else {
            finalRatio = ratio;
            if (rng() > 0.5) {
               pixel2.r = 5;
            } else {
               pixel2.r = -5;
            }
         }
         var r = Math.min(255, Math.max(0, pixel1.r + pixel2.r));
         var g = pixel1.g;
         var b = pixel1.b;
         result.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
      }
   }
}

function genMessages(rng, nbMessages) {
    var perm = genPermutation(rng);
    var messages = [];
    for (var iMessage = 0; iMessage < nbMessages; iMessage++) {
       messages.push("");
    }
    for (var iDigit = 0; iDigit < perm.length; iDigit++) {
       for (var iMessage = 0; iMessage < nbMessages; iMessage++) {
          messages[iMessage] += attemptedCombinations[perm[iDigit]][iMessage];
       }
    }
    console.log("messages generated " + messages.join());
    return messages;
}

/* Returns a promise that resolves after all files has been written to outDir
   with an array containing the filenames. */
function genMessageImages(rng, outDir, messages, messageImages, keyImage, font) {
   var ratio = 0.95;
   return Promise.all(messages.map((message, iMessage) => new Promise(function (resolve, reject) {
      const messageImage = messageImages[iMessage];
      messageImage.print(font, 20, 200, message);
      mergeImages(rng, messageImage, keyImage, messageImage, ratio);
      const filename = `message${iMessage + 1}.png`;
      const filepath = path.resolve(outDir, filename);
      messageImage.write(filepath, function (err) {
         if (err) return reject(err);
         resolve(filename);
      });
   })));
}

function genImages1(rng, outDir, outBase, cb) {
   Jimp.read("images/blank.png").catch(cb).then(function (messageImage1) {
   Jimp.read("images/key.png").catch(cb).then(function (keyImage) {
      Jimp.loadFont("fonts/font.fnt").catch(cb).then(function (font) {
      try {
         var messageImages = [messageImage1];
         var messages = genMessages(rng, 1);
         genMessageImages(rng, outDir, messages, messageImages, keyImage, font).catch(cb).then(function (filenames) {
            const imageURLs = filenames.map(fn => url.resolve(outBase, fn));
            imageURLs.unshift("images/key.png");
            cb(null, {
               secret: messages[0],
               imagesURLs: imageURLs
            });
         });
      } catch(err) {
         cb(err);
      }
   });
   });
   });
}

function genImages2(rng, outDir, outBase, cb) {
   Jimp.read("images/blank.png").catch(cb).then(function (messageImage1) {
   Jimp.read("images/blank.png").catch(cb).then(function (messageImage2) {
   Jimp.read("images/blank.png").catch(cb).then(function (messageImage3) {
   Jimp.read("images/blank.png").catch(cb).then(function (messageImage4) {
   Jimp.read("images/key.png").catch(cb).then(function (keyImage) {
   Jimp.loadFont("fonts/font.fnt").catch(cb).then(function (font) {
      try {
         var messageImages = [messageImage1, messageImage2, messageImage3, messageImage4];
         var messages = genMessages(rng, 4);
         genMessageImages(rng, outDir, messages, messageImages, keyImage, font).catch(cb).then(function (filenames) {
            const imageURLs = filenames.map(fn => url.resolve(outBase, fn));
            cb(null, {
               secret: messages[0],
               imagesURLs: imageURLs
            });
         });
      } catch (err) {
         cb(err);
      }
   });
   });
   });
   });
   });
   });
}

function getUserTask (full_task) {
   var task = {
      version: full_task.version,
      originalImagesURLs: full_task.imagesURLs
   };
   return task;
}

function generate (params, seed, callback) {

   // Temporary, alkindi-task-lib should pass sensible values.
   params = params || {};
   seed = seed || "";

   const rng = seedrandom(seed);
   const hash = crypto.createHash('sha1').update(seed, 'utf8').digest('hex');
   const outDir = path.join(outRootDir, hash.substr(0, 2), hash.substring(2));
   const outBase = ["generated", hash.substr(0, 2), hash.substring(2), ''].join('/');

   mkdirp(outDir, function (err) {
      if (err) return callback(err);
      switch (params.version) {
         case 1: genImages1(rng, outDir, outBase, genImagesDone); break;
         case 2: genImages2(rng, outDir, outBase, genImagesDone); break;
         default: callback('bad version'); break;
      }
   });

   function genImagesDone(err, full_task) {
      if (err) return callback(err);
      full_task.version = params.version;
      callback(null, {
         full_task,
         task: getUserTask(full_task)
      });
   }
};

// For development, crash on unhandled promise rejection to get a stack trace.
if (process.env.NODE_ENV !== "production") {
   process.on('unhandledRejection', function onError (err) {
      throw err;
   });
}

// Run this module directly with node to test it.
if (require.main === module) {
   generate({version: 2}, 42, function (err, result) {
      if (err) throw err;
      console.log(result);
   });
}
