import firebase from "firebase/app";
import "firebase/auth";
import { firebaseConfig } from "../../shared/firebase-config";
import { getList } from "./db";
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
      const { user } = renderer.getState();
      getList(user.uid).then(function({ list, listProperties }) {
        renderer.setState({ list, listProperties });
      });
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
