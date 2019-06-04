import { sortList } from "../helpers";
import { renderTableContainer } from "./table-custom";
import { appendNewElement } from "../../../shared/dom-utils";

export function renderList(
  { user, list, listSortBy, listSortDirection },
  parent,
  { onSortClick, onEditClick }
) {
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
  for (const user of sortedList) {
    const userRow = appendNewElement(table, {
      className: "user-row"
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
    const editCell = appendNewElement(userRow, { className: "edit-cell" });
    appendNewElement(editCell, {
      tag: "a",
      onClick: onEditClick,
      data: {
        screenname: user.screenname,
        tid: user.twitterId
      },
      href: `/?screenname=${user.screenname}&tid=${user.twitterId}&mode=edit`,
      text: "edit"
    });
  }
}
