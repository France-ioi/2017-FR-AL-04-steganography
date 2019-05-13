import React from "react";
import {Button} from "react-bootstrap";
import NumericInput from "react-numeric-input";
import {CanvasImageContainer} from "./image_containers";

import {OPERATIONS} from "../constants";

// Panel for operations below the big image. props:
// operationIndex - index of selected operation.
// stagedImages - images selected for operation.
// resultImage - the image computed from (operationIndex, stagedImages)
// onSetStagedImage - function to update a staged slot to the current image.
// onSetOperation - function to change the selected operation.
// onAddImage - function to add the result image to the list of images.
// resultName - name for the new image to be added.
// operationParams - Workspace params object for this operation.
// onOperationParamChange - function to call when a param changes.
export const ActionPanel = props => {
  const {
    operationIndex,
    onSetStagedImage,
    operationParams,
    onSetOperation,
    resultImage,
    onAddImage,
    resultName
  } = props;

  const showActionImages = operationIndex !== 0;
  let description = OPERATIONS[operationIndex].description;
  // If the description is not a string, assume it is a react component.
  if (typeof description !== "string") {
    description = React.createElement(description, OPERATIONS[operationIndex]);
  }

  const onOperationParamChange = (paramIndex, paramValue) => {
    props.onOperationParamChange(paramIndex, paramValue);
  };

  const renderParams = () => {
    const paramTypes = OPERATIONS[operationIndex].params;
    if (!paramTypes) {
      return null;
    }
    return (
      <div className="operationParams">
        <label>Facteur multiplicatif :&nbsp;</label>
        {paramTypes.map((paramType, paramTypeIndex) => {
          return (
            <OperationParam
              key={paramTypeIndex}
              spec={paramType}
              value={operationParams[paramTypeIndex]}
              index={paramTypeIndex}
              onChange={onOperationParamChange}
            />
          );
        })}
      </div>
    );
  };

  const renderStage = () => {
    const operation = OPERATIONS[operationIndex];
    const stagedImages = props.stagedImages.slice(0, operation.numOperands);
    return (
      <div className="stageImagesContainer">
        {stagedImages.map((image, index) => {
          return (
            <div className="stageImageContainer" key={index}>
              <div className="image-name">{image && image.name}</div>
              <CanvasImageContainer
                size="small"
                selected={false}
                image={image}
              />
              <StageButton index={index} onClick={onSetStagedImage} />
            </div>
          );
        })}
      </div>
    );
  };

  const onResultNameChange = function (event) {
    props.onResultNameChange(event.target.value);
  };

  const renderPreview = function () {
    return (
      <div className="previewImageContainer">
        <div className="inputGroup">
          <input
            type="text"
            className="form-control"
            value={resultName}
            onChange={onResultNameChange}
          />
          <i className="fa fa-pencil" aria-hidden="true" />
        </div>
        <CanvasImageContainer
          size="small"
          selected={false}
          image={resultImage}
        />
        <Button onClick={onAddImage}>Enregistrer</Button>
      </div>
    );
  };

  return (
    <div className="actionPanelContainer">
      <div className="actionLabel">
        <label>Appliquer un opérateur :&nbsp;</label>
        <OperationList
          onChange={onSetOperation}
          selectedIndex={operationIndex}
        />
      </div>
      <div className="actionDescription">{description}</div>
      {renderParams()}
      {showActionImages && (
        <div className="actionImagesContainer">
          {renderStage()}
          {renderPreview()}
        </div>
      )}
    </div>
  );
};

// Operation list. props:
// onChange - function to call when operation is selectd.
// selected - currently selected operation name.
const OperationList = props => {
  const {selectedIndex} = props;
  const onChange = function (event) {
    props.onChange(parseInt(event.target.value));
  };
  return (
    <select onChange={onChange} value={selectedIndex}>
      {OPERATIONS.map((operation, index) => {
        return (
          <option key={index} value={index}>
            {operation.longName}
          </option>
        );
      })}
    </select>
  );
};

// Stage "Set" button. props:
// index: stage index (0 or 1).
// onClick: function to call.
const StageButton = props => {
  const onClick = function () {
    props.onClick(props.index);
  };

  return <Button onClick={onClick}>Modifier</Button>;
};

// Operation param input field. props:
// value - the value of this input field.
// spec - the specification for this input field.
// index - the index of this input field.
// onChange - function to call with the index and value.
const OperationParam = props => {
  const {index, spec, value} = props;
  const onChange = function (value) {
    props.onChange(index, value);
  };
  if (spec.type === "numeric") {
    return (
      <NumericInput
        value={value}
        min={spec.min || 0}
        max={spec.max || 10}
        step={spec.step || 0.1}
        precision={spec.precision || 1}
        onChange={onChange}
      />
    );
  }
  return (
    <p>
      {"invalid type "}
      {spec.type}
    </p>
  );
};
