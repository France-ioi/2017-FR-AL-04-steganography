/*
  dump.images is an array of images of shape
    {name, index}
  or
    {name, operation: 'name', operands: […dumps], operationParams: […]}
*/

import {OPERATIONS, IMAGE_WIDTH, IMAGE_HEIGHT} from './constants';
import {applyOperation} from './utils';

export function updateWorkspace (state) {
  let {workspace, dump, task, canvases} = state;

  /* Rebuild the workspace images and cache. */
  const images = [];
  const newCache = {};
  task.originalImagesURLs.forEach(function (src, index) {
    const image = computeImage(state, {index, src}, newCache);
    images.push(image);
  });
  dump.images.forEach(function (image) {
    image = computeImage(state, image, newCache);
    newCache[image.expr] = image;
    images.push(image);
  });

  /* Set nextNameID, resultName if missing. */
  let {nextNameID, resultName} = workspace;
  if (!nextNameID) {
    nextNameID = task.originalImagesURLs.length + 1;
  }
  if (!resultName) {
    resultName = `Image ${nextNameID}`;
  }

  workspace = {...workspace, images, nextNameID, resultName};
  return {...state, imageCache: newCache, workspace};
};

export function computeImage (state, image, newCache) {
  if ('index' in image) {
    const {index, src} = image;
    const name = `Image ${index + 1}`;
    const expr = index.toString();
    const canvas = state.canvases[index];
    return canvas ? {index, src, name, expr, canvas} : image;
  }
  let result;
  const expr = getImageExpr(image);
  if (expr in state.imageCache) {
    result = state.imageCache[expr];
  } else {
    result = validateImage(image);
    if (result === null) {
      return image;
    }
    /* Create a new canvas to compute the result of the operation. */
    const canvas = document.createElement('canvas');
    canvas.width = IMAGE_WIDTH;
    canvas.height = IMAGE_HEIGHT;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    const resultData = context.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    /* Prepare the arguments. */
    const {operationParams, operands} = result;
    const args = {operationParams, operands: []};
    for (let operand of operands) {
      if (operand === null) {
        return image;
      }
      operand = computeImage(state, operand, newCache);
      if (!operand.canvas) {
        return image;
      }
      const sourceContext = operand.canvas.getContext('2d');
      const imageData = sourceContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
      args.operands.push(imageData);
    }
    /* Apply the operation. */
    applyOperation(image.operation, args, resultData);
    // Write the ImageData into the canvas.
    context.putImageData(resultData, 0, 0);
    // Build the data-URL used to display the image.
    result.src = canvas.toDataURL('image/png');
    result.expr = expr;
    result.canvas = canvas;
  }
  /* Save the computed image in the new cache. */
  if (newCache) {
    newCache[expr] = result;
  }
  return result;
}

/* Return a sanitized image if it is valid, null otherwise. */
function validateImage (image) {
  let {operation, operands, operationParams} = image;
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
  return {...image, operation, operands, operationParams};
}

/* Return a cache key describing the (valid) image. */
function getImageExpr (image) {
  if (image === null) {
    return 'null';
  } else if ('index' in image) {
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
    return stack.join(' ');
  }
}

export function dumpImage (image) {
  if (image === null) {
    return null;
  }
  const {index, operation, operands, operationParams} = image;
  if (typeof index === 'number') {
    return {index};
  } else {
    return {operation: operation.name, operands: operands.map(dumpImage), operationParams};
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
