
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

function TaskBundle (bundle, deps) {

  /*** Start of required task definitions ***/

  const workspaceOperations = {
    taskLoaded,
    taskUpdated,
    workspaceLoaded,
    dumpWorkspace,
    isWorkspaceReady
  };

  /* The 'init' action sets the workspace operations in the global state. */
  bundle.addReducer('init', function (state, action) {
    return {...state, workspaceOperations};
  });

  /* The 'Task' view displays the task introduction to the contestant. */
  bundle.defineView('Task', IntroSelector, Intro);
  function IntroSelector (state) {
    const {version} = state.task;
    return {version};
  }

  /* The 'Workspace' view displays the main task view to the contestant. */
  bundle.use('submitAnswer', 'dismissAnswerFeedback')
  bundle.defineView('Workspace', WorkspaceSelector, Workspace(deps));
  function WorkspaceSelector (state, props) {
    const {score, task, workspace, submitAnswer} = state;
    return {score, task, workspace, submitAnswer: submitAnswer || {}};
  }

  const emptyWorkspace = {
    images: [],
    currentImageIndex: 0,
    currentOperationIndex: 0,
    stagedImages: [null, null],
    nextNameID: null,
    operationParams: []
  };

  /* taskInitialized is called to update the global state when the task is first loaded. */
  function taskLoaded (state) {
    const canvases = state.task.originalImagesURLs.map(url => null);
    return {...state,
      workspace: updateWorkspace(state.task, emptyWorkspace, canvases),
      canvases
    };
  }

  /* taskUpdated is called to update the global state when the task is updated. */
  function taskUpdated (state) {
    const workspace = updateWorkspace(state.task, state.workspace, state.canvases);
    return {...state, workspace};
  }

  /* workspaceLoaded is called to update the global state when a workspace dump is loaded. */
  function workspaceLoaded (state, dump) {
    const {images} = dump;
    const preWorkspace = {
      ...emptyWorkspace,
      images: images.map(loadImage)
    };
    return {...state, workspace: updateWorkspace(state.task, preWorkspace, state.canvases)};
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
    return !!state.workspace.images;
  }

  const updateWorkspace = function (task, workspace, canvases) {
    // Remove the task images, clearing the cached canvas in image expressions
    // to force it to be re-computed.
    let images = [];
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
    images = images.map(image => deepUpdateCanvas(image, canvases));

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

  bundle.defineAction('imageLoaded', 'Workspace.Image.Loaded');
  bundle.defineAction('imageAdded', 'Workspace.Image.Added');
  bundle.defineAction('imageDeleted', 'Workspace.Image.Deleted');
  bundle.defineAction('imageSelected', 'Workspace.Image.Selected');
  bundle.defineAction('operationChanged', 'Workspace.Operation.Changed');
  bundle.defineAction('stagedImageChanged', 'Workspace.StagedImage.Changed');
  bundle.defineAction('resultNameChanged', 'Workspace.ResultName.Changed');
  bundle.defineAction('operationParamChanged', 'Workspace.Operation.ParamChanged');

  /*
    Add reducers for workspace actions and any needed sagas below:
  */

  bundle.addReducer('imageLoaded', function (state, action) {
    const {index, element} = action;
    const canvas = document.createElement('canvas');
    canvas.width = IMAGE_WIDTH;
    canvas.height = IMAGE_HEIGHT;
    const context = canvas.getContext('2d');
    context.drawImage(element, 0, 0);
    const canvases = state.canvases.slice();
    canvases[index] = canvas;
    const images = state.workspace.images.map(image => deepUpdateCanvas(image, canvases));
    return update(state, {
      workspace: {images: {$set: images}},
      canvases: {$set: canvases}
    });
  });

  bundle.addReducer('imageSelected', function (state, action) {
    const {index} = action;
    return update(state, {workspace: {currentImageIndex: {$set: index}}});
  });

  bundle.addReducer('imageAdded', function (state, action) {
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

  bundle.addReducer('imageDeleted', function (state, action) {
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

  bundle.addReducer('operationChanged', function (state, action) {
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

  bundle.addReducer('stagedImageChanged', function (state, action) {
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

  bundle.addReducer('resultNameChanged', function (state, action) {
    const {resultName} = action;
    return update(state, {
      workspace: {
        resultName: {$set: resultName}
      }
    });
  });

  bundle.addReducer('operationParamChanged', function (state, action) {
    const {paramIndex, paramValue} = action;
    let {workspace} = state;
    let {resultImage, operationParams} = workspace;
    operationParams = operationParams.slice();
    operationParams[paramIndex] = paramValue;
    resultImage = computeImage({...resultImage, operationParams});
    workspace = {...workspace, resultImage, operationParams};
    return {...state, workspace};
  });

  function deepClearCanvas (image) {
    if ('index' in image) {
      return {index: image.index};
    }
    if ('operation' in image) {
      const {name, operation, operands, operationParams} = image;
      return {name, operation, operands, operationParams};
    }
    return image;
  }

  function deepUpdateCanvas (image, canvases) {
    // Do nothing if the image already has a canvas.
    if (image.canvas) {
      return image;
    }
    if ('index' in image) {
      // If an image with matching index is found, set its canvas.
      return {...image, canvas: canvases[image.index]};
    }
    // Update operands recursively, then attempt to compute the image.
    const operands = image.operands.map(function (image) {
      return deepUpdateCanvas(image, canvases);
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
      const {name, operation, operands, operationParams} = image;
      return {
        name,
        operation: operation.name,
        operands: operands.map(dumpImage),
        operationParams
      };
    }
  }

  function loadImage (dump) {
    if ('index' in dump) {
      const {name, index} = dump;
      return {name, index}; // src is set in updateWorkspace()
    } else {
      let {name, operation, operands, operationParams} = dump;
      operation = findOperationByName(operation);
      operands = operands.map(loadImage);
      return {name, operation, operands, operationParams}; // computation occurs in imageLoaded reducer
    }
  }

  function computeImage (image) {
    // Trim operands and numParams to length.
    let {operation, operands, operationParams} = image;
    const {name, numOperands} = operation;
    const numParams = operation.params ? operation.params.length : 0;
    if (operands.length < numOperands) {
      return image;
    }
    if (operationParams.length < numParams) {
      return image;
    }
    operands = operands.slice(0, numOperands);
    operationParams = operationParams.slice(0, numParams);
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
    return {...image, operands, operationParams, canvas, src};
  }

}
