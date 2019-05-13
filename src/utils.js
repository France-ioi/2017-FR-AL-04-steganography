import {OPERATIONS, IMAGE_WIDTH, IMAGE_HEIGHT} from "./constants";

export function updateWorkspace (state) {
  let {workspace, dump, taskData} = state;

  /* Rebuild the workspace images and cache. */
  const images = [];
  const newCache = {};
  taskData.originalImagesURLs.forEach(function (src, index) {
    const image = computeImage(state, {index, src}, newCache);
    images.push(image);
  });
  dump.images.forEach(function (image) {
    image = computeImage(state, image, newCache);
    images.push(image);
  });

  /* Set nextNameID, resultName if missing. */
  let {nextNameID, resultName, resultNameChanged} = workspace;
  if (!nextNameID) {
    nextNameID = taskData.originalImagesURLs.length + 1;
  }
  workspace = {...workspace, images, nextNameID, resultName, resultNameChanged};

  if (!resultNameChanged) {
    workspace.resultName = generateUnusedName(images);
  }

  return {...state, imageCache: newCache, workspace};
}

export function computeImage (state, dump, newCache) {
  if ("index" in dump) {
    const {index, src} = dump;
    const name = `Image ${index + 1}`;
    const expr = index.toString();
    const canvas = state.canvases[index]; // may be null
    return {name, dump, index, src, expr, canvas};
  }
  let image = loadImage(dump);
  if (image === null) {
    return {name: dump.name};
  }
  const expr = getImageExpr(image.dump);
  image.expr = expr;
  let cachedProps;
  if (expr in state.imageCache) {
    cachedProps = state.imageCache[expr];
  } else {
    /* Create a new canvas to compute the result of the operation. */
    const canvas = document.createElement("canvas");
    canvas.width = IMAGE_WIDTH;
    canvas.height = IMAGE_HEIGHT;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    const resultData = context.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    /* Prepare the arguments. */
    const {operationParams, operands} = image;
    const args = {operationParams, operands: []};
    for (let operand of operands) {
      if (!operand) {
        return image;
      }
      operand = computeImage(state, operand, newCache);
      if (!operand.canvas) {
        return image;
      }
      const sourceContext = operand.canvas.getContext("2d");
      const imageData = sourceContext.getImageData(
        0,
        0,
        IMAGE_WIDTH,
        IMAGE_HEIGHT
      );
      args.operands.push(imageData);
    }
    /* Apply the operation. */
    applyOperation(dump.operation, args, resultData);
    /* Write the ImageData into the canvas. */
    context.putImageData(resultData, 0, 0);
    /* Build the data-URL used to display the image. */
    const src = canvas.toDataURL("image/png");
    cachedProps = {canvas, src};
  }
  /* Save the computed canvas, src in the new cache. */
  if (newCache) {
    newCache[expr] = cachedProps;
  }
  Object.assign(image, cachedProps);
  return image;
}

/* Take a dump and return a sanitized image if it is valid, null otherwise. */
function loadImage (dump) {
  let {name, operation, operands, operationParams} = dump;
  operation = OPERATIONS.find(op => op.name === operation);
  const {numOperands, params} = operation;
  const numParams = params ? params.length : 0;
  if (operands.length < numOperands) {
    return null;
  }
  /* In old dumps operationParams is an object, not an array */
  operationParams = toArray(operationParams);
  if (operationParams.length < numParams) {
    return null;
  }
  /* Trim operands and numParams to length. */
  operands = operands.slice(0, numOperands);
  operationParams = operationParams.slice(0, numParams);
  return {
    dump: {name, operation: operation.name, operands, operationParams},
    name,
    operation,
    operands,
    operationParams
  };
}

/* Return a cache key describing the (valid) image. */
function getImageExpr (image) {
  if (!image) {
    return "null";
  } else if ("index" in image) {
    return image.index.toString();
  } else {
    const stack = [];
    for (let operand of image.operands) {
      stack.push(getImageExpr(operand));
    }
    for (let param of toArray(image.operationParams)) {
      stack.push(param.toString());
    }
    stack.push(image.operation);
    return stack.join(" ");
  }
}

function toArray (value) {
  if (!Array.isArray(value)) {
    const items = [];
    Object.keys(value).forEach(function (index) {
      items[parseInt(index)] = value[index];
    });
    value = items;
  }
  return value;
}

export function generateUnusedName (images) {
  let counter = 0,
    name;
  do {
    counter += 1;
    name = `Image ${counter}`;
  } while (images.find(image => image.name === name));
  return name;
}

function unaryNegate (v1, _channel) {
  return 255 - v1;
}

function unaryExtractChannel (exChannel) {
  return function (v1, channel) {
    if (channel == exChannel) {
      return v1;
    }
    return 0;
  };
}

function unaryBrightness (v1, channel, params) {
  v1 *= params[0];
  if (v1 < 0) {
    v1 = 0;
  } else if (v1 > 255) {
    v1 = 255;
  }
  return v1;
}

function binarySubtract (v1, v2, _channel) {
  let v = v1 - v2;
  if (v < 0) {
    v = 0;
  }
  return v;
}

function binaryMean (v1, v2, _channel) {
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

function applyUnary (sourceData, operationParams, destData, operation) {
  let func = operatorToFunc[operation];
  for (var iPix = 0; iPix < sourceData.data.length; iPix++) {
    var v = 255;
    if (iPix % 4 != 3) {
      var v1 = sourceData.data[iPix];
      v = func(v1, iPix % 4, operationParams);
    }
    destData.data[iPix] = v;
  }
}

function applyBinary (
  sourceData1,
  sourceData2,
  operationParams,
  destData,
  operation
) {
  let func = operatorToFunc[operation];
  for (var iPix = 0; iPix < sourceData1.data.length; iPix++) {
    var v = 255;
    if (iPix % 4 != 3) {
      var v1 = sourceData1.data[iPix];
      var v2 = sourceData2.data[iPix];
      v = func(v1, v2, iPix % 4);
    }
    destData.data[iPix] = v;
  }
}

export function applyOperation (name, args, destData) {
  const numOperands = args.operands.length;
  if (numOperands === 1) {
    return applyUnary(args.operands[0], args.operationParams, destData, name);
  }
  if (numOperands === 2) {
    return applyBinary(
      args.operands[0],
      args.operands[1],
      args.operationParams,
      destData,
      name
    );
  }
}

export function findOperationByName (name) {
  for (let op of OPERATIONS) {
    if (op.name === name) {
      return op;
    }
  }
  return null;
}
