const axios = require("axios");
const rateLimit = require("axios-rate-limit");

const http = rateLimit(axios.create(), {
  maxRequests: 1,
  perMilliseconds: 2000,
  maxRPS: 1
});

function getEnv() {
  return {
    superProperty: process.env.SUPER_PROPERTY,
    token: process.env.TOKEN,
    channelId: process.env.CHANNEL_ID,
    username: process.env.USERNAME
  };
}

function createConfig() {
  const { token, superProperty } = getEnv();

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

function sendMessage(command) {
  const { channelId } = getEnv();

  return http.post(
    `https://discord.com/api/v8/channels/${channelId}/messages`,
    {
      content: `RPG ${command}`,
      tts: false
    },
    createConfig()
  );
}

function getMessages(params = {}) {
  const { channelId } = getEnv();

  return http.get(`https://discord.com/api/v8/channels/${channelId}/messages`, {
    ...createConfig(),
    params: {
      limit: 50,
      ...params
    }
  });
}

function hasEpicGuard(data = []) {
  const { username } = getEnv();

  return data.find(({ mentions, author, content }) => {
    return (
      mentions.length > 0 &&
      author.bot &&
      author.username === "EPIC RPG" &&
      mentions.find(m => m.username === username) !== undefined &&
      (/EPIC GUARD/g.test(content) || /, you are in the/g.test(content))
    );
  });
}

module.exports = {
  hasEpicGuard,
  getMessages,
  sendMessage
};
