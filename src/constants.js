
export const THUMBNAILS_COUNT = 4;
export const IMAGE_WIDTH = 400;
export const IMAGE_HEIGHT = 400;
export const THUMB_WIDTH = 100;
export const THUMB_HEIGHT = 100;

export const OPERATIONS = [
  {
    name: "noOp",
    longName: "Select operation",
    description: "",
    numOperands: 0
  },
  {
    name: "negate",
    longName: "Negate image",
    description: "Negate the selected image.",
    numOperands: 1
  },
  {
    name: "extractRed",
    longName: "Extract Red",
    description: "Extract red from the image.",
    numOperands: 1
  },
  {
    name: "extractGreen",
    longName: "Extract Green",
    description: "Extract green from the image.",
    numOperands: 1
  },
  {
    name: "extractBlue",
    longName: "Extract Blue",
    description: "Extract blue from the image.",
    numOperands: 1
  },
  {
    name: "mean",
    longName: "Average two images",
    description: "Take average of two images.",
    numOperands: 2
  },
  {
    name: "subtract",
    longName: "Subtract an image from another",
    description: "Subtract one image from another image.",
    numOperands: 2
  },
  {
    name: "brightness",
    longName: "Change image brightness",
    description: "Change the brightness of the image.",
    numOperands: 1,
    params: [{
      type: "numeric",
      default: 10,
      min: 0,
      max: 128,
      step: 1,
      precision: 0
    }]
  }
];

