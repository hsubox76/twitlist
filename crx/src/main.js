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
      startMutationObserver();
    }
  })
  .catch(e => console.error(e));

const tweetEls = document.getElementsByClassName("tweet");

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
  for (const tweetEl of tweetEls) {
    const existingContainerEl = getFirstChildWithClass(tweetEl, 'twitlist-ui-container');
    if (existingContainerEl && existingContainerEl.parentElement) {
      existingContainerEl.innerHtml = '';
      existingContainerEl.parentElement.removeChild(existingContainerEl);
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
    const contentEl = getFirstChildWithClass(tweetEl, 'content');
    const tweetTextEl = getFirstChildWithClass(tweetEl, 'js-tweet-text-container');
    if (contentEl && tweetTextEl) {
      contentEl.insertBefore(containerEl, tweetTextEl);
    } else {
      return null;
    }
  }
  return containerEl;
}

function addTweetUI() {
  for (const tweetEl of tweetEls) {
    const userId = tweetEl.dataset.userId;
    const screenname = tweetEl.dataset.screenName;
    if (!screenname) return;
    const screennameLower = screenname.toLowerCase();

    const containerEl = getContainerEl(tweetEl);
    if (!containerEl) return;

    updateInfoEl(containerEl, screennameLower);
    updateActionLink(containerEl, screennameLower, userId);
  }
}

const mutationObserver = new MutationObserver(function(mutations) {
  mutationObserver.disconnect();
  addTweetUI();
  setTimeout(() => startMutationObserver(), 100);
});

function startMutationObserver() {
  mutationObserver.observe(document.getElementById("timeline"), {
    childList: true,
    subtree: true
  });
}