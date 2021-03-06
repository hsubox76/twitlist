import { sortList } from "../helpers";
import { renderTableContainer } from "./table-custom";
import { appendNewElement } from "../../../shared/dom-utils";

export function renderOtherList(
  { list, listProperties, listSortBy, listSortDirection, dataIsLoading },
  parent,
  { onSortClick }
) {
  const sortedList = sortList(list, listSortBy, listSortDirection);
  const { container, table } = renderTableContainer(
    parent,
    "user-list",
    listProperties && listProperties.creatorScreenname
      ? `@${listProperties.creatorScreenname}'s list`
      : ""
  );
  if (!list.length) {
    const message = dataIsLoading
      ? "Getting list data..."
      : "This list is empty.";
    appendNewElement(container, {
      className: "empty-list-message",
      text: message
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
  appendNewElement(headerRow, { text: "Note" });
  for (const user of sortedList) {
    const userRow = appendNewElement(table, {
      className: "user-row",
      data: {
        screenname: user.screenname
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
  }
}
