const axios = require("axios");

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

  return axios.post(
    `https://discord.com/api/v8/channels/${channelId}/messages`,
    {
      content: `RPG ${command}`,
      tts: false
    },
    createConfig()
  );
}

function getMessages() {
  const { channelId } = getEnv();

  return axios.get(
    `https://discord.com/api/v8/channels/${channelId}/messages?limit=50`,
    createConfig()
  );
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
