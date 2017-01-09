function unaryNegate(v1, channel) {
  return 255 - v1;
}

function unaryExtractChannel(exChannel) {
  return function(v1, channel) {
    if (channel == exChannel) {
        return v1;
    }
    return 0;
  }
}

function binarySubtract(v1, v2, channel) {
  let v = v1 - v2;
  if (v < 0) {
    v = 0;
  }
  return v;
}

function binaryMean(v1, v2, channel) {
  return (v1 + v2) / 2;
}

const operatorToFunc = {
  mean: binaryMean,
  subtract: binarySubtract,
  negate: unaryNegate,
  extractRed: unaryExtractChannel(0),
  extractGreen: unaryExtractChannel(1),
  extractBlue: unaryExtractChannel(2)
};

export function applyUnary(sourceData, destData, operation) {
  let func = operatorToFunc[operation];
  for (var iPix = 0; iPix < sourceData.data.length; iPix++) {
    var v = 255;
    if (iPix % 4 != 3) {
      var v1 = sourceData.data[iPix];
      var v = func(v1, iPix % 4);
    }
    destData.data[iPix] = v;
  }
};

export function applyBinary(sourceData1, sourceData2, destData, operation) {
  let func = operatorToFunc[operation];
  for (var iPix = 0; iPix < sourceData1.data.length; iPix++) {
    var v = 255;
    if (iPix % 4 != 3) {
        var v1 = sourceData1.data[iPix];
        var v2 = sourceData2.data[iPix];
        var v = func(v1, v2, iPix % 4);
    }
    destData.data[iPix] = v;
  }
};
