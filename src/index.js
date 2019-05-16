import algoreaReactTask from "./algorea_react_task";
import {updateWorkspace} from "./utils";

import "font-awesome/css/font-awesome.css";
import "bootstrap/dist/css/bootstrap.css";
import "rc-tooltip/assets/bootstrap.css";
import "./platform.css";
import "./style.css";

import WorkspaceBundle from "./workspace_bundle";

const emptyWorkspace = {
  images: [],
  currentImageIndex: 0,
  currentOperationIndex: 0,
  stagedImages: [null, null],
  operationParams: [],
  resultName: "",
  resultNameChanged: false
};

const TaskBundle = {
  actionReducers: {
    appInit: appInitReducer,
    taskInit: taskInitReducer /* possibly move to algorea-react-task */,
    taskRefresh: taskRefreshReducer /* possibly move to algorea-react-task */,
    taskAnswerLoaded: taskAnswerLoaded,
    taskStateLoaded: taskStateLoaded
  },
  includes: [WorkspaceBundle],
  selectors: {
    getTaskState,
    getTaskAnswer
  }
};

if (process.env.NODE_ENV === "development") {
  /* eslint-disable no-console */
  TaskBundle.earlyReducer = function (state, action) {
    console.log("ACTION", action.type, action);
    return state;
  };
}

function appInitReducer (state, _action) {
  const taskMetaData = {
    id: "http://concours-alkindi.fr/tasks/2018/enigma",
    language: "fr",
    version: "fr.01",
    authors: "Sébastien Carlier",
    translators: [],
    license: "",
    taskPathPrefix: "",
    modulesPathPrefix: "",
    browserSupport: [],
    fullFeedback: true,
    acceptedAnswers: [],
    usesRandomSeed: true
  };
  return {...state, taskMetaData};
}

function taskInitReducer (state, _action) {
  const canvases = state.taskData.originalImagesURLs.map(_url => null);
  const imageCache = {};
  const dump = {images: []};
  const workspace = emptyWorkspace;
  return updateWorkspace({
    ...state,
    dump,
    workspace,
    canvases,
    imageCache,
    taskReady: true
  });
}

function taskRefreshReducer (state, _action) {
  return updateWorkspace(state);
}

function getTaskAnswer (state) {
  return state.answer;
}

function taskAnswerLoaded (state, {payload: {answer}}) {
  return {...state, answer};
}

function getTaskState (state) {
  return state.dump;
}

function taskStateLoaded (state, {payload: {dump}}) {
  const workspace = {...emptyWorkspace};
  return updateWorkspace({...state, dump, workspace});
}

export function run (container, options) {
  return algoreaReactTask(container, options, TaskBundle);
}
