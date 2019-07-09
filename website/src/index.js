import firebase from "firebase/app";
import "firebase/auth";
import { firebaseConfig } from "../../shared/firebase-config";
import { getList, getGuestList, subscribeToListsSharedWithUser, subscribeToPublicListsSharedWithUser } from "./db";
import { createRenderer, getParams } from "../../shared/dom-utils";
import { renderHeader } from "./components/header";
import { renderContent } from "./components/content";
import { renderParams } from "./components/params";

firebase.initializeApp(firebaseConfig);
const provider = new firebase.auth.TwitterAuthProvider();

function init() {
  const renderer = createRenderer({
    user: null,
    isLoading: true,
    list: [],
    listProperties: {},
    listSortBy: "screenname",
    listSortDirection: 1,
    params: getParams()
  });

  renderer.subscribe(renderHeader);
  renderer.subscribe(renderContent);
  renderer.subscribe(renderParams);
  renderer.render();
  firebase.auth().onAuthStateChanged(function handleAuthState(fetchedUser) {
    if (fetchedUser) {
      renderer.setState({ user: fetchedUser });
      const { user, params } = renderer.getState();
      if (params.listid) {
        getGuestList(user.uid, params.listid).then(function({ list, listProperties, error }) {
          if (error && error === 'permissions') {
            // TODO: show error in UI
            console.log(`you don't have permission to view this list`);
          }
          renderer.setState({ list, listProperties });
        });
      } else {
        getList(user.uid).then(function({ list, listProperties }) {
          renderer.setState({ list, listProperties });
        });
      }
      if (!renderer.getState().unsubShared) {
        const unsubShared = subscribeToListsSharedWithUser(user.uid, (otherLists) => {
          renderer.setState({ otherLists });
        });
        renderer.setState({ unsubShared });
      }
      if (!renderer.getState().unsubPublic) {
        const unsubPublic = subscribeToPublicListsSharedWithUser(user.uid, (publicOtherLists) => {
          renderer.setState({ publicOtherLists });
        });
        renderer.setState({ unsubPublic });
      }
    } else {
      const { params } = renderer.getState();
      if (params.mode === "edit" || params.mode === "add") {
        firebase.auth().signInWithPopup(provider);
      }
    }
    renderer.setState({ isLoading: false });
  });

  window.addEventListener("popstate", () => {
    renderer.render();
  });
}

init();
