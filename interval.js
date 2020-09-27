const api = require("./api");
const { log, ...utils } = require("./utils");

const stopBot = process.env.STOP_BOT === "true";

let hasGuard = false;
let limitMessage = 10;
let intervalCheckRelease = 0;
let limitMessageCheckJail = process.env.LIMIT_MESSAGES_JAIL || 30;

function checkMessagesReleasement() {
  return api.getMessages({ limit: limitMessageCheckJail }).then(res => {
    return utils.hasRelease(res.data);
  });
}

function checkProfile() {
  return api
    .sendMessage("profile")
    .then(result => {
      return api
        .getMessages({ limit: 30 })
        .then(result => {
          const env = utils.getEnv();
          if (
            utils.isNeedHealFromProfile(env.username, result.data, env.minHP)
          ) {
            log("Need Healing");
            return api.sendMessage("heal").then(_res => {
              return checkProfile();
            });
          }
        })
        .catch(log);
    })
    .catch(log);
}

function checkNextMessages(around, limit) {
  const env = utils.getEnv();
  return api
    .getMessages({ around, limit })
    .then(res => {
      const data = res.data || [];
      const sliceCount = parseInt(limit / 2, 10);

      if (utils.isNeedHealAfterHunting(env.username, data, env.minHP)) {
        api
          .sendMessage("HEAL")
          .then(_ => checkProfile())
          .catch(log);
      }

      if (utils.hasEpicGuard(data.slice(0, sliceCount)) !== undefined) {
        hasGuard = true;
        log("WARNING !!! There is Epic Guard");

        if (intervalCheckRelease === 0) {
          intervalCheckRelease = setInterval(() => {
            log("Check has messages releasement");
            checkMessagesReleasement()
              .then(hasRelease => {
                if (hasRelease) {
                  log("Success Release");
                  clearInterval(intervalCheckRelease);
                  intervalCheckRelease = 0;
                  hasGuard = false;
                } else {
                  log("Release message not found");
                }
              })
              .catch(err => {
                log("ERROR Get messages release");
                log(err);
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

function runCommand(command) {
  if (hasGuard) {
    log(`DON'T RUN ${command} => THERE IS EPIC GUARD`);
    return;
  }

  // typing effect
  api.typing().catch(err => log(err));

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

let commandIntervals = [];
let commands = [];

try {
  commands = JSON.parse(process.env.COMMANDS);
} catch (error) {
  console.log(error);
  commands = [
    { text: "hunt", interval: 63 },
    { text: "pickup", interval: 303 }
  ];
}

function startBot() {
  if (!stopBot && Array.isArray(commands)) {
    for (let index = 0; index < commands.length; index++) {
      const { text, interval } = commands[index] || {};
      const callbackCommand = () => {
        if (Array.isArray(text) && text.length > 0) {
          const textIndex = utils.getShiftCommand(index, text.length);
          runCommand(text[textIndex]);
        } else if (typeof text === "string") {
          runCommand(text);
        }
      };
      callbackCommand();
      commandIntervals[index] = setInterval(callbackCommand, interval * 1000);
      log(`START COMMAND ${text}`);
    }
  } else if (stopBot) {
    log("BOT IS STOPED");
  } else {
    log("No running command");
  }
}

checkProfile()
  .then(result => {
    startBot();
  })
  .catch(log);
