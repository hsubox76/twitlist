const COLL = {
  PENDING_SHARES: 'pendingShares',
  LISTS: 'lists',
  USERS: 'users',
  SCREEN_NAMES: 'screenNames',
  NOTES: 'notes'
}

const VISIBILITY = {
  PRIVATE: 'private',
  SHARED: 'shared',
  PUBLIC: 'public' // list global only
};

const ACTION = {
  BG: {
    GET_UI_VISIBILITY: "GET_UI_VISIBILITY",
    TOGGLE_UI: "TOGGLE_UI",
    GET_USER: "GET_USER",
    SIGN_IN_USER: "SIGN_IN_USER",
    GET_LIST: "GET_LIST",
    SIGN_OUT: "SIGN_OUT"
  },
  PAGE: {
    UPDATE_USER: "UPDATE_USER",
    RENDER_LIST: "RENDER_LIST",
    HIDE_LIST: "HIDE_LIST",
  }
};

module.exports = {
  COLL,
  VISIBILITY,
  ACTION
};