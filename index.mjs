// import dgram from 'dgram'
// dgram with promises
var PORT, command_delay, command_queue, convertIp, guessIp, hexify, options, parse_and_execute, presets, send;

import {
  DgramAsPromised
} from "dgram-as-promised";

import Sugar from 'sugar-and-spice';

Sugar.extend();

import chalk from "chalk";

import program from 'commander';

import os from 'os';

PORT = 5052;

presets = {
  "on": "800502010189",
  "off": "800502010088"
};

program.version("Neewer GL1 Key Light Control 2.0").option("-h, --host [char]").option("-H, --hex [char]").option("-I, --client_ip [char]").option("-p, --power [off/on]").option("-b, --brightness [int]").option("-t, --temperature [int]").option("-d, --delay [int]").parse(process.argv);

// Default command prints out a list of ports
program.parse();

options = program.opts();

command_queue = [];

command_delay = 500;

send = async function(host, port) {
  var bytes, client, closed, hexCommand, message;
  client = DgramAsPromised.createSocket('udp4');
  if (command_queue.length > 0) {
    hexCommand = command_queue.shift();
    message = new Buffer.from(hexCommand, "hex");
    bytes = (await client.send(message, 0, message.length, port, host)); //, (err, bytes) ->
    console.log(chalk.blue(`Sent command [${hexCommand}] (${bytes} bytes) to ${host}:${port}`));
    
    closed = (await client.close());
    // console.log "Connection closed. Going to next in queue."
    // prevent commands from being issued too quickly
    return send.delay(command_delay, host, port);
  } else {
    return console.log(chalk.green("Command queue is empty! Done."));
  }
};

convertIp = function(ip) {
  var ascii, hexified, segments;
  segments = ip.split(".");
  ascii = segments.map;
  hexified = Array.from(ip).map(function(char, index) {
    return char.charCodeAt(0).toString(16);
  });
  return hexified.join("");
};

guessIp = function() {
  var addresses, nics;
  nics = os.networkInterfaces();
  addresses = [];
  Object.keys(nics).forEach(function(key) {
    return addresses.push(nics[key]);
  });
  addresses = addresses.flatten().filter({
    family: "IPv4"
  });
  return addresses.first().address;
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

parse_and_execute = async function(options) {
  var initCommand, ipAddress;
  if (options.host != null) {
    if (options.client_ip != null) {
      ipAddress = options.client_ip;
      console.log(chalk.green(`Using ${ipAddress} as the local IP address`));
    } else {
      ipAddress = guessIp();
      console.log(chalk.yellow(`client_ip not provided, using ${ipAddress} as the local IP address`));
    }
    if (options.delay != null) {
      command_delay = options.delay;
    }
    console.log(`Command delay set to ${command_delay}ms`);
    //init command
    initCommand = `80021000000d${convertIp(ipAddress)}2e`;
    // console.log initCommand 
    command_queue.append([initCommand, initCommand, initCommand]);
    console.log(`${chalk.yellow("Light Host:")} ${options.host}:${PORT}`);
    if (options.hex != null) {
      console.log(`${chalk.red("Hex Override:")} ${options.hex}`);
      // send options.host, PORT, options.hex
      command_queue.append(options.hex);
    } else {
      if (options.power != null) {
        switch (options.power.toLowerCase()) {
          case "off":
            console.log(`Set light to ${chalk.red("OFF")} state. Brightness and/or temperature parameters will be sent but have no effect.`);
            command_queue.append(presets.off);
            break;
          case "on":
            console.log(`Set light to ${chalk.green("ON")} state`);
            command_queue.append(presets.on);
            break;
          default:
            console.log(chalk.red(`Invalid power state '${options.power.toLowerCase()}'. Valid states are 'on' and 'off' only.`));
        }
      }
      if ((options.brightness != null) && (options.temperature != null)) {
        console.log(chalk.yellow(`Set brightness to ${options.brightness}% and temperature to ${options.temperature}00K`));
        command_queue.append(hexify(options.brightness, options.temperature));
      } else {
        console.log(chalk.red("When setting brightness or temperature, BOTH parameters are required."));
      }
    }
    return (await send(options.host, PORT));
  } else {
    return console.log(chalk.red("No options provided. Did not run."));
  }
};

parse_and_execute(options);
