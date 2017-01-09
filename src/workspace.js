import React from 'react';
import EpicComponent from 'epic-component';
import {include, defineAction, addReducer} from 'epic-linker';
import WorkspaceBuilder from 'alkindi-task-lib/simple_workspace';

import {View} from './views';

export default function* (deps) {

  /* Actions dispatched by the workspace */

  yield defineAction('addImage', 'Workspace.AddImage');
  yield defineAction('deleteImage', 'Workspace.DeleteImage');

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
    return {images, nextID: images.length};
  };

  const dump = function (workspace) {
    // Extract the smallest part of the workspace that is needed to rebuild it.
    const {images, nextID} = workspace;
    return {images, nextID};
  };

  const load = function (dump) {
    // Use a saved dump to rebuild a workspace.  Any computation that depends
    // on the task is done in update.
    const {images, nextID} = dump;
    return {images, nextID};
  };

  const update = function (task, workspace) {
    return {...workspace};
  };

  yield include(WorkspaceBuilder({init, dump, load, update, View: View(deps)}));

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
};
