import { sendMessage } from "./util";
import { ACTION, APP_URL } from '../../shared/constants';
import {
  deleteElement,
  buildElement,
  getChildWithClass,
  getOrCreateChildWithClass
} from "../../shared/dom-utils";
import {
  createMutationObservers,
  startMutationObservers,
  disconnectMutationObservers
} from "./observers";
let knownUsers = {};
let user = null;
let shouldShowUI = true;

// Listens for messages from background.js
chrome.runtime.onMessage.addListener(request => {
  console.log('Request received:', request);
  if (request.action === ACTION.PAGE.HIDE_LIST) {
    removeTweetUI();
    shouldShowUI = false;
  }
  if (request.action === ACTION.PAGE.RENDER_LIST) {
    shouldShowUI = true;
    if (request.knownUsers) {
      knownUsers = request.knownUsers;
    }
    addTweetUI();
    startMutationObservers();
  }
  if (request.action === ACTION.PAGE.UPDATE_USER) {
    user = request.user;
    if (user === null) {
      knownUsers = {};
      disconnectMutationObservers();
      removeTweetUI();
    } else {
      addTweetUI();
      startMutationObservers();
    }
  }
});

// TODO: Unsubscribe etc. on disconnect!
// chrome.runtime.connect().onDisconnect.addListener(function() {
  // clean up when content script gets disconnected
// })

// Asks background process for current user.  If user is found,
// asks background process to fetch user's list.
sendMessage({ action: ACTION.BG.GET_USER })
  .then(response => {
    if (response.user) {
      user = response.user;
      return sendMessage({ action: ACTION.BG.GET_LIST, uid: response.user.uid });
    }
  });

function updateInfoEl(containerEl, screenname) {
  if (knownUsers[screenname]) {
    const infoEl = getOrCreateChildWithClass(
      containerEl,
      "twitlist-info-container",
      {
        text: knownUsers[screenname].description,
        title: knownUsers[screenname].description
      }
    );
    // If element exists but content has changed.
    infoEl.textContent = knownUsers[screenname].description;
    infoEl.setAttribute('title', knownUsers[screenname].description);
  } else {
    const existingInfoEl = getChildWithClass(
      containerEl,
      "twitlist-info-container"
    );
    deleteElement(existingInfoEl);
  }
}

function updateActionLink(containerEl, screenname, userId) {
  const actionLinkEl = getOrCreateChildWithClass(containerEl, "action-link", {
    tag: 'a',
    target: 'twitlisttab'
  });
  let link = `${APP_URL}?screenname=${screenname}&tid=${userId}`;
  if (knownUsers[screenname]) {
    actionLinkEl.textContent = "view on twitlist";
    link += "&mode=edit";
  } else {
    actionLinkEl.textContent = "add a note about this user";
    link += "&mode=add";
  }
  actionLinkEl.setAttribute("href", link);
}

function removeTweetUI() {
  const containerSelect = document.getElementsByClassName("twitlist-ui-container");
  const containerEls = Array.prototype.slice.call(containerSelect);
  for (const containerEl of containerEls) {
    containerEl.innerHTML = "";
    containerEl.parentElement.removeChild(containerEl);
  }
}

function getOrCreateContainerEl(tweetEl) {
  let containerEl = null;
  const existingContainerEl = getChildWithClass(
    tweetEl,
    "twitlist-ui-container"
  );
  if (existingContainerEl) {
    containerEl = existingContainerEl;
  } else {
    const tweetTextEl = getChildWithClass(tweetEl, "js-tweet-text-container");
    if (tweetTextEl && tweetTextEl.parentElement) {
      containerEl = buildElement({ className: "twitlist-ui-container" });
      tweetTextEl.parentElement.insertBefore(containerEl, tweetTextEl);
    }
  }
  return containerEl;
}

function addTweetUI() {
  if (!user || !shouldShowUI) return;
  const tweetEls = document.getElementsByClassName("tweet");
  for (const tweetEl of tweetEls) {
    const userId = tweetEl.dataset.userId;
    const screenname = tweetEl.dataset.screenName;
    if (!screenname) continue;
    const screennameLower = screenname.toLowerCase();
    
    // User doesn't need to add notes to themselves.
    if (screennameLower === user.displayName) continue;

    const containerEl = getOrCreateContainerEl(tweetEl);
    if (!containerEl) continue;

    const existingInfoEl = getChildWithClass(
      containerEl,
      "twitlist-info-container"
    );
    if (!existingInfoEl) {
      // clear it out if it only had an action link.
      containerEl.innerHTML = '';
    }
    updateInfoEl(containerEl, screennameLower);
    updateActionLink(containerEl, screennameLower, userId);
  }
}

function updateTweetUI() {
  shouldShowUI ? addTweetUI() : removeTweetUI();
}

createMutationObservers(updateTweetUI);
