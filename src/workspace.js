import React from 'react';
import EpicComponent from 'epic-component';
import {include, defineAction, addReducer} from 'epic-linker';
import WorkspaceBuilder from 'alkindi-task-lib/simple_workspace';
import update from 'immutability-helper';

import {View} from './views';

export default function* (deps) {

  /* Actions dispatched by the workspace */

  yield defineAction('addImage', 'Workspace.AddImage');
  yield defineAction('deleteImage', 'Workspace.DeleteImage');

  yield defineAction('imageLoaded', 'Workspace.Image.Loaded');

  /* Simple workspace interface: init, dump, load, update, View */

  const init = function (task) {
    const {originalImagesURLs} = task;
    let images =[];
    for(let index = 0; index < originalImagesURLs.length; index++) {
      let imageURL = originalImagesURLs[index];
      let image = {
        operationType: "image",
        operation: null,
        first: null,
        second: null,
        id: index
      };
      images.push(image);
    }
    return {
      images,
      nextID: images.length,
      nOriginalImagesLoaded: 0,
      originalImagesLoaded: false
    };
  };

  const dump = function (workspace) {
    // Extract the smallest part of the workspace that is needed to rebuild it.
    const {images, nextID} = workspace;
    return {images: images.map(dumpImage), nextID};
  };
  function dumpImage (image) {
    const {operationType, operation, first, second} = image;
    return {operationType, operation, first, second};
  }

  const load = function (dump) {
    // Use a saved dump to rebuild a workspace.  Any computation that depends
    // on the task is done in update.
    const {images, nextID} = dump;
    return {images: images.map(loadImage), nextID};
  };
  function loadImage (image, id) {
    const {operationType, operation, first, second} = image;
    return {operationType, operation, first, second, id};
  }

  const updateWorkspace = function (task, workspace) {
    return {...workspace};
  };

  yield include(WorkspaceBuilder({init, dump, load, update: updateWorkspace, View: View(deps)}));

  /*
    Add reducers for workspace actions and any needed sagas below:
  */

  // Add an image based on previous images.
  yield addReducer('addImage', function (state, action) {
    const {first, second, operationType, operation} = action;
    let {workspace} = state;
    let {images, nextID} = workspace;
    let image = {operationType, operation, first, second, id: nextID};
    images = [...images, image];
    nextID++;
    workspace = {...workspace, images, nextID};
    return {...state, workspace};
  });

  // Update the key so that the plain word appears at a specific position in
  // the deciphered text.
  yield addReducer('deleteImage', function (state, action) {
    const {index} = action;
    let {workspace} = state;
    let {images} = workspace;
    images = images.slice(0);
    images.splice(index, 1);
    workspace = {...workspace, images};
    return {...state, workspace};
  });

  yield addReducer('imageLoaded', function (state, action) {
    const {index, element} = action;
    // state.workspace.images[index].element = element
    console.log("loaded", index, element);
    const nOriginalImagesLoaded = state.workspace.nOriginalImagesLoaded + 1;
    const changes = {
      workspace: {
        images: {[index]: {element: {$set: element}}},
        nOriginalImagesLoaded: {$set: nOriginalImagesLoaded}
      }
    };
    if (nOriginalImagesLoaded == state.workspace.images.length) {
      changes.workspace.originalImagesLoaded = {$set: true};
    }
    return update(state, changes);
  });

};
