import React from "react";
import update from "immutability-helper";
import {connect} from "react-redux";
import {OPERATIONS, IMAGE_WIDTH, IMAGE_HEIGHT} from "./constants";
import {updateWorkspace, computeImage} from "./utils";
import {ThumbnailsContainer, BigImageContainer} from "./tools/image_containers";
import {ActionPanel} from "./tools/action_panel";

const Workspace = props => {
  const {dispatch, task, workspace, answer} = props;
  const {
    imageLoaded,
    imageSelected,
    operationChanged,
    stagedImageChanged,
    imageAdded,
    imageDeleted,
    resultNameChanged,
    operationParamChanged,
    answerChanged
  } = props;
  const {
    images,
    currentImageIndex,
    currentOperationIndex,
    stagedImages,
    resultImage,
    resultName,
    operationParams
  } = workspace;
  const {originalImagesURLs} = task;

  const onImageLoad = event => {
    const element = event.target;
    const index = parseInt(element.getAttribute("data-index"));
    dispatch({
      type: imageLoaded,
      index,
      element
    });
  };

  const changeImageIndex = imageIndex => {
    dispatch({
      type: imageSelected,
      index: imageIndex
    });
  };

  const onSetOperation = operationIndex => {
    dispatch({
      type: operationChanged,
      index: operationIndex
    });
  };

  const onSetStagedImage = slotIndex => {
    dispatch({
      type: stagedImageChanged,
      slotIndex: slotIndex,
      imageIndex: currentImageIndex
    });
  };

  const onAddImage = () => {
    dispatch({type: imageAdded, image: resultImage});
  };

  const onDeleteImage = () => {
    dispatch({
      type: imageDeleted,
      index: currentImageIndex
    });
  };

  const onResultNameChange = resultName => {
    dispatch({
      type: resultNameChanged,
      resultName
    });
  };

  const onOperationParamChange = (paramIndex, paramValue) => {
    dispatch({
      type: operationParamChanged,
      paramIndex,
      paramValue
    });
  };

  const onAnswerChange = event => {
    const value = event.target.value;
    dispatch({
      type: answerChanged,
      answer: value
    });
  };

  return (
    <div className="taskContent">
      <div className="taskHeader">
        <div className="submitBlock form-inline">
          <label>{"Votre réponse :"}</label>{" "}
          <input
            className="form-control"
            value={answer}
            onChange={onAnswerChange}
          />{" "}
        </div>
        <div className="thumbnails-container-wrapper">
          <ThumbnailsContainer
            images={images}
            changeImageIndex={changeImageIndex}
            currentImageIndex={currentImageIndex}
          />
        </div>
        <div className="imageAndActionPanel">
          <BigImageContainer
            image={images[currentImageIndex]}
            index={currentImageIndex}
            showDelete={currentImageIndex >= originalImagesURLs.length}
            deleteImage={onDeleteImage}
          />
          <ActionPanel
            operationIndex={currentOperationIndex}
            stagedImages={stagedImages}
            resultImage={resultImage}
            onSetStagedImage={onSetStagedImage}
            onSetOperation={onSetOperation}
            onAddImage={onAddImage}
            resultName={resultName}
            onResultNameChange={onResultNameChange}
            operationParams={operationParams}
            onOperationParamChange={onOperationParamChange}
          />
          {/* Temporary hack: images are loaded by the view, should be loaded by a saga. */}
          <div style={{display: "none"}}>
            {originalImagesURLs.map(function (imageURL, imageIndex) {
              return (
                <img
                  src={imageURL}
                  onLoad={onImageLoad}
                  data-index={imageIndex}
                  key={imageIndex}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* The 'Workspace' view displays the main task view to the contestant. */
function WorkspaceSelector (state) {
  const {taskData, workspace, answer} = state;
  const {
    imageLoaded,
    imageSelected,
    operationChanged,
    stagedImageChanged,
    imageAdded,
    imageDeleted,
    resultNameChanged,
    operationParamChanged,
    answerChanged
  } = state.actions;

  return {
    task: taskData,
    workspace,
    answer,
    imageLoaded,
    imageSelected,
    operationChanged,
    stagedImageChanged,
    imageAdded,
    imageDeleted,
    resultNameChanged,
    operationParamChanged,
    answerChanged
  };
}

function updateResultImage (state) {
  const {
    resultName,
    currentOperationIndex,
    stagedImages,
    operationParams
  } = state.workspace;
  const operation = OPERATIONS[currentOperationIndex];
  const operands = stagedImages.map(image => image && image.dump);
  const dump = {
    name: resultName,
    operation: operation.name,
    operands: operands,
    operationParams
  };
  const resultImage = computeImage(state, dump);
  return update(state, {
    workspace: {
      resultImage: {$set: resultImage}
    }
  });
}

function updateResultImageName (state) {
  const resultName = state.workspace.resultName;
  return update(state, {
    workspace: {
      resultImage: {
        name: {$set: resultName},
        dump: {name: {$set: resultName}}
      }
    }
  });
}

function imageLoadedReducer (state, action) {
  const {index, element} = action;
  const canvas = document.createElement("canvas");
  canvas.width = IMAGE_WIDTH;
  canvas.height = IMAGE_HEIGHT;
  const context = canvas.getContext("2d");
  context.drawImage(element, 0, 0);
  const canvases = state.canvases.slice();
  canvases[index] = canvas;
  return updateResultImage(updateWorkspace({...state, canvases}));
}

function imageSelectedReducer (state, action) {
  const {index} = action;
  return update(state, {workspace: {currentImageIndex: {$set: index}}});
}

function imageAddedReducer (state, action) {
  const dump = update(state.dump, {
    images: {$push: [action.image.dump]}
  });
  const newIndex = state.workspace.images.length;
  const workspace = update(state.workspace, {
    currentImageIndex: {$set: newIndex},
    resultNameChanged: {$set: false}
  });
  return updateResultImage(updateWorkspace({...state, dump, workspace}));
}

function imageDeletedReducer (state, action) {
  let {index} = action;
  /* Subtract the number of task images so that the index applies to the
       dump rather than the workspace. */
  index -= state.taskData.originalImagesURLs.length;
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
  return updateResultImageName(updateWorkspace({...state, dump, workspace}));
}

function resultNameChangedReducer (state, action) {
  const {resultName} = action;
  return updateResultImageName(
    update(state, {
      workspace: {
        resultName: {$set: resultName},
        resultNameChanged: {$set: true}
      }
    })
  );
}

function operationChangedReducer (state, action) {
  const {index} = action;
  const operation = OPERATIONS[index];
  const operationParams = (operation.params || []).map(pt => pt.default);
  return updateResultImage(
    update(state, {
      workspace: {
        currentOperationIndex: {$set: index},
        operationParams: {$set: operationParams}
      }
    })
  );
}

function stagedImageChangedReducer (state, action) {
  const {slotIndex, imageIndex} = action;
  const image = state.workspace.images[imageIndex];
  return updateResultImage(
    update(state, {
      workspace: {
        stagedImages: {[slotIndex]: {$set: image}}
      }
    })
  );
}

function operationParamChangedReducer (state, action) {
  const {paramIndex, paramValue} = action;
  return updateResultImage(
    update(state, {
      workspace: {
        operationParams: {[paramIndex]: {$set: paramValue}}
      }
    })
  );
}

function answerChangedReducer (state, {answer}) {
  return {...state, answer: answer};
}

export default {
  actions: {
    imageLoaded: "Workspace.Image.Loaded",
    imageAdded: "Workspace.Image.Added",
    imageDeleted: "Workspace.Image.Deleted",
    imageSelected: "Workspace.Image.Selected",
    operationChanged: "Workspace.Operation.Changed",
    stagedImageChanged: "Workspace.StagedImage.Changed",
    resultNameChanged: "Workspace.ResultName.Changed",
    operationParamChanged: "Workspace.Operation.ParamChanged",
    answerChanged: "Workspace.Answer.Changed"
  },
  actionReducers: {
    imageLoaded: imageLoadedReducer,
    imageAdded: imageAddedReducer,
    imageDeleted: imageDeletedReducer,
    imageSelected: imageSelectedReducer,
    operationChanged: operationChangedReducer,
    stagedImageChanged: stagedImageChangedReducer,
    resultNameChanged: resultNameChangedReducer,
    operationParamChanged: operationParamChangedReducer,
    answerChanged: answerChangedReducer
  },
  views: {
    Workspace: connect(WorkspaceSelector)(Workspace)
  }
};
