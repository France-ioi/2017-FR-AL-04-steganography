
import React from 'react';
import {Alert, Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';
import NumericInput from 'react-numeric-input';

import {
  THUMBNAILS_COUNT, IMAGE_WIDTH, IMAGE_HEIGHT,
  THUMB_WIDTH, THUMB_HEIGHT, OPERATIONS
} from './constants';

// A canvas tag. props:
// image (binary tree representation of image operations).
export const CanvasImage = EpicComponent(self => {
  self.render = function () {
    const {image, size} = self.props;
    let width;
    let height;
    if (size === "small") {
      width = THUMB_WIDTH;
      height = THUMB_HEIGHT;
    } else {
      width = IMAGE_WIDTH;
      height = IMAGE_HEIGHT;
    }
    if (!image || !image.src) {
      return <div className="noImage" style={{width: width+'px', height: height+'px'}}>pas d'image</div>;
    }
    return <img src={image.src} width={IMAGE_WIDTH} height={IMAGE_HEIGHT}
      style={{width: width+'px', height: height+'px'}} title={image.expr} />;
  };
}, {displayName: 'CanvasImage'});

// Container for a canvas image. props:
// size - big or small.
// selected - whether to display a thick border.
// image - the image tree object.
export const CanvasImageContainer = EpicComponent(self => {
  self.render = function() {
    const {selected, image, size, load} = self.props;
    return (
      <CanvasImage image={image} size={size}/>
    );
  };
}, {displayName: 'CanvasImageContainer'});

// One of the thumbnail on the left. props:
// image - the tree representing this image.
// index - the index to show to the left of the image.
// selected - is this image currently selected (for border display).
export const Thumbnail = EpicComponent(self => {
  const onClick = function() {
    self.props.onClick(self.props.index);
  };
  self.render = function() {
    const {index, image, selected} = self.props;
    const className = selected ? "selected" : "unselected";
    const thumbnailClassName = `thumbnail ${className}`;
    return (
      <div onClick={onClick} className={thumbnailClassName}>
        <span className="thumbnail-image-name">{image.name}</span>
        <span className="thumbnail-image">
          <CanvasImageContainer size="small" image={image} selected={selected}/>
        </span>
      </div>
    );
  };
}, {displayName: 'Thumbnail'});

// The thumbnails on the left. props:
// images - list of images.
// currentImageIndex - current image index.
// changeImageIndex - function to change the current image index.
export const ThumbnailsContainer = EpicComponent(self => {
  const clickImage = function(imageIndex) {
    self.props.changeImageIndex(imageIndex);
  };
  self.render = function() {
    const {images, currentImageIndex, load} = self.props;
    return (
      <div className="thumbnails-container">
        {images.map(function(image, index) {
          return <Thumbnail onClick={clickImage} key={index} image={image} selected={index === currentImageIndex} index={index}/>;
        })}
      </div>
    );
  };
}, {displayName: 'ThumbnailsContainer'});

// Container of the large image. props:
// image - the image show.
// showDelete - show delete button.
// deleteImage - to call on click.
export const BigImageContainer = EpicComponent(self => {
  self.render = function() {
    const {image, showDelete} = self.props;
    return (
      <div className="bigImageContainer">
        <div className="image-name">{image.name} {showDelete && renderDelete()}</div>
        <CanvasImageContainer image={image} selected={false} size="big"/>
      </div>
    );
  };
  const renderDelete = function() {
    const {deleteImage} = self.props;
    return <Button onClick={deleteImage}>Supprimer <i className="fa fa-times" aria-hidden="true"></i></Button>;
  };
}, {displayName: 'BigImageContainer'});

// Operation list. props:
// onChange - function to call when operation is selectd.
// selected - currently selected operation name.
export const OperationList = EpicComponent(self => {
  const onChange = function(event) {
    self.props.onChange(parseInt(event.target.value));
  };
  self.render = function() {
    const {selectedIndex} = self.props;
    return (
      <select onChange={onChange} value={selectedIndex}>
        {OPERATIONS.map(function(operation, index) {
          return <option key={index} value={index}>{operation.longName}</option>;
        })}
      </select>
    );
  };
}, {displayName: 'OperationList'});

// Stage "Set" button. props:
// index: stage index (0 or 1).
// onClick: function to call.
export const StageButton = EpicComponent(self => {
  const onClick = function() {
    self.props.onClick(self.props.index);
  };
  self.render = function() {
    return <Button onClick={onClick}>Modifier</Button>;
  };
}, {displayName: 'StageButton'});

// Operation param input field. props:
// value - the value of this input field.
// spec - the specification for this input field.
// index - the index of this input field.
// onChange - function to call with the index and value.
export const OperationParam = EpicComponent(self => {
  const onChange = function(value) {
    self.props.onChange(self.props.index, value);
  };
  self.render = function() {
    const {spec, value} = self.props;
    if (spec.type === "numeric") {
      return <NumericInput value={value} min={spec.min||0} max={spec.max||10} step={spec.step||0.1} precision={spec.precision||1} onChange={onChange}/>;
    }
    return <p>{"invalid type "}{spec.type}</p>;
  };
});

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
export const ActionPanel = EpicComponent(self => {

  self.render = function() {
    const {operationIndex, onSetOperation} = self.props;
    const showActionImages = operationIndex !== 0;
    let description = OPERATIONS[operationIndex].description;
    // If the description is not a string, assume it is a react component.
    if (typeof description !== 'string') {
      description = React.createElement(description, OPERATIONS[operationIndex]);
    }
    return (
      <div className="actionPanelContainer">
        <div className="actionLabel">
          <label>Appliquer un opérateur :&nbsp;</label>
          <OperationList onChange={onSetOperation} selectedIndex={operationIndex}/>
        </div>
        <div className="actionDescription">{description}</div>
          {renderParams()}
        {showActionImages &&
          <div className="actionImagesContainer">
            {renderStage()}
            {renderPreview()}
          </div>
        }
      </div>
    );
  };

  const onOperationParamChange = function(paramIndex, paramValue) {
    self.props.onOperationParamChange(paramIndex, paramValue);
  };

  const renderParams = function() {
    const {operationParams, operationIndex} = self.props;
    const paramTypes = OPERATIONS[operationIndex].params;
    if(!paramTypes) {
      return null;
    }
    return (
      <div className="operationParams">
        <label>Facteur multiplicatif :&nbsp;</label>
        {paramTypes.map(function(paramType, paramTypeIndex) {
          return <OperationParam key={paramTypeIndex} spec={paramType} value={operationParams[paramTypeIndex]} index={paramTypeIndex} onChange={onOperationParamChange}/>;
        })}
      </div>
    );
  };

  const renderStage = function() {
    const {operationIndex, onSetStagedImage} = self.props;
    const operation = OPERATIONS[operationIndex];
    const stagedImages = self.props.stagedImages.slice(0, operation.numOperands);
    return (
      <div className="stageImagesContainer">
          {stagedImages.map(function(image, index) {
            return (
              <div className="stageImageContainer" key={index}>
                <div className="image-name">{image && image.name}</div>
                <CanvasImageContainer size="small" selected={false} image={image}/>
                <StageButton index={index} onClick={onSetStagedImage}/>
              </div>
            );
          })}
      </div>
    );
  };

  const onResultNameChange = function (event) {
    self.props.onResultNameChange(event.target.value);
  };

  const renderPreview = function() {
    const {resultImage, onAddImage, resultName} = self.props;
    return (
      <div className="previewImageContainer">
        <div className="inputGroup">
          <input type="text" className="form-control" value={resultName} onChange={onResultNameChange} />
            <i className="fa fa-pencil" aria-hidden="true"></i>
        </div>
        <CanvasImageContainer size="small" selected={false} image={resultImage}/>
        <Button onClick={onAddImage}>Enregistrer</Button>
      </div>
    );
  };
}, {displayName: 'ActionPanel'});

export const Workspace = actions => EpicComponent(self => {

  const onImageLoad = function(event) {
    const element = event.target;
    const index = parseInt(element.getAttribute('data-index'));
    self.props.dispatch({type: actions.imageLoaded, index, element});
  };

  const changeImageIndex = function(imageIndex) {
    self.props.dispatch({type: actions.imageSelected, index: imageIndex});
  };

  const onSetOperation = function (operationIndex) {
    self.props.dispatch({type: actions.operationChanged, index: operationIndex});
  };

  const onSetStagedImage = function (slotIndex) {
    const imageIndex = self.props.workspace.currentImageIndex;
    self.props.dispatch({type: actions.stagedImageChanged, slotIndex: slotIndex, imageIndex: imageIndex});
  };

  const onAddImage = function () {
    const image = self.props.workspace.resultImage;
    self.props.dispatch({type: actions.imageAdded, image});
  };

  const onDeleteImage = function () {
    const imageIndex = self.props.workspace.currentImageIndex;
    self.props.dispatch({type: actions.imageDeleted, index: imageIndex});
  };

  const onResultNameChange = function (resultName) {
    self.props.dispatch({ type: actions.resultNameChanged, resultName });
  };

  const onOperationParamChange = function(paramIndex, paramValue) {
    self.props.dispatch({type: actions.operationParamChanged, paramIndex, paramValue})
  };

  const onSubmitAnswer = function () {
    const {answer} = self.state;
    self.props.dispatch({type: actions.submitAnswer, answer});
  };

  const onDismissAnswerFeedback = function () {
    self.props.dispatch({type: actions.dismissAnswerFeedback});
  };

  const onAnswerChange = function (event) {
    const value = event.target.value;
    self.setState({answer: value});
  };

  self.state = {answer: ""};

  self.render = function () {
    const {score, task, workspace, submitAnswer} = self.props;
    const {images, currentImageIndex, currentOperationIndex, stagedImages, resultImage, resultName, operationParams} = workspace;
    const {originalImagesURLs} = task;
    const {answer} = self.state;
    return (
      <div className="taskContent">
        <div className="taskHeader">
          <div className="submitBlock form-inline">
            <label>{"Votre réponse :"}</label>{' '}
            <input className="form-control" value={answer} onChange={onAnswerChange}/>{' '}
            <Button onClick={onSubmitAnswer} disabled={submitAnswer && submitAnswer.status === 'pending'}>
              {"soumettre"}
            </Button>
          </div>
          {submitAnswer.feedback !== undefined &&
            <div className="feedbackBlock" onClick={onDismissAnswerFeedback}>
              {submitAnswer.feedback === true &&
                <span>
                  <i className="fa fa-check" style={{color: 'green'}}/>
                  {" Votre réponse est correcte."}
                </span>}
              {submitAnswer.feedback === false &&
                <span>
                  <i className="fa fa-close" style={{color: 'red'}}/>
                  {" Votre réponse est incorrecte."}
                </span>}
            </div>}
          <div className="scoreBlock">
            {"Score : "}{score === undefined ? '-' : score}
          </div>
          {<div className="saveBlock"><actions.SaveButton/></div>}
        </div>
        {submitAnswer.status === 'rejected' && (
          submitAnswer.error === 'too soon'
            ? <Alert bsStyle='warning'>{"Trop de réponses en une minute."}</Alert>
            : <Alert bsStyle='danger'>{"Votre réponse n'a pas pu être prise en compte."}</Alert>)}
        <div>
          <div className="thumbnails-container-wrapper">
            <ThumbnailsContainer images={images} changeImageIndex={changeImageIndex} currentImageIndex={currentImageIndex}/>
          </div>
          <div className="imageAndActionPanel">
            <BigImageContainer image={images[currentImageIndex]} index={currentImageIndex} showDelete={currentImageIndex >= originalImagesURLs.length} deleteImage={onDeleteImage}/>
            <ActionPanel
              operationIndex={currentOperationIndex} stagedImages={stagedImages} resultImage={resultImage}
              onSetStagedImage={onSetStagedImage} onSetOperation={onSetOperation} onAddImage={onAddImage} resultName={resultName} onResultNameChange={onResultNameChange}
              operationParams={operationParams} onOperationParamChange={onOperationParamChange}/>
            {/* Temporary hack: images are loaded by the view, should be loaded by a saga. */}
            <div style={{display: "none"}}>
              {originalImagesURLs.map(function(imageURL, imageIndex) {
                return <img src={imageURL} onLoad={onImageLoad} data-index={imageIndex} key={imageIndex}/>;
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };
}, {displayName: 'Workspace'});
