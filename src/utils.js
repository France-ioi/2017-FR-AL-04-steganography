
import {OPERATIONS} from './constants';

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

function applyUnary(sourceData, destData, operation) {
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

function applyBinary(sourceData1, sourceData2, destData, operation) {
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

export function applyOperation(name, args, destData) {
  const numParams = args.length;
  if (numParams === 1) {
    return applyUnary(args[0], destData, name);
  }
  if (numParams === 2) {
    return applyBinary(args[0], args[1], destData, name);
  }
};

export function findOperationByName(name) {
  for (let op of OPERATIONS) {
    if (op.name === name) {
      return op;
    }
  }
  return null;
};
