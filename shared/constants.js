const { COLL, VISIBILITY } = require('../functions/constants');

const ACTION = {
  BG: {
    GET_UI_VISIBILITY: "GET_UI_VISIBILITY",
    SET_UI_VISIBILITY: "SET_UI_VISIBILITY",
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

const UI_VISIBILITY = {
  SHOW_ALL: { id: 'vis-show-all', desc: 'Show icons on all tweets' },
  SHOW_HOVER: { id: 'vis-show-hover', desc: 'Show icons when hovering over tweet' },
  HIDE: { id: 'vis-hide', desc: 'Hide all icons, period' }
};

const APP_URL = 'https://twitlist.net';

module.exports = {
  COLL,
  VISIBILITY,
  ACTION,
  APP_URL,
  UI_VISIBILITY
};