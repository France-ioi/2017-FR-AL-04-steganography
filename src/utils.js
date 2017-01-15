
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

function unaryBrightness(v1, channel, params) {
  v1 *= params[0];
  if(v1 < 0) {
    v1 = 0;
  }
  else if(v1 > 255) {
    v1 = 255;
  }
  return v1;
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
  brightness: unaryBrightness,
  extractRed: unaryExtractChannel(0),
  extractGreen: unaryExtractChannel(1),
  extractBlue: unaryExtractChannel(2)
};

function applyUnary(sourceData, operationParams, destData, operation) {
  let func = operatorToFunc[operation];
  for (var iPix = 0; iPix < sourceData.data.length; iPix++) {
    var v = 255;
    if (iPix % 4 != 3) {
      var v1 = sourceData.data[iPix];
      var v = func(v1, iPix % 4, operationParams);
    }
    destData.data[iPix] = v;
  }
};

function applyBinary(sourceData1, sourceData2, operationParams, destData, operation) {
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
  const numOperands = args.operands.length;
  if (numOperands === 1) {
    return applyUnary(args.operands[0], args.operationParams, destData, name);
  }
  if (numOperands === 2) {
    return applyBinary(args.operands[0], args.operands[1], args.operationParams, destData, name);
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
