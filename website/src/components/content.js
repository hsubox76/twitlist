import { appendNewElement } from "../../../shared/dom-utils";
import { postNewNote } from "../db";
import { renderList } from "./list";
import { renderSharedWith } from "./shared-with";
import { renderAddForm } from "./add-form";

export function renderContent(state, parent, renderer) {
  function onPostClick(e) {
    e.preventDefault();
    postNewNote(state, renderer);
  }

  function onEditClick(e) {
    e.preventDefault();
    const data = e.target.dataset;
    renderer.setState({
      params: {
        screenname: data.screenname,
        tid: data.tid,
        mode: "edit"
      }
    });
  }

  function onSortClick(e) {
    e.preventDefault();
    const { list, listSortBy, listSortDirection } = state;
    const sortedList = sortList(list, listSortBy, listSortDirection);
    renderer.setState({
      list: sortedList,
      sortDirection: -sortDirection
    });
  }

  const contentContainer = appendNewElement(parent, {
    id: "content-container"
  });
  state.isLoading && renderLoader(state, contentContainer);
  if (!state.user || !state.list) return;
  renderAddForm(state, contentContainer, { onPostClick });
  renderList(state, contentContainer, { onEditClick, onSortClick });
  renderSharedWith(state, contentContainer);
}

function renderLoader(state, parent) {
  if (state.user) return;
  const loadingContainer = appendNewElement(parent, {
    className: "container",
    id: "content-loading-container"
  });
  appendNewElement(loadingContainer, { className: "spinner" });
}
