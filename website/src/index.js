import {
  getFirebase,
  getList,
  getGuestList,
  subscribeToListsSharedWithUser,
  subscribeToPublicListsSharedWithUser
} from "./db";
import { createRenderer, getParams } from "../../shared/dom-utils";
import { renderHeader } from "./components/header";
import { renderContent } from "./components/content";
import { renderParams } from "./components/params";

async function init() {
  const renderer = createRenderer({
    user: null,
    userIsLoading: true,
    dataIsLoading: true,
    list: [],
    listProperties: {},
    listSortBy: "screenname",
    listSortDirection: 1,
    params: getParams(),
    error: null
  });

  renderer.subscribe(renderHeader);
  renderer.subscribe(renderContent);
  renderer.subscribe(renderParams);
  renderer.render();
  const firebase = await getFirebase();
  const provider = new firebase.auth.TwitterAuthProvider();
  firebase.auth().onAuthStateChanged(function handleAuthState(fetchedUser) {
    if (fetchedUser) {
      renderer.setState({ user: fetchedUser });
      const { user, params } = renderer.getState();
      if (params.listid) {
        getGuestList(user.uid, params.listid).then(function({
          list,
          listProperties,
          error
        }) {
          if (error && error === "permissions") {
            renderer.setState({
              error: `you don't have permission to view this list`
            });
          }
          renderer.setState({ list, listProperties, dataIsLoading: false });
        });
      } else {
        getList(user.uid).then(function({ list, listProperties }) {
          renderer.setState({ list, listProperties, dataIsLoading: false });
        });
      }
      if (!renderer.getState().unsubShared) {
        const unsubShared = subscribeToListsSharedWithUser(
          user.uid,
          otherLists => {
            renderer.setState({ otherLists });
          }
        );
        renderer.setState({ unsubShared });
      }
      if (!renderer.getState().unsubPublic) {
        const unsubPublic = subscribeToPublicListsSharedWithUser(
          user.uid,
          publicOtherLists => {
            renderer.setState({ publicOtherLists });
          }
        );
        renderer.setState({ unsubPublic });
      }
    } else {
      const { params } = renderer.getState();
      if (params.mode === "edit" || params.mode === "add") {
        firebase.auth().signInWithPopup(provider);
      } else if (params.listid) {
        getGuestList(undefined, params.listid).then(function({
          list,
          listProperties,
          error
        }) {
          if (error && error === "permissions") {
            renderer.setState({
              error: `you don't have permission to view this list`
            });
          }
          renderer.setState({ list, listProperties });
        });
      }
    }
    renderer.setState({ userIsLoading: false });
  });

  window.addEventListener("popstate", () => {
    renderer.render();
  });
}

init();
