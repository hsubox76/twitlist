const { COLL, VISIBILITY } = require('../functions/constants');

const ACTION = {
  BG: {
    GET_UI_VISIBILITY: "GET_UI_VISIBILITY",
    TOGGLE_UI: "TOGGLE_UI",
    GET_USER: "GET_USER",
    SIGN_IN_USER: "SIGN_IN_USER",
    GET_LIST: "GET_LIST",
    SIGN_OUT: "SIGN_OUT",
    UPDATE_NOTE: "UPDATE_NOTE"
  },
  PAGE: {
    UPDATE_USER: "UPDATE_USER",
    RENDER_LIST: "RENDER_LIST",
    HIDE_LIST: "HIDE_LIST",
  }
};

const APP_URL = 'https://twitlist.net';

module.exports = {
  COLL,
  VISIBILITY,
  ACTION,
  APP_URL
};