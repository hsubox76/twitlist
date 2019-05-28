let knownUsers = {};

chrome.runtime.sendMessage({ need: "user" }, function(response) {
  if (response.user && response.user.uid) {
    console.log(response.user);
    chrome.runtime.sendMessage({ need: "list", uid: response.user.uid }, response => {
      if (response.error) {
        console.error(response.error);
      } else {
        knownUsers = response.knownUsers;
        addTweetUI();
        startMutationObserver();
      }
    });
  }
});

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
  }
  return infoEl;
}

function updateInfoEl(infoEl, userId) {
  if (knownUsers[userId]) {
    infoEl.textContent = knownUsers[userId].description;
  } else {
    infoEl.textContent = '???';
  }
}

function createButtonContainer() {
  const buttonContainer = document.createElement('div');
  const addNoteButton = document.createElement('button');
  addNoteButton.textContent = 'add a note';
  buttonContainer.appendChild(addNoteButton);
  return buttonContainer;
}

function addTweetUI() {
  for (const tweetEl of tweetEls) {
    const userId = tweetEl.dataset.userId;
    // const username = tweetEl.dataset.screenName;
    let containerEl;
    const existingContainerEl = getFirstChildWithClass(tweetEl, 'twitlist-ui-container');
    let infoEl;
    if (existingContainerEl) {
      containerEl = existingContainerEl;
      infoEl = getInfoEl(containerEl);
    } else {
      containerEl = document.createElement('div');
      containerEl.className = 'twitlist-ui-container';
      infoEl = getInfoEl(containerEl);
      containerEl.appendChild(infoEl);
      containerEl.appendChild(createButtonContainer());
      const contentEl = getFirstChildWithClass(tweetEl, 'content');
      const tweetTextEl = getFirstChildWithClass(tweetEl, 'js-tweet-text-container');
      if (contentEl && tweetTextEl) {
        contentEl.insertBefore(containerEl, tweetTextEl);
      }
    }
    updateInfoEl(infoEl, userId);
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