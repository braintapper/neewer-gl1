var PORT, hexify, options, parse_and_execute, presets, send;

import dgram from 'dgram';

import Sugar from 'sugar-and-spice';

Sugar.extend();

import chalk from "chalk";

import program from 'commander';

PORT = 5052;

presets = {
  "on": "800502010189",
  "off": "800502010088"
};

program.version("Neewer GL1 Key Light Control 1.0").option("-h, --host [char]").option("-H, --hex [char]").option("-p, --power [off/on]").option("-b, --brightness [int]").option("-t, --temperature [int]").parse(process.argv);

// Default command prints out a list of ports
program.parse();

options = program.opts();

send = function(host, port, hex) {
  var client, message;
  client = dgram.createSocket('udp4');
  message = new Buffer.from(hex, "hex");
  return client.send(message, 0, message.length, PORT, host, function(err, bytes) {
    console.log("UDP message [" + hex + "] sent to " + host + ":" + port);
    return client.close();
  });
};

hexify = function(brightness, temperature) {
  var hex, setting;
  setting = [128, 5, 3, 2];
  setting.append([parseInt(brightness), parseInt(temperature)]);
  setting.append(setting.sum());
  hex = setting.map(function(o) {
    return o.toString(16).padLeft(2, "0");
  });
  return hex.join("");
};

parse_and_execute = function(options) {
  if (options.host != null) {
    console.log(`${chalk.yellow("Light Host:")} ${options.host}:${PORT}`);
    if (options.hex != null) {
      console.log(`${chalk.red("Hex Override:")} ${options.hex}`);
      return send(options.host, PORT, options.hex);
    } else {
      if (options.power != null) {
        switch (options.power.toLowerCase()) {
          case "off":
            console.log(`Set light to ${chalk.red("OFF")} state`);
            return send(options.host, PORT, "800502010088");
          case "on":
            console.log(`Set light to ${chalk.green("ON")} state`);
            return send(options.host, PORT, "800502010189");
          default:
            return console.log(chalk.red(`Invalid power state '${options.power.toLowerCase()}'. Valid states are 'on' and 'off' only.`));
        }
      } else {
        if ((options.brightness != null) && (options.temperature != null)) {
          console.log(chalk.yellow(`Set brightness to ${options.brightness}% and temperature to ${options.temperature}00K`));
          return send(options.host, PORT, hexify(options.brightness, options.temperature));
        } else {
          return console.log(chalk.red("Brightness and temperature parameters are required."));
        }
      }
    }
  }
};

parse_and_execute(options);
