const api = require("./api");
const { log, ...utils } = require("./utils");

const stopBot = process.env.STOP_BOT === "true";

let hasGuard = false;
let limitMessage = 10;
let intervalCheckRelease = 0;
let limitMessageCheckJail = process.env.LIMIT_MESSAGES_JAIL || 30;
let commandIntervals = [];
let commands = [];

try {
  commands = JSON.parse(process.env.COMMANDS);
} catch (error) {
  console.log(error);
  commands = [];
}

function findCoolDownMessage(messages = [], username) {
  return messages.find(message => {
    return (
      message.author.username === "EPIC RPG" &&
      message.embeds.length === 1 &&
      message.embeds[0].author.name.indexOf(`${username}'s cooldowns`) > -1
    );
  });
}

function getUserCooldown() {
  if (hasGuard) return;

  const env = utils.getEnv();
  return api.sendMessage("cooldown").then(result => {
    return api
      .getMessages({ limit: 5 })
      .then(res => findCoolDownMessage(res.data, env.username))
      .then(result => {
        if (!result || result.embeds.length === 0) return;
        return utils.getCommandsCooldown(result.embeds[0].fields);
      });
  });
}

function startCommands() {
  getUserCooldown().then(cooldown => {
    if (!cooldown) return;

    for (let index = 0; index < commands.length; index++) {
      const command = commands[index] || {};
      if (command.type || command.text) {
        const cooldownTime = cooldown[command.type] || 0;
        const callback = () => {
          if (Array.isArray(command.text) && command.text.length > 0) {
            const textIndex = utils.getShiftCommand(index, command.text.length);
            runCommand(command.text[textIndex]);
          } else if (typeof command.text === "string") {
            runCommand(command.text);
          } else {
            runCommand(command.type);
          }
        };
        if (cooldownTime > 0) {
          log(
            `${command.text ? command.text : command.type}`,
            "will run in after",
            cooldownTime / 1000,
            "s"
          );
        }
        setTimeout(() => {
          callback();
          commandIntervals[index] = setInterval(
            callback,
            command.interval * 1000
          );
        }, cooldownTime + 1000);
      }
    }
  });
}

function stopCommands() {
  for (let index = 0; index < commandIntervals.length; index++) {
    const value = commandIntervals[index];
    if (value) {
      clearInterval(value);
    }
  }
}

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

      if (utils.isGotLootbox(env.username, data, around)) {
        log("Found Lootbox");
        api
          .sendMessage("OPEN")
          .then(_ => log("Success open lootbox"))
          .catch(log);
      }

      if (utils.hasEpicGuard(data.slice(0, sliceCount)) !== undefined) {
        hasGuard = true;
        log("WARNING !!! There is Epic Guard");
        stopCommands();
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
                  startCommands();
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

if (!stopBot) {
  checkProfile()
    .then(result => {
      startCommands();
    })
    .catch(log);
}
