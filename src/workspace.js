import React from 'react';
import EpicComponent from 'epic-component';
import {include, defineAction, addReducer} from 'epic-linker';
import WorkspaceBuilder from 'alkindi-task-lib/simple_workspace';
import update from 'immutability-helper';

import {View} from './views';
import {OPERATIONS, IMAGE_WIDTH, IMAGE_HEIGHT} from './constants';
import {findOperationByName, applyOperation} from './utils';

export default function* (deps) {

  /* Actions dispatched by the workspace */

  yield defineAction('imageLoaded', 'Workspace.Image.Loaded');
  yield defineAction('imageAdded', 'Workspace.Image.Added');
  yield defineAction('imageDeleted', 'Workspace.Image.Deleted');
  yield defineAction('imageSelected', 'Workspace.Image.Selected');
  yield defineAction('operationChanged', 'Workspace.Operation.Changed');
  yield defineAction('stagedImageChanged', 'Workspace.StagedImage.Changed');

  /* Simple workspace interface: init, dump, load, update, View */

  const init = function (task) {
    return updateWorkspace(task, {
      images: [],
      currentImageIndex: 0,
      currentOperationIndex: 0,
      stagedImages: [null, null]
    });
  };

  const dump = function (workspace) {
    // Dump computed images.
    const {images} = workspace;
    const imageDumps = [];
    for (let image of workspace.images) {
      if ('operation' in image) {
        imageDumps.push(dumpImage(image));
      }
    }
    return {images: imageDumps};
  };

  const load = function (dump) {
    // Use a saved dump to rebuild a workspace.  Any computation that depends
    // on the task is done in update.
    const {images} = dump;
    return {images: images.map(loadImage)};
  };

  const updateWorkspace = function (task, workspace) {
    // Remove the task images, clearing the cached canvas in image expressions
    // to force it to be re-computed.
    const images = [];
    for (let image of workspace.images) {
      if ('operation' in image) {
        images.push(deepClearCanvas(image));
      }
    }
    // Prepend the task's images.
    images.splice(0, 0, ...task.originalImagesURLs.map(function (src, index) {
      return {index, src};
    }));
    return {...workspace, images};
  };

  yield include(WorkspaceBuilder({init, dump, load, update: updateWorkspace, View: View(deps)}));

  /*
    Add reducers for workspace actions and any needed sagas below:
  */

  yield addReducer('imageLoaded', function (state, action) {
    const {index, element} = action;
    const canvas = document.createElement('canvas');
    canvas.width = IMAGE_WIDTH;
    canvas.height = IMAGE_HEIGHT;
    const context = canvas.getContext('2d');
    context.drawImage(element, 0, 0);
    const images = state.workspace.images.map(image => deepUpdateCanvas(image, index, canvas));
    const changes = {
      workspace: {
        images: {$set: images}
      }
    };
    return update(state, changes);
  });

  yield addReducer('imageSelected', function (state, action) {
    const {index} = action;
    return update(state, {workspace: {currentImageIndex: {$set: index}}});
  });

  yield addReducer('imageAdded', function (state, action) {
    const {image} = action;
    const newIndex = state.workspace.images.length;
    return update(state, {
      workspace: {
        images: {$push: [image]},
        currentImageIndex: {$set: newIndex}
      }
    });
  });

  yield addReducer('imageDeleted', function (state, action) {
    const {index} = action;
    // When deleting the last image, make the previous current.
    const newLength = state.workspace.images.length - 1;
    function updateIndex (other) {
      return other === newLength ? other - 1 : other;
    }
    return update(state, {
      workspace: {
        images: {$splice: [[index, 1]]},
        currentImageIndex: {$apply: updateIndex}
      }
    });
  });

  yield addReducer('operationChanged', function (state, action) {
    const {index} = action;
    const operation = OPERATIONS[index];
    const operands = state.workspace.stagedImages;
    const resultImage = computeImage({operation, operands});
    return update(state, {
      workspace: {
        currentOperationIndex: {$set: index},
        resultImage: {$set: resultImage}
      }
    });
  });

  yield addReducer('stagedImageChanged', function (state, action) {
    const {workspace} = state;
    const {slotIndex, imageIndex} = action;
    const stagedImages = workspace.stagedImages.slice();
    stagedImages[slotIndex] = workspace.images[imageIndex];
    const operation = OPERATIONS[workspace.currentOperationIndex];
    const resultImage = computeImage({operation, operands: stagedImages});
    return update(state, {
      workspace: {
        stagedImages: {$set: stagedImages},
        resultImage: {$set: resultImage}
      }
    });
  });

  function deepClearCanvas (image) {
    if (image.canvas) {
      return {...image, canvas: undefined, src: undefined};
    }
    return image;
  }

  function deepUpdateCanvas (image, index, canvas) {
    // Do nothing if the image already has a canvas.
    if (image.canvas) {
      return image;
    }
    if ('index' in image) {
      // If an image with matching index is found, set its canvas.
      return image.index === index ? {...image, canvas} : image;
    }
    // Update operands recursively, then attempt to compute the image.
    const operands = image.operands.map(function (image) {
      return deepUpdateCanvas(image, index, canvas);
    });
    return computeImage({...image, operands});
  }

  /*
    An image dump is of one of these forms:
      {index}
      {operation: 'name', operands: [...dumps]}
  */
  function dumpImage (image) {
    if ('index' in image) {
      return {index: image.index};
    } else {
      const {operation, operands} = image;
      return {operation: operation.name, operands: operands.map(dumpImage)};
    }
  }

  function loadImage (dump) {
    if ('index' in dump) {
      const {index} = dump;
      return {index}; // src is set in updateWorkspace()
    } else {
      const operation = findOperationByName(dump.operation);
      const operands = dump.operands.map(loadImage);
      return {operation, operands}; // computation occurs in imageLoaded reducer
    }
  }

  function computeImage (image) {
    // Trim operands to length.
    let {operation, operands} = image;
    const {name, numParams} = operation;
    operands = operands.slice(0, numParams);
    if (operands.length < numParams) {
      return image;
    }
    // Extract image data for each operand.
    const args = [];
    for (let index = 0; index < operands.length; index++) {
      const operand = operands[index];
      if (!operand || !operand.canvas) {
        return image;
      }
      const sourceContext = operand.canvas.getContext('2d');
      args.push(sourceContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT));
    }
    // Create a new canvas to compute the result of the operation.
    const canvas = document.createElement('canvas');
    canvas.width = IMAGE_WIDTH;
    canvas.height = IMAGE_HEIGHT;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    const resultData = context.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    // Apply the operation.
    applyOperation(name, args, resultData);
    // Write the ImageData into the canvas.
    context.putImageData(resultData, 0, 0);
    // Build the data-URL used to display the image.
    const src = canvas.toDataURL('image/png');
    return {...image, operands, canvas, src};
  }

};
