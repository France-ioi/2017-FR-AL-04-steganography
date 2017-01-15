
export const THUMBNAILS_COUNT = 4;
export const IMAGE_WIDTH = 400;
export const IMAGE_HEIGHT = 400;
export const THUMB_WIDTH = 100;
export const THUMB_HEIGHT = 100;

export const OPERATIONS = [
  {
    name: "noOp",
    description: "Select operation",
    numOperands: 0
  },
  {
    name: "negate",
    description: "Negate image",
    numOperands: 1
  },
  {
    name: "extractRed",
    description: "Extract Red",
    numOperands: 1
  },
  {
    name: "extractGreen",
    description: "Extract Green",
    numOperands: 1
  },
  {
    name: "extractBlue",
    description: "Extract Blue",
    numOperands: 1
  },
  {
    name: "mean",
    description: "Average two images",
    numOperands: 2
  },
  {
    name: "subtract",
    description: "Subtract an image from another",
    numOperands: 2
  },
  {
    name: "brightness",
    description: "Change image brightness",
    numOperands: 1,
    params: [{
      type: "numeric",
      default: 1
    }]
  }
];

