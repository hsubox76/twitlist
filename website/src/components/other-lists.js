import { renderTableContainer } from "./table-custom";
import { appendNewElement } from "../../../shared/dom-utils";

export function renderOtherLists(
  { otherLists },
  parent
) {
  const { container, table } = renderTableContainer(
    parent,
    "other-lists",
    "Other lists shared with you"
  );
  if (!otherLists || otherLists.length === 0) {
    appendNewElement(container, {
      className: "empty-list-message",
      text: "No one has shared a list with you yet."
    });
    return;
  }
  // TODO: sort by screenname
  const sortedLists = otherLists.sort();
  for (const list of sortedLists) {
    const userRow = appendNewElement(table, {
      className: "user-row"
    });
    const usernameCell = appendNewElement(userRow, {
      className: "username-cell"
    });
    appendNewElement(usernameCell, {
      tag: "a",
      // TODO: link to view list
      href: `https://twitter.com/${list.creatorScreenname}`,
      target: "_blank",
      text: `@${list.creatorScreenname}`
    });
  }
}
