import { appendNewElement } from "../../../shared/dom-utils";
import { getList, updateNote } from "../db";
import { renderList } from "./list";
import { renderSharedWith } from "./shared-with";
import { renderAddForm } from "./add-form";
import { renderOtherLists } from "./other-lists";
import { renderOtherList } from "./other-list";

function postNoteFromForm(formData, { user, params }, renderer) {
  if (!user.uid) return;
  const description = formData.get("user-description");
  const screenname = formData.get("user-screen-name");
  if (!description || !screenname) return;

  // Disable buttons.
  const userAddButton = document.getElementById("user-add-submit");
  const userDescription = document.getElementById("user-description");
  userAddButton.setAttribute("disabled", true);
  userDescription.setAttribute("disabled", true);

  updateNote(
    user.uid,
    screenname.toLowerCase(),
    {
      description
    },
    /* isNew */ params && params.mode === "add"
  )
    .then(function onSuccessfulPost() {
      renderer.setState({ params: {} });
      getList(user.uid).then(({ list, listProperties }) =>
        renderer.setState({ list, listProperties })
      );
    })
    .catch(function onFailedPost(e) {
      console.error(e);
      // Enable buttons.
      userAddButton.setAttribute("disabled", false);
      userDescription.setAttribute("disabled", false);
    });
}

export function renderContent(state, parent, renderer, oldState) {
  function onPostClick(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    postNoteFromForm(formData, state, renderer);
  }

  function onEditClick(e) {
    e.preventDefault();
    const data = e.target.closest(".user-row").dataset;
    renderer.setState({
      params: {
        screenname: data.screenname,
        tid: data.tid,
        mode: "edit"
      }
    });
  }

  function onCancelClick(e) {
    e.preventDefault();
    renderer.setState({
      params: {}
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

  function refreshList() {
    getList(state.user.uid).then(function({ list, listProperties }) {
      renderer.setState({ list, listProperties });
    });
  }

  function setParams(params) {
    renderer.setState({ params });
  }

  const contentContainer = appendNewElement(parent, {
    id: "content-container"
  });
  state.isLoading && renderLoader(state, contentContainer);
  !state.isLoading && state.error && renderError(state, contentContainer);
  if (!state.list) return;
  state.user && renderAddForm(state, contentContainer, { onPostClick, onCancelClick });
  if (state.params.listid) {
    renderOtherList(state, contentContainer, {
      onSortClick
    });
  } else if (state.user) {
    renderList(state, contentContainer, {
      onEditClick,
      onSortClick
    });
    renderSharedWith(state, contentContainer, { refreshList });
  }
  state.user && renderOtherLists(state, contentContainer, { setParams });
}

function renderLoader(state, parent) {
  if (state.user) return;
  const loadingContainer = appendNewElement(parent, {
    className: "container",
    id: "content-loading-container"
  });
  appendNewElement(loadingContainer, { className: "spinner" });
}

function renderError(state, parent) {
  appendNewElement(parent, {
    className: "container",
    id: "error-container",
    text: state.error
  });
}
