const api = require("./api");

const stopBot = process.env.STOP_BOT === "true";
let commandIntervals = [];
let hasGuard = false;
let limitMessage = 10;
let commands = [];

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

function checkNextMessages(around, limit) {
  api
    .getMessages({ around, limit })
    .then(res => {
      const data = res.data || [];
      const sliceCount = parseInt(limit / 2, 10);

      if (api.hasEpicGuard(data.slice(0, sliceCount)) !== undefined) {
        hasGuard = true;
        log("WARNING !!! There is Epic Guard");
      } else {
        hasGuard = false;
        log("No Guard");
      }
    })
    .catch(log);
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
      runCommand(text);
    }, interval * 1000);
    log(`START COMMAND ${text}`);
  }
} else if (stopBot) {
  log("BOT IS STOPED");
} else {
  log("No running command");
}
