
import React from 'react';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import {applyUnary, applyBinary} from './utils';

const THUMBNAILS_COUNT = 4;
const IMAGE_WIDTH = 400;
const IMAGE_HEIGHT = 400;
const THUMB_WIDTH = 100;
const THUMB_HEIGHT = 100;

const OPERATIONS = [
  {
    name: "noOp",
    description: "Select operation",
    numParams: 0
  },
  {
    name: "negate",
    description: "Negate image",
    numParams: 1
  },
  {
    name: "extractRed",
    description: "Extract Red",
    numParams: 1
  },
  {
    name: "extractGreen",
    description: "Extract Green",
    numParams: 1
  },
  {
    name: "extractBlue",
    description: "Extract Blue",
    numParams: 1
  },
  {
    name: "mean",
    description: "Average two images",
    numParams: 2
  },
  {
    name: "subtract",
    description: "Subtract an image from another",
    numParams: 2
  }
];

// A canvas tag. props:
// load (whether the initial images are ready),
// image (binary tree representation of image operations).
export const CanvasImage = EpicComponent(self => {


  self.componentDidMount = function() {
    updateCanvas();
  };
  self.componentDidUpdate = function() {
    updateCanvas();
  };
  const updateCanvas = function() {
    if(!self.props.load) {
      return;
    }
    const ctx = self.refs.canvas.getContext('2d');

    // Render into a temporary canvas.
    const canvas = document.createElement('canvas');
    canvas.width = IMAGE_WIDTH;
    canvas.height = IMAGE_HEIGHT;
    const tempCtx = canvas.getContext('2d');

    function treeToImageData(tree) {
      // TODO should this function be memoized? i.e. save all data in View state.
      const {operation, operationType, first, second, id} = tree;
      let imageData, sourceData, sourceData1, sourceData2, destData;
      switch(operationType) {
        case "image":
          tempCtx.drawImage(tree.element, 0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
          destData = tempCtx.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
          break;
        case "unary":
          sourceData = treeToImageData(tree.first);
          destData = tempCtx.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
          applyUnary(sourceData, destData, operation);
          break;
        case "binary":
          sourceData1 = treeToImageData(tree.first);
          sourceData2 = treeToImageData(tree.second);
          destData = tempCtx.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
          applyBinary(sourceData1, sourceData2, destData, operation);
          break;
        default:
          throw "Unknown operation type";
      }
      return destData;
    }
    if(self.props.image) {
      ctx.putImageData(treeToImageData(self.props.image), 0, 0);
    }
    else {
      ctx.clearRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    }
  };
  self.render = function () {
    let width;
    let height;
    if(self.props.size == "small") {
      width = THUMB_WIDTH;
      height = THUMB_HEIGHT;
    }
    else {
      width = IMAGE_WIDTH;
      height = IMAGE_HEIGHT;
    }
    return <canvas width={IMAGE_WIDTH} height={IMAGE_HEIGHT} style={{width: width, height: height}} ref="canvas"/>;
  };
});

// Container for a canvas image. props:
// size - big or small.
// selected - whether to display a thick border.
// image - the image tree object.
// load - whether the initial images are ready.
export const CanvasImageContainer = EpicComponent(self => {
  self.render = function() {
    const {selected, image, size, load} = self.props;
    let className;
    if(selected) {
      className = "selected";
    }
    else {
      className = "unselected";
    }
    return <div className={className}><CanvasImage image={image} load={load} size={size}/></div>;
  };
});

// One of the thumbnail rows on the left. props:
// image - the tree representing this image.
// index - the index to show to the left of the image.
// load - whether the initial images are ready.
// selected - is this image currently selected (for border display).
export const Thumbnail = EpicComponent(self => {
  const onClick = function() {
    self.props.onClick(self.props.index);
  };
  self.render = function() {
    const {index, image, load, selected} = self.props;
    return (
      <div onClick={onClick}>
        <span className="thumbnail-index">
          {parseInt(index) + 1}
        </span>
        <span className="thumbnail-image">
          <CanvasImageContainer size="small" load={load} image={image} selected={selected}/>
        </span>
      </div>
    );
  };
}, {displayName: 'Thumbnail'});

// The thumbnails on the left. props:
// images - the trees representing the images (from workspace).
// currentImageIndex - current image index from View.
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
          return <Thumbnail onClick={clickImage} key={image.id} image={image} load={load} selected={index === currentImageIndex} index={index}/>;
        })}
      </div>
    );
  };
}, {displayName: 'ThumbnailsContainer'});

