import { getParams } from "../../../shared/dom-utils";

export function renderParams({ params: newParams }) {
  const params = getParams();
  let hasChanges = false;
  const mergedParams = Object.assign({}, params, newParams);
  for (const key in mergedParams) {
    if (params[key] !== newParams[key]) {
      if (newParams[key] === undefined) {
        delete params[key];
      } else {
        params[key] = newParams[key];
      }
      hasChanges = true;
    }
  }
  if (!hasChanges) return;
  const pairStrings = [];
  for (const key in params) {
    pairStrings.push(`${key}=${params[key]}`);
  }
  window.history.pushState(
    {},
    "",
    `${pairStrings.length ? "?" : "/"}${pairStrings.join("&")}`
  );
}
