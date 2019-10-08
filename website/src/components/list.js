import { sortList } from "../helpers";
import { renderTableContainer } from "./table-custom";
import { appendNewElement } from "../../../shared/dom-utils";

export function renderList(
  { user, list, listSortBy, listSortDirection, noteToDelete, dataIsLoading },
  parent,
  {
    onSortClick,
    onEditClick,
    onDeleteClick,
    closeDeleteConfirm,
    deleteNoteForScreenname
  }
) {
  // TODO: Individual visibility toggles.
  // function onVisibilityToggle(e) {
  //   e.preventDefault();
  //   const data = e.target.closest(".user-row").dataset;
  //   updateNote(
  //     user.uid,
  //     data.screenname,
  //     { visibility: e.target.value },
  //     /* isNew */ false
  //   );
  // }
  function onDeleteConfirmClick(e) {
    e.preventDefault();
    const data = e.target.closest(".user-row").dataset;
    deleteNoteForScreenname(data.screenname);
  }

  const sortedList = sortList(list, listSortBy, listSortDirection);
  const { container, table } = renderTableContainer(
    parent,
    "user-list",
    `Your (@${user.displayName}'s) list`
  );
  if (!list.length) {
    const message = dataIsLoading
      ? "Getting list data..."
      : "Your list is empty.";
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
  appendNewElement(headerRow, { text: "Your Note" });
  // appendNewElement(headerRow, { text: "Visible To" });
  for (const note of sortedList) {
    const userRow = appendNewElement(table, {
      className: "user-row",
      data: {
        screenname: note.screenname
      }
    });
    const usernameCell = appendNewElement(userRow, {
      className: "username-cell"
    });
    appendNewElement(usernameCell, {
      tag: "a",
      href: `https://twitter.com/${note.screenname}`,
      target: "_blank",
      text: `@${note.screenname}`
    });

    if (noteToDelete && noteToDelete === note.screenname) {
      const deleteConfirmCell = appendNewElement(userRow, {
        className: "delete-cell"
      });
      appendNewElement(deleteConfirmCell, {
        tag: "span",
        text: `Delete @${note.screenname}?`
      });
      appendNewElement(deleteConfirmCell, {
        tag: "button",
        className: "delete-confirm-button",
        onClick: onDeleteConfirmClick,
        text: `yes`
      });
      appendNewElement(deleteConfirmCell, {
        tag: "button",
        onClick: closeDeleteConfirm,
        text: `cancel`
      });
      continue;
    }

    appendNewElement(userRow, { text: note.description });
    // const visibilityCell = appendNewElement(userRow, {
    //   className: "visibility-cell"
    // });
    // const visibilitySelect = appendNewElement(visibilityCell, {
    //   tag: "select",
    //   value: note.visibility,
    //   onChange: onVisibilityToggle
    // });
    // appendNewElement(visibilitySelect, {
    //   tag: "option",
    //   text: "just you",
    //   selected: note.visibility === VISIBILITY.PRIVATE,
    //   value: VISIBILITY.PRIVATE
    // });
    // if (listProperties.visibility === "public") {
    //   appendNewElement(visibilitySelect, {
    //     tag: "option",
    //     text: "everyone",
    //     selected: note.visibility === VISIBILITY.SHARED,
    //     value: VISIBILITY.SHARED
    //   });
    // } else if (listProperties.visibility === "shared") {
    //   appendNewElement(visibilitySelect, {
    //     tag: "option",
    //     text: "your shared list (below)",
    //     selected: note.visibility === VISIBILITY.SHARED,
    //     value: VISIBILITY.SHARED
    //   });
    // }
    const editCell = appendNewElement(userRow, { className: "edit-cell" });
    appendNewElement(editCell, {
      tag: "a",
      onClick: onEditClick,
      href: `/?screenname=${note.screenname}&mode=edit`,
      text: "edit"
    });
    const deleteCell = appendNewElement(userRow, { className: "delete-cell" });
    appendNewElement(deleteCell, {
      tag: "a",
      onClick: onDeleteClick,
      text: "delete"
    });
  }
}
