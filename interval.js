const api = require("./api");

const stopBot = process.env.STOP_BOT === "true";
let commandIntervals = [];
let hasGuard = false;
let limitMessage = 10;
let commands = [];
let intervalCheckRelease = 0;
let shiftCommand = [];
let limitMessageCheckJail = process.env.LIMIT_MESSAGES_JAIL || 30;

function log(message) {
  console.log(new Date(), "\t", message);
}

try {
  commands = JSON.parse(process.env.COMMANDS);
} catch (error) {
  console.log(error);
  commands = [
    { text: "hunt", interval: 63 },
    { text: "pickup", interval: 303 }
  ];
}

function checkMessagesReleasement() {
  return api.getMessages({ limit: limitMessageCheckJail }).then(res => {
    return api.hasRelease(res.data);
  });
}

function checkNextMessages(around, limit) {
  return api
    .getMessages({ around, limit })
    .then(res => {
      const data = res.data || [];
      const sliceCount = parseInt(limit / 2, 10);

      if (api.hasEpicGuard(data.slice(0, sliceCount)) !== undefined) {
        hasGuard = true;
        log("WARNING !!! There is Epic Guard");

        if (intervalCheckRelease === 0) {
          intervalCheckRelease = setInterval(() => {
            log("Check has messages releasement");
            checkMessagesReleasement().then(hasRelease => {
              if (hasRelease) {
                clearInterval(intervalCheckRelease);
                intervalCheckRelease = 0;
                hasGuard = false;
              }
            });
          }, 30 * 1000);
        }
      } else {
        hasGuard = false;
        log("No Guard");
      }

      return hasGuard;
    })
    .catch(log);
}

function getShiftCommand(indexCommand, text = []) {
  if (
    shiftCommand[indexCommand] === undefined ||
    shiftCommand[indexCommand] === text.length - 1
  ) {
    shiftCommand[indexCommand] = 0;
  } else {
    shiftCommand[indexCommand]++;
  }

  return shiftCommand[indexCommand];
}

function runCommand(command) {
  if (hasGuard) {
    log(`DON'T RUN ${command} => THERE IS EPIC GUARD`);
    return;
  }

  api
    .sendMessage(command)
    .then(res => {
      log(`Running ${command}`);
      const { id: around } = res.data || {};
      setTimeout(() => {
        checkNextMessages(around, limitMessage);
      }, 5 * 1000);
    })
    .catch(err => log(err));
}

if (!stopBot && Array.isArray(commands)) {
  for (let index = 0; index < commands.length; index++) {
    const { text, interval } = commands[index] || {};
    commandIntervals[index] = setInterval(() => {
      if (Array.isArray(text) && text.length > 0) {
        const textIndex = getShiftCommand(index, text);
        runCommand(text[textIndex]);
      } else if (typeof text === "string") {
        runCommand(text);
      }
    }, interval * 1000);
    log(`START COMMAND ${text}`);
  }
} else if (stopBot) {
  log("BOT IS STOPED");
} else {
  log("No running command");
}
