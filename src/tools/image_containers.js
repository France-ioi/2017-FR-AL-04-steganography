import React from "react";
import {Button} from "react-bootstrap";

import {
  IMAGE_WIDTH,
  IMAGE_HEIGHT,
  THUMB_WIDTH,
  THUMB_HEIGHT,
} from "../constants";

// A canvas tag. props:
// image (binary tree representation of image operations).
const CanvasImage = ({image, size}) => {
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
    return (
      <div
        className="noImage"
        style={{width: width + "px", height: height + "px"}}
      >
        pas d'image
      </div>
    );
  }
  return (
    <img
      src={image.src}
      width={IMAGE_WIDTH}
      height={IMAGE_HEIGHT}
      style={{width: width + "px", height: height + "px"}}
      title={image.expr}
    />
  );
};

// Container for a canvas image. props:
// size - big or small.
// selected - whether to display a thick border.
// image - the image tree object.
export const CanvasImageContainer = ({image, size}) => {
  return <CanvasImage image={image} size={size} />;
};

// One of the thumbnail on the left. props:
// image - the tree representing this image.
// index - the index to show to the left of the image.
// selected - is this image currently selected (for border display).
const Thumbnail = props => {
  const {index, image, selected} = props;
  const onClick = function () {
    props.onClick(index);
  };
  const className = selected ? "selected" : "unselected";
  const thumbnailClassName = `thumbnail ${className}`;
  return (
    <div onClick={onClick} className={thumbnailClassName}>
      <span className="thumbnail-image-name">{image.name}</span>
      <span className="thumbnail-image">
        <CanvasImageContainer size="small" image={image} selected={selected} />
      </span>
    </div>
  );
};

// The thumbnails on the left. props:
// images - list of images.
// currentImageIndex - current image index.
// changeImageIndex - function to change the current image index.
export const ThumbnailsContainer = props => {
  const {changeImageIndex, images, currentImageIndex} = props;
  const clickImage = function (imageIndex) {
    changeImageIndex(imageIndex);
  };
  return (
    <div className="thumbnails-container">
      {images.map((image, index) => {
        return (
          <Thumbnail
            onClick={clickImage}
            key={index}
            image={image}
            selected={index === currentImageIndex}
            index={index}
          />
        );
      })}
    </div>
  );
};

// Container of the large image. props:
// image - the image show.
// showDelete - show delete button.
// deleteImage - to call on click.
export const BigImageContainer = props => {
  const {image, showDelete, deleteImage} = props;
  const renderDelete = () => {
    return (
      <Button onClick={deleteImage}>
        Supprimer <i className="fa fa-times" aria-hidden="true" />
      </Button>
    );
  };
  return (
    <div className="bigImageContainer">
      <div className="image-name">
        {image.name} {showDelete && renderDelete()}
      </div>
      <CanvasImageContainer image={image} selected={false} size="big" />
    </div>
  );
};