// Container of the large image. props:
// load - whether the initial images have loaded.
// image - the image tree to show.
// showDelete - show delete button.
// deleteImage - to call on click.
export const BigImageContainer = EpicComponent(self => {
  self.render = function() {
    const {load, image} = self.props;
    return (
      <div>
        <CanvasImageContainer load={load} image={image} selected={false} size="big"/>
        <br/>
        {renderDelete()}
      </div>
    );
  };
  const renderDelete = function() {
    const {showDelete, deleteImage} = self.props;
    if(!showDelete) {
      return null;
    }
    return <Button onClick={deleteImage}>Delete</Button>;
  }
});

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
          return <option key={index} value={index}>{operation.description}</option>;
        })}
      </select>
    );
  };
});

// Stage "Set" button. props:
// index: stage index (0 or 1).
// onClick: function to call.
export const StageButton = EpicComponent(self => {
  const onClick = function() {
    self.props.onClick(self.props.index);
  };
  self.render = function() {
    return <Button onClick={onClick}>Set</Button>;
  };
});

// Panel for operations below the big image. props:
// load - whether initial images are loaded.
// stagedImages - images selected for operation.
// updateStage - function to update a staged slot to the current image, in View state.
// applyOperation - function to apply an operation on the images.
export const ActionPanel = EpicComponent(self => {
  self.state = {
    selectedIndex: 0
  };
  const changeOperation = function(index) {
    self.setState({...self.state, selectedIndex: index});
  }
  const onStageClick = function(index) {
    self.props.updateStage(index);
  };
  const onAddClick = function() {
    self.props.applyOperation(self.state.selectedIndex);
  };
  self.render = function() {
    const {selectedIndex} = self.state;
    return (
      <div>
        <OperationList onChange={changeOperation} selectedIndex={selectedIndex}/>
        <br/>
        {renderStage()}
        {renderPreview()}
      </div>
    );
  };

  const renderStage = function() {
    const {selectedIndex} = self.state;
    const {load} = self.props;
    const operation = OPERATIONS[selectedIndex];
    let stagedImages = self.props.stagedImages.slice(0, operation.numParams);
    return (
      <table className="stageImageContainer">
        <tbody>
          <tr>
          {stagedImages.map(function(image, index) {
            return (
              <td key={index}>
                <CanvasImageContainer size="small" load={load} selected={false} image={image}/>
                <br/>
                <StageButton index={index} onClick={onStageClick}/>
              </td>
            );
          })}
          </tr>
        </tbody>
      </table>
    );
  };

  const createPreviewTree = function() {
    const {selectedIndex} = self.state;
    const {stagedImages} = self.props;
    const operation = OPERATIONS[selectedIndex];
    for(let stageIndex = 0; stageIndex < operation.numParams; stageIndex++) {
      if(stagedImages[stageIndex] === null) {
        return null;
      }
    }
    let operationType;
    if(operation.numParams === 1) {
      operationType = "unary";
    }
    else {
      operationType = "binary";
    }
    return {
      operationType,
      operation: operation.name,
      first: stagedImages[0],
      second: stagedImages[1],
      id: "preview"
    };
  };

  const renderPreview = function() {
    const {selectedIndex} = self.state;
    const {load, stagedImages} = self.props;
    const operation = OPERATIONS[selectedIndex];
    if(selectedIndex === 0) {
      return null;
    }

    // TODO where should the preview be generated?
    // Here it leaks an object that didn't exist before.
    const previewImage = createPreviewTree();

    return (
      <table className="previewImageContainer">
        <tbody>
          <tr>
            <td>
              <CanvasImageContainer size="small" load={load} selected={false} image={previewImage}/>
              <br/>
              <Button onClick={onAddClick}>Add</Button>
            </td>
          </tr>
        </tbody>
      </table>
    );
  };
});

