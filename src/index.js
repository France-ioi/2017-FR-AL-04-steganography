
import runTask from 'alkindi-task-lib';
import update from 'immutability-helper';

import Intro from './intro';
import {Workspace} from './views';
import {OPERATIONS, IMAGE_WIDTH, IMAGE_HEIGHT} from './constants';
import {updateWorkspace, computeImage, dumpImage} from './workspace';

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
    const {version, taskBaseUrl} = state.task;
    return {version, baseUrl: taskBaseUrl};
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
    const imageCache = {};
    const dump = {images: []};
    const workspace = emptyWorkspace;
    return updateWorkspace({...state, dump, workspace, canvases, imageCache});
  }

  /* taskUpdated is called to update the global state when the task is updated. */
  function taskUpdated (state) {
    return updateWorkspace(state);
  }

  /* workspaceLoaded is called to update the global state when a workspace dump is loaded. */
  function workspaceLoaded (state, dump) {
    const workspace = {...emptyWorkspace};
    return updateWorkspace({...state, dump, workspace});
  }

  function dumpWorkspace (state) {
    return state.dump;
  }

  function isWorkspaceReady (state) {
    return !!state.workspace.images;
  }

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
    return updateWorkspace({...state, canvases});
  });

  bundle.addReducer('imageSelected', function (state, action) {
    const {index} = action;
    return update(state, {workspace: {currentImageIndex: {$set: index}}});
  });

  bundle.addReducer('imageAdded', function (state, action) {
    const name = state.workspace.resultName;
    const image = {...dumpImage(action.image), name};
    const dump = update(state.dump, {
      images: {$push: [image]}
    });
    const newIndex = state.workspace.images.length;
    const nextNameID = state.workspace.nextNameID + 1;
    const workspace = update(state.workspace, {
      images: {$push: [image]},
      currentImageIndex: {$set: newIndex},
      nextNameID: {$set: nextNameID},
      resultName: {$set: `Image ${nextNameID}`}
    });
    return updateWorkspace({...state, dump, workspace});
  });

  bundle.addReducer('imageDeleted', function (state, action) {
    let {index} = action;
    /* Subtract the number of task images so that the index applies to the
       dump rather than the workspace. */
    index -= state.task.originalImagesURLs;
    /* When deleting the last image, make the previous current. */
    const newLength = state.workspace.images.length - 1;
    function updateIndex (other) {
      return other === newLength ? other - 1 : other;
    }
    const dump = update(state.dump, {
      images: {$splice: [[index, 1]]}
    });
    const workspace = update(state.workspace, {
      currentImageIndex: {$apply: updateIndex}
    });
    return updateWorkspace({...state, dump, workspace});
  });

  bundle.addReducer('resultNameChanged', function (state, action) {
    const {resultName} = action;
    return update(state, {
      workspace: {
        resultName: {$set: resultName}
      }
    });
  });

  bundle.addReducer('operationChanged', function (state, action) {
    const {index} = action;
    const operation = OPERATIONS[index];
    const operationParams = (operation.params||[]).map(pt => pt.default);
    return updateResultImage(update(state, {
      workspace: {
        currentOperationIndex: {$set: index},
        operationParams: {$set: operationParams}
      }
    }));
  });

  bundle.addReducer('stagedImageChanged', function (state, action) {
    const {slotIndex, imageIndex} = action;
    const image = state.workspace.images[imageIndex];
    return updateResultImage(update(state, {
      workspace: {
        stagedImages: {[slotIndex]: {$set: image}}
      }
    }));
  });

  bundle.addReducer('operationParamChanged', function (state, action) {
    const {paramIndex, paramValue} = action;
    return updateResultImage(update(state, {
      workspace: {
        operationParams: {[paramIndex]: {$set: paramValue}}
      }
    }));
  });

  function updateResultImage (state) {
    const {currentOperationIndex, stagedImages, operationParams} = state.workspace;
    const operation = OPERATIONS[currentOperationIndex];
    const operands = stagedImages.map(dumpImage);
    const dump = {operation: operation.name, operands: operands, operationParams};
    const resultImage = computeImage(state, dump);
    return update(state, {
      workspace: {
        resultImage: {$set: resultImage}
      }
    });
  }

}
