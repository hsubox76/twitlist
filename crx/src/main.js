import { sendMessage } from './util';
let knownUsers = {};
let user = null;

// Listens for messages from background.js
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'RENDER_LIST') {
    knownUsers = request.knownUsers;
    addTweetUI();
    startMutationObserver();
  }
  if (request.action === 'UPDATE_USER') {
    user = request.user;
    if (user === null) {
      knownUsers = {};
      mutationObserver.disconnect();
      removeTweetUI();
    } else {
      addTweetUI();
      startMutationObserver();
    }
  }
});

// Asks background process for current user.  If user is found,
// asks background process to fetch user's list.
sendMessage({ action: "GET_USER" })
  .then(response => {
    if (response.user) {
      user = response.user;
      return sendMessage({ action: "GET_LIST", uid: response.user.uid });
    } else {
      return {};
    }
  })
  .then(response => {
    if (response.error) {
      throw new Error(response.error);
    } else if (response.knownUsers) {
      knownUsers = response.knownUsers;
      addTweetUI();
      startMutationObservers();
    }
  })
  .catch(e => console.error(e));

function getFirstChildWithClass(parent, className) {
  if (!parent) return null;
  return parent.getElementsByClassName(className)[0];
}

function getInfoEl(containerEl) {
  const existingInfoEl = getFirstChildWithClass(containerEl, 'twitlist-info-container');
  let infoEl;
  if (existingInfoEl) {
    infoEl = existingInfoEl;
  } else {
    infoEl = document.createElement('div');
    infoEl.className = 'twitlist-info-container';
    containerEl.appendChild(infoEl);
  }
  return infoEl;
}

function getActionLinkEl(containerEl) {
  const existingActionLinkEl = getFirstChildWithClass(containerEl, 'action-link');
  let actionLinkEl;
  if (existingActionLinkEl) {
    actionLinkEl = existingActionLinkEl;
  } else {
    actionLinkEl = document.createElement('a');
    actionLinkEl.className = 'action-link';
    containerEl.appendChild(actionLinkEl);
  }
  return actionLinkEl;
}

function updateInfoEl(containerEl, screenname) {
  if (knownUsers[screenname]) {
    const infoEl = getInfoEl(containerEl);
    infoEl.textContent = knownUsers[screenname].description;
  } else {
    const existingInfoEl = getFirstChildWithClass(containerEl, 'twitlist-info-container');
    if (existingInfoEl) {
      containerEl.removeChild(existingInfoEl);
    }
  }
}

function updateActionLink(containerEl, screenname, userId) {
  const actionLinkEl = getActionLinkEl(containerEl);
  let link = `http://localhost:8080?screenname=${screenname}&tid=${userId}`;
  if (knownUsers[screenname]) {
    actionLinkEl.textContent = 'edit note';
    link += '&mode=edit';
  } else {
    actionLinkEl.textContent = 'add a note about this user';
  }
  actionLinkEl.setAttribute('href', link);
  actionLinkEl.setAttribute('target', '_blank');
}

function removeTweetUI() {
  const containerEls = document.getElementsByClassName("twitlist-ui-container");
  for (const containerEl of containerEls) {
    if (containerEl.parentElement) {
      containerEl.innerHtml = '';
      containerEl.parentElement.removeChild(containerEl);
    }
  }
}

function getContainerEl(tweetEl) {
  let containerEl;
  const existingContainerEl = getFirstChildWithClass(tweetEl, 'twitlist-ui-container');
  if (existingContainerEl) {
    containerEl = existingContainerEl;
  } else {
    containerEl = document.createElement('div');
    containerEl.className = 'twitlist-ui-container';
    const tweetTextEl = getFirstChildWithClass(tweetEl, 'js-tweet-text-container');
    if (tweetTextEl && tweetTextEl.parentElement) {
      tweetTextEl.parentElement.insertBefore(containerEl, tweetTextEl);
    } else {
      return null;
    }
  }
  return containerEl;
}

function addTweetUI() {
  console.log('addTweetUI called');
  const tweetEls = document.getElementsByClassName("tweet");
  for (const tweetEl of tweetEls) {
    const userId = tweetEl.dataset.userId;
    const screenname = tweetEl.dataset.screenName;
    if (!screenname) continue;
    const screennameLower = screenname.toLowerCase();

    const containerEl = getContainerEl(tweetEl);
    if (!containerEl) continue;

    updateInfoEl(containerEl, screennameLower);
    updateActionLink(containerEl, screennameLower, userId);
  }
}

// When tweets are added to UI (by scrolling, etc.)
const mutationObserver = new MutationObserver(function(mutations) {
  disconnectMutationObservers();
  addTweetUI();
  setTimeout(() => startMutationObservers(), 100);
});

// When permalink overlay is turned on or off.
const overlayMutationObserver = new MutationObserver(function(mutations) {
  disconnectMutationObservers();
  addTweetUI();
  setTimeout(() => startMutationObservers(), 100);
});

// When page changes (navigation within SPA)
const bodyMutationObserver = new MutationObserver(function(mutations) {
  console.log('body mutation observer triggered');
  disconnectMutationObservers();
  addTweetUI();
  setTimeout(() => startMutationObservers(), 100);
});

function disconnectMutationObservers() {
  mutationObserver.disconnect();
  overlayMutationObserver.disconnect();
  bodyMutationObserver.disconnect();
}

function startMutationObservers() {
  if (document.body) {
    bodyMutationObserver.observe(document.body, {
      attributeFilter: ['class']
    });
  }
  if (document.getElementById("timeline")) {
    mutationObserver.observe(document.getElementById("timeline"), {
      childList: true,
      subtree: true
    });
  }
  if (document.getElementById("permalink-overlay")) {
    overlayMutationObserver.observe(document.getElementById("permalink-overlay"), {
      childList: true,
      subtree: true
    });
  }
}
