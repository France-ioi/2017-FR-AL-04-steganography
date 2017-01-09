
export const THUMBNAILS_COUNT = 4;
export const IMAGE_WIDTH = 400;
export const IMAGE_HEIGHT = 400;
export const THUMB_WIDTH = 100;
export const THUMB_HEIGHT = 100;

export const OPERATIONS = [
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