export const View = actions => EpicComponent(self => {

  self.state = {
    originalImagesLoaded: false,
    stagedImages: [null, null]
  };

  const onImageLoad = function(event) {
    const element = event.target;
    const index = element.getAttribute('data-index');
    self.props.dispatch({type: actions.imageLoaded, index, element});
  };

  const changeImageIndex = function(imageIndex) {
    self.props.dispatch({type: actions.currentImageSelected, index: imageIndex});
  };

  const updateStage = function(stageIndex) {
    const {currentImageIndex} = self.props.workspace;
    let {stagedImages} = self.state;
    const {images} = self.props.workspace;
    stagedImages = stagedImages.slice(0);
    stagedImages[stageIndex] = images[currentImageIndex];
    self.setState({stagedImages});
  };

  const applyOperation = function(index) {
    const {stagedImages} = self.state;
    const operation = OPERATIONS[index];
    let operationType;
    if(operation.numParams === 1) {
      operationType = "unary";
    }
    else {
      operationType = "binary";
    }
    self.props.dispatch({
      type: actions.addImage,
      operation: operation.name,
      operationType,
      first: stagedImages[0],
      second: stagedImages[1]
    });

    // TODO how to scroll to the newly generated image?
    // The following line happens before the insertion.
    // changeImageIndex(self.props.workspace.images.length - 1);
  };

  const deleteImage = function() {
    const {currentImageIndex} = self.props.workspace;
    let {stagedImages} = self.state;
    const {images} = self.props.workspace;
    stagedImages = stagedImages.slice(0);
    for(let index = 0; index < stagedImages.length; index++) {
      if(stagedImages[index] === images[currentImageIndex]) {
        stagedImages[index] = null;
      }
    }
    self.setState({stagedImages});
    // TODO where to scroll after deleting? How to do this safely
    // while also dispatching an action?
    changeImageIndex(0);
    self.props.dispatch({
      type: actions.deleteImage,
      index: currentImageIndex
    });
  };

  self.render = function () {
    const {task, workspace} = self.props;
    const {images, originalImagesLoaded, currentImageIndex} = workspace;
    const {originalImagesURLs} = task;
    const {stagedImages} = self.state;
    return (
      <div>
        <table>
          <tbody>
            <tr>
              <td>
                <div style={{maxHeight: (THUMBNAILS_COUNT * THUMB_HEIGHT)+'px', overflowY: 'scroll'}}>
                  <ThumbnailsContainer load={originalImagesLoaded} images={images} changeImageIndex={changeImageIndex} currentImageIndex={currentImageIndex}/>
                </div>
              </td>
              <td>
                <BigImageContainer load={originalImagesLoaded} image={images[currentImageIndex]} index={currentImageIndex} showDelete={currentImageIndex >= originalImagesURLs.length} deleteImage={deleteImage}/>
              </td>
            </tr>
            <tr>
              <td colSpan="2" className="actionPanelContainer">
                <ActionPanel stagedImages={stagedImages} updateStage={updateStage} applyOperation={applyOperation} load={originalImagesLoaded}/>
              </td>
            </tr>
          </tbody>
        </table>
        {/* Temporary hack: images are loaded by the view, should be loaded by a saga. */}
        <div style={{display: "none"}}>
          {originalImagesURLs.map(function(imageURL, imageIndex) {
            return <img src={imageURL} onLoad={onImageLoad} data-index={imageIndex} key={imageIndex}/>;
          })}
        </div>
      </div>
    );
    // <CanvasImage image={{operationType: "binary", operation: "subtract", first: {operationType: "unary", id: 17, first: {operationType: "image", id: 0}, operation: "extractRed"}, second: {operationType: "image", id:1}}} load={self.state.originalImagesLoaded} />
  };
});
