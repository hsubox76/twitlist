import { renderTableContainer } from "./table-custom";
import { appendNewElement } from "../../../shared/dom-utils";
import { VISIBILITY } from '../../../shared/constants';

export function renderOtherLists(
  { otherLists, publicOtherLists },
  parent
) {
  const { table } = renderTableContainer(
    parent,
    "other-lists",
    "Other lists shared with you"
  );
  if (!otherLists || !publicOtherLists) {
    return;
  }
  const combinedLists = otherLists.concat(publicOtherLists);
  if (combinedLists.length === 0) {
    appendNewElement(table, {
      className: "empty-list-message",
      text: "No one has shared a list with you yet."
    });
    return;
  }
  // TODO: sort by screenname
  const sortedLists = combinedLists.sort();
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
      href: `/?listid=${list.creatorUid}&listname=${list.creatorScreenname}`,
      text: `@${list.creatorScreenname}`
    });
    appendNewElement(userRow, {
      className: "visibility-cell",
      text: list.visibility === VISIBILITY.PUBLIC ? '(shared with everyone)' : ''
    });
  }
}
