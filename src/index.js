
import {use, defineAction, defineView, addReducer} from 'epic-linker';
import runTask from 'alkindi-task-lib';
import update from 'immutability-helper';

import Intro from './intro';
import {Workspace} from './views';
import {OPERATIONS, IMAGE_WIDTH, IMAGE_HEIGHT} from './constants';
import {findOperationByName, applyOperation} from './utils';

import 'font-awesome/css/font-awesome.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'rc-tooltip/assets/bootstrap.css';
import './style.css';

export function run (container, options) {
  runTask(container, options, TaskBundle);
};

function* TaskBundle (deps) {

  /*** Start of required task definitions ***/

  const workspaceOperations = {
    taskLoaded,
    taskUpdated,
    workspaceLoaded,
    dumpWorkspace,
    isWorkspaceReady
  };

  /* The 'init' action sets the workspace operations in the global state. */
  yield addReducer('init', function (state, action) {
    return {...state, workspaceOperations};
  });

  /* The 'Task' view displays the task introduction to the contestant. */
  yield defineView('Task', IntroSelector, Intro);
  function IntroSelector (state) {
    const {version} = state.task;
    return {version};
  }

  /* The 'Workspace' view displays the main task view to the contestant. */
  yield defineView('Workspace', WorkspaceSelector, Workspace(deps));
  function WorkspaceSelector (state, props) {
    const {score, task, workspace, hintRequest, submitAnswer} = state;
    return {score, task, workspace, hintRequest, submitAnswer: submitAnswer || {}};
  }

  /* taskInitialized is called to update the global state when the task is first loaded. */
  function taskLoaded (state) {
    const preWorkspace = {
      images: [],
      currentImageIndex: 0,
      currentOperationIndex: 0,
      stagedImages: [null, null],
      nextNameID: null,
      operationParams: {}
    };
    return {...state, workspace: updateWorkspace(state.task, preWorkspace)};
  }

  /* taskUpdated is called to update the global state when the task is updated. */
  function taskUpdated (state) {
    const workspace = updateWorkspace(state.task, state.workspace);
    return {...state, workspace};
  }

  /* workspaceLoaded is called to update the global state when a workspace dump is loaded. */
  function workspaceLoaded (state, dump) {
    const {images} = dump;
    const preWorkspace = {images: images.map(loadImage)};
    return {...state, workspace: updateWorkspace(state.task, preWorkspace)};
  }

  /* dumpWorkspace is called to build a serializable workspace dump.
     It should return the smallest part of the workspace that is needed to
     rebuild it.  */
  function dumpWorkspace (state) {
    // Dump computed images.
    const {workspace} = state;
    const {images} = state.workspace;
    const imageDumps = [];
    for (let image of workspace.images) {
      if ('operation' in image) {
        imageDumps.push(dumpImage(image));
      }
    }
    return {images: imageDumps};
  }

  function isWorkspaceReady (state) {
    return true;
  }

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
      const name = `Image ${index + 1}`;
      return {index, src, name};
    }));

    let {nextNameID, resultName} = workspace;
    if (!nextNameID) {
      nextNameID = task.originalImagesURLs.length + 1;
    }
    if (!resultName) {
      resultName = `Image ${nextNameID}`;
    }
    return {...workspace, images, nextNameID, resultName};
  };

  /* Actions dispatched by the workspace */

  yield defineAction('imageLoaded', 'Workspace.Image.Loaded');
  yield defineAction('imageAdded', 'Workspace.Image.Added');
  yield defineAction('imageDeleted', 'Workspace.Image.Deleted');
  yield defineAction('imageSelected', 'Workspace.Image.Selected');
  yield defineAction('operationChanged', 'Workspace.Operation.Changed');
  yield defineAction('stagedImageChanged', 'Workspace.StagedImage.Changed');
  yield defineAction('resultNameChanged', 'Workspace.ResultName.Changed');
  yield defineAction('operationParamsChanged', 'Workspace.Operation.ParamsChanged');

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
    let {image} = action;
    image = {...image, name: state.workspace.resultName};

    const newIndex = state.workspace.images.length;
    const nextNameID = state.workspace.nextNameID + 1;
    return update(state, {
      workspace: {
        images: {$push: [image]},
        currentImageIndex: {$set: newIndex},
        nextNameID: {$set: nextNameID},
        resultName: {$set: `Image ${nextNameID}`}
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
    const {operationParams} = state.workspace;
    for(let paramTypeIndex in operation.params) {
      let paramType = operation.params[paramTypeIndex];
      if(operationParams[paramTypeIndex] === null || operationParams[paramTypeIndex] === undefined) {
        operationParams[paramTypeIndex] = paramType.default;
      }
    }
    const resultImage = computeImage({operation, operands, operationParams});
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
    const {operationParams} = state.workspace;
    const resultImage = computeImage({operation, operands: stagedImages, operationParams});
    return update(state, {
      workspace: {
        stagedImages: {$set: stagedImages},
        resultImage: {$set: resultImage}
      }
    });
  });

  yield addReducer('resultNameChanged', function (state, action) {
    const {resultName} = action;
    return update(state, {
      workspace: {
        resultName: {$set: resultName}
      }
    });
  });

  yield addReducer('operationParamsChanged', function (state, action) {
    const {operationParams} = action;
    let {workspace} = state;
    let {resultImage} = workspace;
    resultImage = computeImage({...resultImage, operationParams});
    workspace = {...workspace, resultImage, operationParams};
    return {...state, workspace};
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
      {name, index}
      {name, operation: 'name', operands: [...dumps]}
  */
  function dumpImage (image) {
    if ('index' in image) {
      return {name: image.name, index: image.index};
    } else {
      const {name, operation, operands} = image;
      return {name, operation: operation.name, operands: operands.map(dumpImage)};
    }
  }

  function loadImage (dump) {
    if ('index' in dump) {
      const {name, index} = dump;
      return {name, index}; // src is set in updateWorkspace()
    } else {
      const operation = findOperationByName(dump.operation);
      const operands = dump.operands.map(loadImage);
      const name = dump.name;
      return {name, operation, operands}; // computation occurs in imageLoaded reducer
    }
  }

  function computeImage (image) {
    // Trim operands to length.
    let {operation, operands, operationParams} = image;
    const {name, numOperands} = operation;
    operands = operands.slice(0, numOperands);
    if (operands.length < numOperands) {
      return image;
    }
    // Extract image data for each operand.
    const args = {
      operationParams,
      operands: []
    };
    for (let index = 0; index < operands.length; index++) {
      const operand = operands[index];
      if (!operand || !operand.canvas) {
        return image;
      }
      const sourceContext = operand.canvas.getContext('2d');
      args.operands.push(sourceContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT));
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

}
