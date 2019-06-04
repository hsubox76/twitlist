import { appendNewElement } from "../../../shared/dom-utils";

export function renderTableContainer(parent, name, title) {
  const containerEl = appendNewElement(parent, {
    id: name + "-container",
    className: "container"
  });
  appendNewElement(containerEl, { tag: "h2", text: title });
  const tableEl = appendNewElement(containerEl, {
    id: name + "-table",
    className: "table"
  });
  return { container: containerEl, table: tableEl };
}
