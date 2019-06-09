import { renderTableContainer } from "./table-custom";
import { appendNewElement } from "../../../shared/dom-utils";
import { addSharee, removeSharee } from "../db";

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
    inputEl.setAttribute('disabled', true);
    // TODO: Validate screenname more carefully.
    if (screenname) {
      addSharee(user.uid, screenname)
        .then(() => {
          inputEl.setAttribute('disabled', false);
          inputEl.value = '';
          refreshList();
        });
    }
  }
  function onUnshareClick(e) {
    e.preventDefault();
    const data = e.target.dataset;
    const screenname = data.screenname;
    const uid = data.uid;
    // TODO: Validate screenname more carefully.
    if (screenname) {
      removeSharee(user.uid, screenname, uid).then(() => {
        refreshList();
      })
    }
  }
  const { container, table } = renderTableContainer(
    parent,
    "shared-with",
    "You have shared this list with"
  );
  if (!listProperties.sharedWithScreennames || listProperties.sharedWithScreennames.size === 0) {
    appendNewElement(container, {
      className: "empty-list-message",
      text: "You are not sharing this list with anyone."
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
    text: "share"
  });
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
    const shareeUid = listProperties.sharedWithScreennames[screenname]
    const registeredCell = appendNewElement(userRow, {
      className: "registered-cell",
      text: (shareeUid === '_' ? 'not registered' : 'registered')
    });
    const editCell = appendNewElement(userRow, { className: "edit-cell" });
    appendNewElement(editCell, {
      tag: "a",
      onClick: onUnshareClick,
      data: {
        screenname: screenname,
        uid: shareeUid === '_' ? null : shareeUid
      },
      text: "unshare"
    });
  }
}
