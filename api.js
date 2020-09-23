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

function hasRelease(data = []) {
  const { username } = getEnv();
  let hasTypeJail = false;
  let hasTypeProtest = false;
  let hasGuardRelease = false;
  const regexHandleByUser = new RegExp(
    `Everything seems fine ***${username}***, keep playing`,
    "g"
  );

  for (let index = 0; index < data.length; index++) {
    const { author, content } = data[index];

    if (author.username === "EPIC RPG") {
      if (regexHandleByUser.test(content)) {
        return true;
      }

      if (hasGuardRelease === false) {
        hasTypeRelease = /Fine, i will let you go/g.test(content);
      }
    } else if (author.username === username) {
      if (hasTypeJail === false) {
        hasTypeJail = /rpg jail/g.test(content.trim().toLowerCase());
      }
      if (hasTypeProtest === false) {
        hasTypeProtest = /protest/g.test(content.trim().toLowerCase());
      }
    }
  }

  return hasTypeJail && hasTypeProtest && hasGuardRelease;
}

module.exports = {
  hasEpicGuard,
  hasRelease,
  getMessages,
  sendMessage
};
