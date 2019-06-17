export function sendMessage(message) {
  console.log('sending message', message);
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, response => {
      if (response) {
        resolve(response);
      } else {
        console.log('sending message', message);
        reject(chrome.runtime.lastError);
      }
    });
  });
}
