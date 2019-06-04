import { renderTableContainer } from "./table-custom";
import { appendNewElement } from "../../../shared/dom-utils";

export function renderSharedWith({ listProperties }, parent) {
  const { container, table } = renderTableContainer(
    parent,
    "shared-with",
    "You have shared this list with"
  );
  if (!listProperties.sharedWith || listProperties.sharedWith.length === 0) {
    appendNewElement(container, {
      className: "empty-list-message",
      text: "You are not sharing this list with anyone."
    });
    return;
  }
  const addShareeForm = appendNewElement(container, {
    tag: 'form',
    id: 'add-sharee-form'
  });
  appendNewElement(addShareeForm, {
    text: 'share with @'
  });
  appendNewElement(addShareeForm, {
    tag: 'input',
    id: 'add-sharee-screenname',
    placeholder: 'twitterusername'
  });
  appendNewElement(addShareeForm, {
    tag: 'button',
    text: 'share'
  });
  const sortedSharees = listProperties.sharedWith.sort();
  for (const screenname of sortedSharees) {
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
    const editCell = appendNewElement(userRow, { className: "edit-cell" });
    appendNewElement(editCell, {
      tag: "a",
      onClick: () => {},
      data: {
        screenname: screenname
      },
      text: "unshare"
    });
  }
}
