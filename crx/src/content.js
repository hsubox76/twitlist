import { sendMessage } from "./util";
import { ACTION, APP_URL } from "../../shared/constants";
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
let isDarkTheme = false;

// Listens for messages from background.js
chrome.runtime.onMessage.addListener(request => {
  console.log("Request received:", request);
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
sendMessage({ action: ACTION.BG.GET_USER }).then(response => {
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
    infoEl.setAttribute("title", knownUsers[screenname].description);
  } else {
    const existingInfoEl = getChildWithClass(
      containerEl,
      "twitlist-info-container"
    );
    deleteElement(existingInfoEl);
  }
}

function updateActionLink(containerEl, screenname) {
  const actionLinkEl = getOrCreateChildWithClass(containerEl, "action-link", {
    tag: "a",
    target: "twitlisttab"
  });
  let link = `${APP_URL}?screenname=${screenname}`;
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
  const containerSelect = document.getElementsByClassName(
    "twitlist-ui-container"
  );
  const containerEls = Array.prototype.slice.call(containerSelect);
  for (const containerEl of containerEls) {
    containerEl.innerHTML = "";
    containerEl.parentElement.removeChild(containerEl);
  }
}

function getTweetContentElement(tweetEl) {
  const timeElement = tweetEl.querySelector("time");
  if (!timeElement) return null;
  const userInfoHeight = timeElement.parentElement.clientHeight;
  let currentElement = timeElement.parentElement;
  while (
    currentElement.parentElement &&
    currentElement.parentElement !== tweetEl
  ) {
    currentElement = currentElement.parentElement;
    // Keep going up a parent until the height significantly changes,
    // indicating it now includes the tweet body.
    // Use 1.9 to allow some space for emojis, verified icons, etc.
    if (currentElement.clientHeight > userInfoHeight * 1.9) {
      break;
    }
  }
  if (currentElement && currentElement.children[1]) {
    return currentElement.children[1];
  }
  return null;
}

function getOrCreateContainerEl(tweetEl) {
  let containerEl = null;
  let containerClass = "twitlist-ui-container";
  if (isDarkTheme) {
    containerClass += " twitlist-ui-container-dark";
  }
  const existingContainerEl = getChildWithClass(
    tweetEl,
    "twitlist-ui-container"
  );
  if (existingContainerEl) {
    containerEl = existingContainerEl;
  } else {
    const tweetTextEl = getTweetContentElement(tweetEl);
    if (tweetTextEl && tweetTextEl.parentElement) {
      containerEl = buildElement({ className: containerClass });
      tweetTextEl.parentElement.insertBefore(containerEl, tweetTextEl);
    }
  }
  return containerEl;
}

function getScreennameEl(tweetEl) {
  const linkEls = tweetEl.querySelectorAll("a");
  for (const linkEl of linkEls) {
    const hrefAttr = linkEl.getAttribute("href");
    if (hrefAttr.match(/^\/([^\/]+)$/)) {
      return linkEl;
    }
  }
  // Didn't find a match?
  return null;
}

function getScreennameFromTweetEl(tweetEl) {
  const screennameEl = getScreennameEl(tweetEl);
  if (!screennameEl) return null;
  const hrefAttr = screennameEl.getAttribute("href");
  return hrefAttr.slice(1);
}

function addTweetUI() {
  if (!user || !shouldShowUI) return;
  let tweetEls = document.querySelectorAll('article div[data-testid="tweet"]');
  const themeMeta = document.head.querySelector('meta[name="theme-color"]');
  const theme = themeMeta ? themeMeta.content : "";
  if (theme === "#FFFFFF") {
    isDarkTheme = false;
  } else {
    isDarkTheme = true;
  }
  for (const tweetEl of tweetEls) {
    const screenname = getScreennameFromTweetEl(tweetEl);
    if (!screenname) continue;
    const screennameLower = screenname.toLowerCase();

    let retweetAnchorEl, retweeterScreenname;
    tweetEl.querySelectorAll("a").forEach(item => {
      if (item.textContent.includes("Retweeted")) {
        retweetAnchorEl = item;
      }
    });
    if (retweetAnchorEl) {
      retweeterScreenname = retweetAnchorEl.getAttribute('href').slice(1);
    }

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
      containerEl.innerHTML = "";
    }
    updateInfoEl(containerEl, screennameLower);
    updateActionLink(containerEl, screennameLower);
  }
}

function updateTweetUI() {
  shouldShowUI ? addTweetUI() : removeTweetUI();
}

createMutationObservers(updateTweetUI);
