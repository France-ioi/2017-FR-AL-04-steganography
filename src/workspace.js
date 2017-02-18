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
    images.push(image);
  });

  /* Set nextNameID, resultName if missing. */
  let {nextNameID, resultName, resultNameChanged} = workspace;
  if (!nextNameID) {
    nextNameID = task.originalImagesURLs.length + 1;
  }
  workspace = {...workspace, images, nextNameID, resultName, resultNameChanged};

  if (!resultNameChanged) {
    workspace.resultName = generateUnusedName(images);
  }

  return {...state, imageCache: newCache, workspace};
};

export function computeImage (state, dump, newCache) {
  if ('index' in dump) {
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
    const canvas = document.createElement('canvas');
    canvas.width = IMAGE_WIDTH;
    canvas.height = IMAGE_HEIGHT;
    const context = canvas.getContext('2d');
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
      const sourceContext = operand.canvas.getContext('2d');
      const imageData = sourceContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
      args.operands.push(imageData);
    }
    /* Apply the operation. */
    applyOperation(dump.operation, args, resultData);
    /* Write the ImageData into the canvas. */
    context.putImageData(resultData, 0, 0);
    /* Build the data-URL used to display the image. */
    const src = canvas.toDataURL('image/png');
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
    name, operation, operands, operationParams
  };
}

/* Return a cache key describing the (valid) image. */
function getImageExpr (image) {
  if (!image) {
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
  let counter = 0, name;
  do {
    counter += 1;
    name = `Image ${counter}`;
  } while (images.find(image => image.name === name));
  return name;
}
