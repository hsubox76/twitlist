import { appendNewElement } from "../../../shared/dom-utils";
import { getList, updateNote } from "../db";
import { renderList } from "./list";
import { renderSharedWith } from "./shared-with";
import { renderAddForm } from "./add-form";

function postNoteFromForm(formEl, { user, params }, renderer) {
  if (!user.uid || !formEl) return;
  const formData = new FormData(formEl);
  const description = formData.get('user-description');
  const screenname = formData.get("user-screen-name");
  const twitterId = formData.get("user-twitter-id");
  if (!description || !screenname) return;

  // Disable buttons.
  const userAddButton = formEl.getElementById("user-add-submit");
  const userDescription = formEl.getElementById("user-description");
  userAddButton.setAttribute("disabled", true);
  userDescription.setAttribute("disabled", true);

  updateNote(user.uid, screenname.toLowerCase(), {
    description,
    twitterId
  }, /* isNew */ params && params.mode === 'add')
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

export function renderContent(state, parent, renderer) {
  function onPostClick(e) {
    e.preventDefault();
    postNoteFromForm(e.target, state, renderer);
  }
  function onVisibilityToggle(e) {
    const data = e.target.closest('.user-row').dataset;
    updateNote(state.user.uid, data.screenname, { isPublic: e.target.checked }, /* isNew */ false);
  }

  function onEditClick(e) {
    e.preventDefault();
    const data = e.target.closest('.user-row').dataset;
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
    })
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
  renderAddForm(state, contentContainer, { onPostClick, onCancelClick });
  renderList(state, contentContainer, { onEditClick, onSortClick, onVisibilityToggle });
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
