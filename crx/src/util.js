export function sendMessage(message) {
  console.log("sending message", message);
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, response => {
      if (response) {
        resolve(response);
      } else {
        reject(chrome.runtime.lastError);
      }
    });
  });
}
