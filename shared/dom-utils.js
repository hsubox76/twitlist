export function createRenderer(initialState, root = document.body) {
  let state = initialState;
  let subscribers = [];

  const renderer = {
    getRoot: () => root,
    getState: () => state,
    setState: (newState) => {
      const oldState = state || initialState;
      state = Object.assign({}, state, newState);
      renderSubscribers(oldState);
    },
    render: () => renderSubscribers(state),
    subscribe: (subscriber) => {
      const exists = subscribers.findIndex(fn => fn.name === subscriber.name);
      if (exists >= 0) {
        // remove it
        subscribers = subscribers.slice(0, exists).concat(subscribers.slice(exists + 1));
      }
      subscribers.push(subscriber);
    }
  };

  function renderSubscribers(oldState) {
    root.innerHTML = '';
    for (const subscriber of subscribers) {
      subscriber(state, root, renderer, oldState);
    }
  }

  return renderer;
}

export function deleteElement(element) {
  if (element && element.parentElement) {
    element.parentElement.removeChild(element);
  }
}

export function buildElement(options) {
  const tagName = options.tag || 'div';
  const newElement = document.createElement(tagName);
  for (const attr in options) {
    switch (attr) {
      case 'tag':
        break;
      case 'text':
        newElement.textContent = options[attr];
        break;
      case 'selected':
        if (options[attr]) {
          newElement.setAttribute('selected', '');
        }
        break;
      case 'onClick':
      case 'onChange':
      case 'onSubmit':
        newElement[attr.toLowerCase()] = options[attr];
        break;
      case 'data':
        for (const dataKey in options[attr]) {
          newElement.dataset[dataKey] = options[attr][dataKey];
        }
        break;
      case 'className':
        newElement.classList = options[attr];
        break;
      default:
        newElement.setAttribute(attr, options[attr]);
    }
  }
  return newElement;
}

export function appendNewElement(parent, options) {
  const element = buildElement(options);
  parent.appendChild(element);
  return element;
}

export function setTextContentForId(id, text) {
  const element = document.getElementById(id);
  if (!element) throw new Error('Could not find element with id ' + id);
  element.textContent = text;
}

export function getValueAtId(id) {
  const element = document.getElementById(id);
  if (!element) throw new Error('Could not find element with id ' + id);
  return element.value;
}

export function getParams() {
  const queryString = window.location.search;
  if (!queryString) return {};
  let params = {};
  queryString.slice(1).split('&').forEach(pair => {
    const parts = pair.split('=');
    params[parts[0]] = parts[1];
  });
  return params;
}

// Get or create if not found
export function getOrCreateChildWithClass(parent, className, createOptions = {}) {
  if (!parent) return null;
  const existingEl = parent.getElementsByClassName(className)[0];
  if (existingEl) {
    return existingEl;
  } else {
    if (createOptions) {
      return appendNewElement(
        parent,
        Object.assign({}, createOptions, { className })
      );
    } else {
      return null;
    }
  }
}

export function getChildWithClass(parent, className) {
  return getOrCreateChildWithClass(parent, className, null);
}