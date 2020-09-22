const api = require("./api");
let commandIntervals = [];
let hasGuard = false;

function runCommand(command) {
  if (hasGuard) {
    console.warn(`DON'T RUN ${command} => THERE IS EPIC GUARD`);
    return;
  }

  api
    .sendMessage(command)
    .then(res => {
      console.log(` Running ${command} =>`, new Date());
    })
    .catch(err => console.log(err));
}

commandIntervals[0] = setInterval(() => {
  runCommand("hunt");
}, (60 + 3) * 1000);

commandIntervals[1] = setInterval(() => {
  runCommand("axe");
}, (5 * 60 + 3) * 1000);

let messagesInterval = setInterval(() => {
  api.getMessages().then(res => {
    if (api.hasEpicGuard(res.data) !== undefined) {
      hasGuard = true;
      console.log("has guard");
    } else {
      hasGuard = false;
      console.log("No Guard");
    }
  });
}, 2 * 60 * 1000);

console.log("START COMMAND AT ", new Date());
