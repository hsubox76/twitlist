import { sendMessage } from "./util";
import { ACTION, APP_URL } from "../../shared/constants";
import {
  deleteElement,
  buildElement,
  appendNewElement,
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

const listSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M464 480H48c-26.51 0-48-21.49-48-48V80c0-26.51 21.49-48 48-48h416c26.51 0 48 21.49 48 48v352c0 26.51-21.49 48-48 48zM128 120c-22.091 0-40 17.909-40 40s17.909 40 40 40 40-17.909 40-40-17.909-40-40-40zm0 96c-22.091 0-40 17.909-40 40s17.909 40 40 40 40-17.909 40-40-17.909-40-40-40zm0 96c-22.091 0-40 17.909-40 40s17.909 40 40 40 40-17.909 40-40-17.909-40-40-40zm288-136v-32c0-6.627-5.373-12-12-12H204c-6.627 0-12 5.373-12 12v32c0 6.627 5.373 12 12 12h200c6.627 0 12-5.373 12-12zm0 96v-32c0-6.627-5.373-12-12-12H204c-6.627 0-12 5.373-12 12v32c0 6.627 5.373 12 12 12h200c6.627 0 12-5.373 12-12zm0 96v-32c0-6.627-5.373-12-12-12H204c-6.627 0-12 5.373-12 12v32c0 6.627 5.373 12 12 12h200c6.627 0 12-5.373 12-12z"/></svg>';
const plusSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm144 276c0 6.6-5.4 12-12 12h-92v92c0 6.6-5.4 12-12 12h-56c-6.6 0-12-5.4-12-12v-92h-92c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h92v-92c0-6.6 5.4-12 12-12h56c6.6 0 12 5.4 12 12v92h92c6.6 0 12 5.4 12 12v56z"/></svg>';
// const questSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M504 256c0 136.997-111.043 248-248 248S8 392.997 8 256C8 119.083 119.043 8 256 8s248 111.083 248 248zM262.655 90c-54.497 0-89.255 22.957-116.549 63.758-3.536 5.286-2.353 12.415 2.715 16.258l34.699 26.31c5.205 3.947 12.621 3.008 16.665-2.122 17.864-22.658 30.113-35.797 57.303-35.797 20.429 0 45.698 13.148 45.698 32.958 0 14.976-12.363 22.667-32.534 33.976C247.128 238.528 216 254.941 216 296v4c0 6.627 5.373 12 12 12h56c6.627 0 12-5.373 12-12v-1.333c0-28.462 83.186-29.647 83.186-106.667 0-58.002-60.165-102-116.531-102zM256 338c-25.365 0-46 20.635-46 46 0 25.364 20.635 46 46 46s46-20.636 46-46c0-25.365-20.635-46-46-46z"/></svg>';

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

function updateInfoEl(contentEl, screenname) {
  const tooltipEl = contentEl.parentElement.querySelector(
    ".twitlist-tooltip-icon"
  );
  if (knownUsers[screenname]) {
    const infoEl = getOrCreateChildWithClass(
      contentEl,
      "twitlist-info-container",
      {
        text: knownUsers[screenname].description,
        title: knownUsers[screenname].description
      }
    );
    tooltipEl.innerHTML = listSvg;
    // If element exists but content has changed.
    infoEl.textContent = knownUsers[screenname].description;
    infoEl.setAttribute("title", knownUsers[screenname].description);
  } else {
    const existingInfoEl = getChildWithClass(
      contentEl,
      "twitlist-info-container"
    );
    tooltipEl.innerHTML = plusSvg;
    deleteElement(existingInfoEl);
  }
}

function updateActionLink(contentEl, screenname) {
  const actionTextEl = getOrCreateChildWithClass(contentEl, "action-link", {
    tag: "a"
  });
  if (knownUsers[screenname]) {
    actionTextEl.textContent = "click to edit";
  } else {
    actionTextEl.textContent = "click to add a note about this user";
  }
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

function updateNote(e) {
  const containerEl = document.getElementById("edit-note");
  const screenname = containerEl.dataset["screenname"];
  const description = document.getElementById("edit-note-input").value;
  if (!screenname) {
    console.error("screenname missing, cannot update note");
  }
  sendMessage({ action: ACTION.BG.UPDATE_NOTE, description, screenname }).then(
    response => {
      if (response.success) {
        removeEditUI();
      } else if (response.error) {
        console.error(response.error);
      }
    }
  );
}

function addEditUI(containerEl) {
  const contentEl = containerEl.querySelector(".twitlist-content-container");
  containerEl.id = "edit-note";
  contentEl.innerHTML = "";
  const formEl = getOrCreateChildWithClass(contentEl, "twitlist-edit-form", {
    tag: "form"
  });
  let currentText = "";
  if (knownUsers && containerEl.dataset["screenname"]) {
    const note = knownUsers[containerEl.dataset["screenname"]];
    if (note) {
      currentText = note.description;
    }
  }
  appendNewElement(formEl, {
    tag: "input",
    placeholder: "add a note",
    id: "edit-note-input",
    defaultValue: currentText,
    autocomplete: "off"
  });
  const controlsContainer = appendNewElement(formEl, {
    className: "controls-container"
  });
  appendNewElement(controlsContainer, {
    tag: "a",
    text: "manage notes",
    className: "manage",
    href: APP_URL,
    target: "twitlisttab"
  });
  const buttonContainer = appendNewElement(controlsContainer, {
    className: "button-container"
  });
  appendNewElement(buttonContainer, {
    tag: "button",
    text: "save",
    className: "save",
    onClick: updateNote
  });
  appendNewElement(buttonContainer, {
    tag: "button",
    text: "cancel",
    className: "cancel",
    onClick: removeEditUI
  });
}

function removeEditUI() {
  const existingEditNote = document.querySelector("#edit-note");
  const screenname = existingEditNote.dataset["screenname"];
  const contentEl = existingEditNote.querySelector(
    ".twitlist-content-container"
  );
  existingEditNote.id = null;
  contentEl.innerHTML = "";
  updateInfoEl(contentEl, screenname);
  updateActionLink(contentEl, screenname);
}

function handleNoteClick(e) {
  if (e.target.classList.contains("manage")) {
    return;
  }
  e.preventDefault();
  const uiContainer =
    e.target.closest(".twitlist-ui-container") ||
    e.target.closest(".twitlist-rt-ui-container");
  if (!uiContainer || uiContainer.id === "edit-note") {
    return;
  }
  addEditUI(uiContainer);
}

function getOrCreateRTContainerEl(rtAnchorEl, rtScreenname) {
  let containerEl = null;
  let contentEl = null;
  let containerClass = "twitlist-rt-ui-container";
  if (isDarkTheme) {
    containerClass += " twitlist-rt-ui-container-dark";
  }
  const existingContainerEl = getChildWithClass(
    rtAnchorEl.parentElement.parentElement,
    "twitlist-rt-ui-container"
  );
  if (existingContainerEl) {
    containerEl = existingContainerEl;
    contentEl = getChildWithClass(containerEl, "twitlist-content-container");
  } else {
    if (rtAnchorEl.parentElement.parentElement) {
      containerEl = buildElement({
        tag: "a",
        className: containerClass,
        onClick: handleNoteClick,
        data: {
          screenname: rtScreenname
        }
      });
      appendNewElement(containerEl, {
        className: "twitlist-tooltip-icon",
        innerHTML: listSvg
      });
      contentEl = appendNewElement(containerEl, {
        className: "twitlist-content-container"
      });
      rtAnchorEl.parentElement.parentElement.insertBefore(
        containerEl,
        rtAnchorEl.parentElement
      );
      rtAnchorEl.parentElement.parentElement.style.flexDirection = "row";
    }
  }
  return contentEl;
}

function getOrCreateContainerEl(tweetEl, screenname) {
  let containerEl = null;
  let contentEl = null;
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
    const timeElement = tweetEl.querySelector("time");
    if (!timeElement) return null;
    const timeLink = timeElement.closest("a");
    if (timeLink && timeLink.parentElement) {
      containerEl = buildElement({
        tag: "a",
        className: containerClass,
        onClick: handleNoteClick,
        data: {
          screenname
        }
      });
      appendNewElement(containerEl, {
        className: "twitlist-tooltip-icon",
        innerHTML: plusSvg
      });
      contentEl = appendNewElement(containerEl, {
        className: "twitlist-content-container"
      });
      timeLink.parentElement.insertBefore(containerEl, timeLink);
    }
  }
  return contentEl;
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
    tweetEl.parentElement.querySelectorAll("a").forEach(item => {
      if (item.textContent.includes("Retweeted")) {
        retweetAnchorEl = item;
      }
    });
    if (retweetAnchorEl) {
      retweeterScreenname = retweetAnchorEl.getAttribute("href") || "";
      if (retweeterScreenname) {
        retweeterScreenname = retweeterScreenname.slice(1).toLowerCase();
      }
      const rtContentEl = getOrCreateRTContainerEl(
        retweetAnchorEl,
        retweeterScreenname
      );
      const existingRTInfoEl = getChildWithClass(
        rtContentEl,
        "twitlist-info-container"
      );
      if (rtContentEl.parentElement.id !== "edit-note") {
        if (!existingRTInfoEl) {
          // clear it out if it only had an action link.
          rtContentEl.innerHTML = "";
        }
        updateInfoEl(rtContentEl, retweeterScreenname);
        updateActionLink(rtContentEl, retweeterScreenname);
      }
    }

    // User doesn't need to add notes to themselves.
    if (screennameLower === user.displayName) continue;

    const contentEl = getOrCreateContainerEl(tweetEl, screennameLower);
    if (!contentEl) continue;
    if (contentEl.parentElement.id === "edit-note") {
      continue;
    }

    const existingInfoEl = getChildWithClass(
      contentEl,
      "twitlist-info-container"
    );
    if (!existingInfoEl) {
      // clear it out if it only had an action link.
      contentEl.innerHTML = "";
    }
    updateInfoEl(contentEl, screennameLower);
    updateActionLink(contentEl, screennameLower);
  }
}

function updateTweetUI() {
  shouldShowUI ? addTweetUI() : removeTweetUI();
}

createMutationObservers(updateTweetUI);
