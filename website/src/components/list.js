import { sortList } from "../helpers";
import { renderTableContainer } from "./table-custom";
import { appendNewElement } from "../../../shared/dom-utils";
import { updateNote } from "../db";

export function renderList(
  { user, list, listSortBy, listSortDirection },
  parent,
  { onSortClick, onEditClick }
) {
  function onVisibilityToggle(e) {
    const data = e.target.closest(".user-row").dataset;
    updateNote(
      user.uid,
      data.screenname,
      { isPublic: e.target.checked },
      /* isNew */ false
    );
  }

  const sortedList = sortList(list, listSortBy, listSortDirection);
  const { container, table } = renderTableContainer(
    parent,
    "user-list",
    `Your (@${user.displayName}'s) list`
  );
  if (!list.length) {
    appendNewElement(container, {
      className: "empty-list-message",
      text: "Your list is empty."
    });
    return;
  }
  const headerRow = appendNewElement(table, {
    className: "header-row"
  });
  appendNewElement(headerRow, {
    text: `Twitter User${
      listSortBy === "screenname" ? (listSortDirection === 1 ? " ▼" : " ▲") : ""
    }`,
    onClick: onSortClick
  });
  appendNewElement(headerRow, { text: "Your Note" });
  appendNewElement(headerRow, { text: "Visible To People You've Shared With" });
  for (const user of sortedList) {
    const userRow = appendNewElement(table, {
      className: "user-row",
      data: {
        screenname: user.screenname,
        tid: user.twitterId
      }
    });
    const usernameCell = appendNewElement(userRow, {
      className: "username-cell"
    });
    appendNewElement(usernameCell, {
      tag: "a",
      href: `https://twitter.com/${user.screenname}`,
      target: "_blank",
      text: `@${user.screenname}`
    });
    appendNewElement(userRow, { text: user.description });
    const visibilityCell = appendNewElement(userRow, {
      className: "visibility-cell"
    });
    appendNewElement(visibilityCell, {
      tag: "input",
      type: "checkbox",
      onClick: onVisibilityToggle
    });
    const editCell = appendNewElement(userRow, { className: "edit-cell" });
    appendNewElement(editCell, {
      tag: "a",
      onClick: onEditClick,
      href: `/?screenname=${user.screenname}&tid=${user.twitterId}&mode=edit`,
      text: "edit"
    });
  }
}
