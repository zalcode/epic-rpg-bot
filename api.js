const axios = require("axios");
const rateLimit = require("axios-rate-limit");
const { log, ...utils } = require("./utils");

const http = rateLimit(axios.create(), {
  maxRequests: 1,
  perMilliseconds: 2000
});

let cancelSource = null;
let interceptor = null;

initCancelToken();

function initCancelToken() {
  cancelSource = axios.CancelToken.source();

  if (interceptor) {
    axios.interceptors.request.eject(interceptor);
    interceptor = null;
  }

  interceptor = http.interceptors.request.use(function(config) {
    if (cancelSource) {
      config.cancelToken = cancelSource.token;
    }

    return config;
  });
}

function cancelRequest(reason = "Request canceled by the user.") {
  cancelSource && cancelSource.cancel(reason);
  initCancelToken();
}

function createConfig() {
  const { token, superProperty } = utils.getEnv();

  return {
    headers: {
      accept: "*/*",
      "accept-language": "en-US",
      authorization: token,
      "content-type": "application/json",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-super-properties": superProperty
    }
  };
}

function sendMessage(command, isRpg = true) {
  const { channelId } = utils.getEnv();

  return http.post(
    `https://discord.com/api/v8/channels/${channelId}/messages`,
    {
      content: isRpg ? `rpg ${command}` : command,
      tts: false
    },
    createConfig()
  );
}

function getMessages(params = {}) {
  const { channelId } = utils.getEnv();

  return http.get(`https://discord.com/api/v8/channels/${channelId}/messages`, {
    ...createConfig(),
    params: {
      limit: 50,
      ...params
    }
  });
}

function typing() {
  const { channelId } = utils.getEnv();

  return http.post(
    `https://discord.com/api/v8/channels/${channelId}/typing`,
    {},
    createConfig()
  );
}

module.exports = {
  typing,
  getMessages,
  sendMessage,
  cancelRequest
};
