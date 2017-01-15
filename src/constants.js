
import React from 'react';

export const THUMBNAILS_COUNT = 4;
export const IMAGE_WIDTH = 400;
export const IMAGE_HEIGHT = 400;
export const THUMB_WIDTH = 100;
export const THUMB_HEIGHT = 100;

export const OPERATIONS = [
  {
    name: "noOp",
    longName: "Sélectionnez un opérateur",
    description: "",
    numOperands: 0
  },
  {
    name: "negate",
    longName: "Négatif",
    description: () => (
       <div>
         Inverse chaque pixel P1 de l'image, compostante par composante :
         <ul>
            <li>resultat.rouge = 255 - P1.rouge</li>
            <li>resultat.vert = 255 - P1.vert</li>
            <li>resultat.bleu = 255 - P1.bleu</li>
         </ul>
       </div>),
    numOperands: 1
  },
  {
    name: "extractRed",
    longName: "Composante rouge",
    description: () => (
       <div>
         Extrait la composante rouge de chaque pixel P1 de l'image, en mettant à 0 la valeur des composantes verte et bleue :
         <ul>
            <li>resultat.rouge = P1.rouge</li>
            <li>resultat.vert = 0</li>
            <li>resultat.bleu = 0</li>
         </ul>
       </div>),
    numOperands: 1
  },
  {
    name: "extractGreen",
    longName: "Composante verte",
    description: () => (
       <div>
         Extrait la composante verte de chaque pixel P1 de l'image, en mettant à 0 la valeur des composantes rouge et bleue :
         <ul>
            <li>resultat.rouge = 0</li>
            <li>resultat.vert = P1.vert</li>
            <li>resultat.bleu = 0</li>
         </ul>
       </div>),
    numOperands: 1
  },
  {
    name: "extractBlue",
    longName: "Composante bleue",
    description: () => (
       <div>
         Extrait la composante bleue de chaque pixel P1 de l'image, en mettant à 0 la valeur des composantes rouge et verte :
         <ul>
            <li>resultat.rouge = 0</li>
            <li>resultat.vert = 0</li>
            <li>resultat.bleu = P1.bleu</li>
         </ul>
       </div>),
    numOperands: 1
  },
  {
    name: "mean",
    longName: "Moyenne de deux images",
    description: () => (
       <div>
         Prend la moyenne des deux images. Pour chaque pixel P1 de la 1ère image et le pixel P2 à la même position dans la 2ème image, on génère un pixel resultat comme ceci :
         <ul>
            <li>resultat.rouge = (P1.rouge + P2.rouge) / 2</li>
            <li>resultat.vert = (P1.vert + P2.vert) / 2</li>
            <li>resultat.bleu = (P1.bleu + P2.bleu) / 2</li>
         </ul>
       </div>),
    numOperands: 2
  },
  {
    name: "subtract",
    longName: "Soustraction de deux images",
    description: () => (
       <div>
         Effectue une soustraction entre deux images. Pour chaque pixel P1 de la 1ère image et le pixel P2 à la même position dans la 2ème image, on génère un pixel resultat tel que :
         <ul>
            <li>resultat.rouge = max(0, P1.rouge - P2.rouge)</li>
            <li>resultat.vert = max(0, P1.vert - P2.vert)</li>
            <li>resultat.bleu = max(0, P1.bleu - P2.bleu)</li>
         </ul>
       </div>),
    numOperands: 2
  },
  {
    name: "brightness",
    longName: "Changement de luminosité",
    description: () => (
       <div>
         Change la luminosité de l'image en multipliant chaque composante de chaque pixel P1 par un facteur que vous pouvez régler plus bas :
         <ul>
            <li>resultat.rouge = min(255, P1.rouge * facteur)</li>
            <li>resultat.vert = min(255, P1.vert * facteur)</li>
            <li>resultat.bleu = min(255, P1.bleu * facteur)</li>
         </ul>
       </div>),
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

