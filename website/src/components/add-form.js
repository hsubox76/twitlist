import { appendNewElement } from "../../../shared/dom-utils";

export function renderAddForm(state, parent, { onPostClick }) {
  const params = state.params;
  if (!params.screenname) {
    return;
  }
  const isEditMode = params.mode === "edit";
  const userAddForm = appendNewElement(parent, {
    id: "user-add-form",
    className: "container",
    tag: "form"
  });
  appendNewElement(userAddForm, {
    id: "form-text",
    text: `${isEditMode ? "Edit" : "Add a"} note about user: @${
      params.screenname
    }`
  });
  const userDescriptionInput = appendNewElement(userAddForm, {
    tag: "textarea",
    id: "user-description",
    rows: 4
  });
  const buttonContainer = appendNewElement(userAddForm, {});
  appendNewElement(buttonContainer, {
    tag: "button",
    id: "user-add-submit",
    text: "add note"
  });
  if (isEditMode) {
    const listItem = state.list.find(
      item => item.screenname === params.screenname
    );
    if (listItem) {
      userDescriptionInput.value = listItem.description;
    }
  }
  appendNewElement(userAddForm, {
    tag: "input",
    type: "hidden",
    id: "user-twitter-id",
    value: params.tid
  });
  appendNewElement(userAddForm, {
    tag: "input",
    type: "hidden",
    id: "user-screen-name",
    value: params.screenname
  });

  userAddForm.addEventListener("submit", onPostClick);

  return () => userAddForm.removeEventListener("submit", onPostClick);
}
