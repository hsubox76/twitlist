import { renderTableContainer } from "./table-custom";
import { appendNewElement } from "../../../shared/dom-utils";
import { addSharee, removeSharee, updateListProperties } from "../db";
import { VISIBILITY } from "../../../shared/constants";

export function renderSharedWith(
  { user, listProperties },
  parent,
  { refreshList }
) {
  function onSubmitSharee(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const screenname = formData.get("add-sharee-screenname");
    const inputEl = document.getElementById("add-sharee-screenname");
    const buttonEl = document.getElementById("add-sharee-button");
    inputEl.setAttribute("disabled", true);
    buttonEl.setAttribute("disabled", true);
    e.target.classList.add("disabled");
    // TODO: Validate screenname more carefully.
    if (screenname) {
      addSharee(user.uid, screenname).then(() => {
        refreshList();
      });
    }
  }
  function onUnshareClick(e) {
    e.preventDefault();
    const data = e.target.dataset;
    const screenname = data.screenname;
    const uid = data.uid;
    if (screenname) {
      removeSharee(user.uid, screenname, uid).then(() => {
        refreshList();
      });
    }
  }
  function onVisibilityToggle(e) {
    updateListProperties(user.uid, { visibility: e.target.value }).then(() =>
      refreshList()
    );
  }
  const { container, table } = renderTableContainer(
    parent,
    "shared-with",
    "This list can be seen by"
  );
  const tableHeader = container.getElementsByTagName("h2")[0];
  const visibilitySelect = appendNewElement(tableHeader, {
    tag: "select",
    className: "visibility-select",
    value: listProperties.visibility,
    onChange: onVisibilityToggle
  });
  appendNewElement(visibilitySelect, {
    tag: "option",
    text: "nobody",
    selected: listProperties.visibility === VISIBILITY.PRIVATE,
    value: VISIBILITY.PRIVATE
  });
  appendNewElement(visibilitySelect, {
    tag: "option",
    text: "certain users (listed below)",
    selected: listProperties.visibility === VISIBILITY.SHARED,
    value: VISIBILITY.SHARED
  });
  appendNewElement(visibilitySelect, {
    tag: "option",
    text: "everyone",
    selected: listProperties.visibility === VISIBILITY.PUBLIC,
    value: VISIBILITY.PUBLIC
  });
  if (listProperties.visibility !== VISIBILITY.SHARED) {
    const publicLinkContainer = appendNewElement(container, {
      className: "public-link-container"
    });
    appendNewElement(publicLinkContainer, {
      text: "Public link where others can view:"
    });
    appendNewElement(publicLinkContainer, {
      tag: "a",
      text: `https://twitlist.net/${user.uid}`,
      href: `https://twitlist.net/${user.uid}`
    });
    return;
  }
  const addShareeForm = appendNewElement(container, {
    tag: "form",
    id: "add-sharee-form",
    onSubmit: onSubmitSharee
  });
  appendNewElement(addShareeForm, {
    text: "share with @"
  });
  appendNewElement(addShareeForm, {
    tag: "input",
    id: "add-sharee-screenname",
    name: "add-sharee-screenname",
    placeholder: "twitterusername"
  });
  appendNewElement(addShareeForm, {
    tag: "button",
    className: "button-ok",
    id: "add-sharee-button",
    text: "share"
  });
  if (
    !listProperties.sharedWithScreennames ||
    listProperties.sharedWithScreennames.size === 0
  ) {
    appendNewElement(table, {
      className: "empty-list-message",
      text: "You are not sharing this list with anyone."
    });
    return;
  }
  const sortedKeys = Object.keys(listProperties.sharedWithScreennames).sort();
  for (const screenname of sortedKeys) {
    const userRow = appendNewElement(table, {
      className: "user-row"
    });
    const usernameCell = appendNewElement(userRow, {
      className: "username-cell"
    });
    appendNewElement(usernameCell, {
      tag: "a",
      href: `https://twitter.com/${screenname}`,
      target: "_blank",
      text: `@${screenname}`
    });
    const shareeUid = listProperties.sharedWithScreennames[screenname];
    appendNewElement(userRow, {
      className: "registered-cell",
      text: shareeUid === "_" ? "not registered" : "registered"
    });
    const editCell = appendNewElement(userRow, { className: "edit-cell" });
    appendNewElement(editCell, {
      tag: "a",
      onClick: onUnshareClick,
      data: {
        screenname: screenname,
        uid: shareeUid === "_" ? null : shareeUid
      },
      text: "unshare"
    });
  }
}
