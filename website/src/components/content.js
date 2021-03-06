import { appendNewElement } from "../../../shared/dom-utils";
import { getList, updateNote, deleteNote, logInToFirebase } from "../db";
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

  function onDeleteClick(e) {
    e.preventDefault();
    const data = e.target.closest(".user-row").dataset;
    renderer.setState({
      noteToDelete: data.screenname
    });
  }

  function closeDeleteConfirm(e) {
    // Could be called from a button or programatically.
    e && e.preventDefault();
    renderer.setState({
      noteToDelete: null
    });
  }

  function deleteNoteForScreenname(screenname) {
    return deleteNote(state.user.uid, screenname).then(() => {
      return getList(state.user.uid).then(({ list, listProperties }) =>
        renderer.setState({ list, listProperties })
      );
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
    id: "content-container",
    className: "container"
  });
  if (state.userIsLoading) {
    // Only render loader.
    renderLoader(state, contentContainer);
    return;
  }
  if (state.error) {
    // May render other content below error.
    renderError(state, contentContainer);
  }
  if (!state.user) {
    if (state.list && state.params.listid) {
      renderOtherList(state, contentContainer, {
        onSortClick
      });
    }
    if (!state.params.listid) {
      renderLoginSuggestion(state, contentContainer, renderer);
    }
    return;
  }
  if (!state.list) return;
  renderAddForm(state, contentContainer, { onPostClick, onCancelClick });
  if (state.params.listid) {
    renderOtherList(state, contentContainer, {
      onSortClick
    });
  } else {
    renderList(state, contentContainer, {
      onEditClick,
      onSortClick,
      onDeleteClick,
      deleteNoteForScreenname,
      closeDeleteConfirm
    });
    renderSharedWith(state, contentContainer, { refreshList });
  }
  renderOtherLists(state, contentContainer, { setParams });
}

function renderLoader(state, parent) {
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

function renderLoginSuggestion(state, parent, renderer) {
  const { params } = state;
  let suggestText =
    "Sign in with your Twitter account to edit and manage your list.";
  if (params.mode) {
    suggestText =
      `Sign in with your Twitter account to ${params.mode} a note for ` +
      `${params.screenname ? "@" + params.screenname : "this account"}.`;
  }
  const loginSuggestionContainer = appendNewElement(parent, {
    className: "login-suggest-container container"
  });
  appendNewElement(loginSuggestionContainer, {
    text: suggestText
  });
  appendNewElement(loginSuggestionContainer, {
    tag: "button",
    className: "login-suggest-button",
    text: "Sign in with Twitter",
    onClick: () => logInToFirebase(renderer)
  });
}
