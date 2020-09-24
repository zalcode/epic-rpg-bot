let shiftCommand = [];

function getShiftCommand(indexCommand, textLength = 1) {
  if (
    shiftCommand[indexCommand] === undefined ||
    shiftCommand[indexCommand] === textLength - 1
  ) {
    shiftCommand[indexCommand] = 0;
  } else {
    shiftCommand[indexCommand]++;
  }

  return shiftCommand[indexCommand];
}

function getEnv() {
  return {
    superProperty: process.env.SUPER_PROPERTY,
    token: process.env.TOKEN,
    channelId: process.env.CHANNEL_ID,
    username: process.env.USERNAME
  };
}

function log(message) {
  console.log(new Date(), "\t", message);
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
    `Everything seems fine \\*\\*${username}\\*\\*, keep playing`,
    "g"
  );

  for (let index = 0; index < data.length; index++) {
    const { author, content } = data[index];

    if (author.username === "EPIC RPG") {
      if (regexHandleByUser.test(content)) {
        log("Already handle by user it self");
        return true;
      }

      if (hasGuardRelease === false) {
        hasGuardRelease = /Fine, i will let you go/g.test(content);
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

  log(`is ${username} wrote 'rpg jail' ? ${hasTypeJail}`);
  log(`is ${username} wrote 'protest' ? ${hasTypeProtest}`);
  log(`is EPIC RPG wrote 'Fine, i will let you go' ? ${hasGuardRelease}`);

  return hasTypeJail && hasTypeProtest && hasGuardRelease;
}

module.exports = {
  getShiftCommand,
  log,
  hasRelease,
  hasEpicGuard,
  getEnv
};
