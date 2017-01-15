var Jimp = require("jimp");
var seedrandom = require('seedrandom');

module.exports = generate;

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
         } else {
            finalRatio = ratio;
            if (rng() > 0.5) {
               pixel2.r = 255 - pixel2.r;
            }
         }
         var r = Math.round(pixel1.r * finalRatio + pixel2.r * (1 - finalRatio));
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

function genMessageImages(rng, messages, messageImages, keyImage, font) {
   var ratio = 0.95;

   for (var iMessage = 0; iMessage < messages.length; iMessage++) {
      messageImages[iMessage].print(font, 20, 200, messages[iMessage]);
      mergeImages(rng, messageImages[iMessage], keyImage, messageImages[iMessage], ratio);
      messageImages[iMessage].write("message" + (iMessage + 1) + ".png");
   }
}

function genImages1(rng, done) {
   Jimp.read("images/blank.png").catch(done).then(function (messageImage1) {
   Jimp.read("images/key.png").catch(done).then(function (keyImage) {
      console.error("loading font");
      Jimp.loadFont("fonts/font.fnt").catch(done).then(function (font) {
      try {
         console.error("font loaded");
         var messageImages = [messageImage1];
         var messages = genMessages(rng, 1);
         genMessageImages(rng, messages, messageImages, keyImage, font);

         done(null, {
            secret: messages[0],
            imagesURLs: ["images/key.png", "messageImage1.png"]
         });
      } catch(err) {
         done(err);
      }
   });
   });
   });
}

function genImages2(rng, done) {
   Jimp.read("images/blank.png").catch(done).then(function (messageImage1) {
   Jimp.read("images/blank.png").catch(done).then(function (messageImage2) {
   Jimp.read("images/blank.png").catch(done).then(function (messageImage3) {
   Jimp.read("images/blank.png").catch(done).then(function (messageImage4) {
   Jimp.read("images/key.png").catch(done).then(function (keyImage) {
   console.error("loading font");
   Jimp.loadFont("fonts/font.fnt").catch(done).then(function (font) {
      try {
         console.error("font loaded");
         var messageImages = [messageImage1, messageImage2, messageImage3, messageImage4];
         var messages = genMessages(rng, 4);
         genMessageImages(rng, messages, messageImages, keyImage, font);

         done(null, {
            secret: messages[0],
            imagesURLs: [
               "messageImage1.png",
               "messageImage2.png",
               "messageImage3.png",
               "messageImage4.png"
            ]
         });
      } catch (err) {
         done(err);
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
      imagesURLs: full_task.imagesURLs
   };
   return task;
}

function generate (params, seed, callback) {
   var rng = seedrandom(seed);

   const task = {
      originalImagesURLs: [],
      hints: {}
   };

   if (params.version == 1) {
      genImages1(rng, genImagesDone);
   } else {
      genImages2(rng, genImagesDone);
   }

   function genImagesDone(err, full_task) {
      callback(null, {
         full_task,
         task: getUserTask(full_task)
      });
   }
};

// Run this module directly with node to test it.
if (require.main === module) {
   generate({version: 2}, 42, function (err, result) {
      if (err) throw err;
      console.log(result);
   });
}
