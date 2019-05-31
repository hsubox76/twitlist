import { sendMessage } from "./util";
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

// Listens for messages from background.js
chrome.runtime.onMessage.addListener(request => {
  console.log('Request received:', request);
  if (request.action === "RENDER_LIST") {
    knownUsers = request.knownUsers;
    addTweetUI();
    startMutationObservers();
  }
  if (request.action === "UPDATE_USER") {
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

// Asks background process for current user.  If user is found,
// asks background process to fetch user's list.
sendMessage({ action: "GET_USER" })
  .then(response => {
    if (response.user) {
      user = response.user;
      return sendMessage({ action: "GET_LIST", uid: response.user.uid });
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
  let link = `http://localhost:8080?screenname=${screenname}&tid=${userId}`;
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
  const containerEls = document.getElementsByClassName("twitlist-ui-container");
  for (const containerEl of containerEls) {
    if (containerEl.parentElement) {
      containerEl.innerHTML = "";
      containerEl.parentElement.removeChild(containerEl);
    }
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

createMutationObservers(addTweetUI);
