
var botControls = require("./eventloop");
var app = require("express");
var portfinder = require("portfinder");
var request = require("request");
var argv = require('yargs').argv;
var bus = require("./eventBus");


botInfo = {
  email: argv.email,
  password: argv.password,
  is_running: false,
  accumulated_messages: []
}

function notify(orchestrator_port, found_port, bot_id, next) {
  request({
    url: "localhost:" + orchestrator_port,
    method: "POST",
    json: true,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      "port": found_port,
      "bot_id": bot_id,
    })
  }, next);
}

app.get("/status", function(req, res) {
  res.status(200).json({
    is_running: botInfo.is_running,
    messages: botInfo.accumulated_messages
  });
  botInfo.messages = []
});

app.get("/kill", function(req, res) {
  botInfo.killFunc();
  botInfo.api.logout();
  res.status(200).json({
    "dead": true
  });
});

bus.on("error", function (message) {
  botInfo.accumulated_messages.push(message);
  botInfo.is_running = false;
  botControls.createBot(botInfo, botControls.startBot);
});

bus.on("starting_error", function (err) {
  botInfo.is_running = false;
  botInfo.accumulated_messages.push(err);
});


function startup() {
  orchestrator_port = argv.orchestrator_port;
  bot_id = argv.bot_id;

  portfinder.getPort(function (err, found_port) {
    if (err) {
      return;
    }
    app.listen(found_port);
    notify(orchestrator_port, found_port, bot_id, function () {
      botControls.createBot(botInfo, botControls.startBot);
    });
  });
}



