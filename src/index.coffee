import dgram from 'dgram'
import Sugar from 'sugar-and-spice'
Sugar.extend()
import chalk from "chalk"

import program from 'commander'

PORT = 5052


presets = 
  "on": "800502010189"
  "off": "800502010088"






program
.version("Neewer GL1 Key Light Control 1.0")
.option("-h, --host [char]")
.option("-H, --hex [char]")
.option("-p, --power [off/on]")
.option("-b, --brightness [int]")
.option("-t, --temperature [int]")


.parse(process.argv)

# Default command prints out a list of ports
program.parse()

options = program.opts()


send = (host, port, hex)->
  client = dgram.createSocket('udp4')
  message = new Buffer.from(hex,"hex")
  client.send message, 0, message.length, PORT, host, (err, bytes) ->
    console.log "UDP message [" + hex + "] sent to " + host + ":" + port 
    client.close()


hexify = (brightness, temperature)->
  setting = [128,5,3,2]
  setting.append [parseInt(brightness),parseInt(temperature)]
  setting.append setting.sum()
  hex = setting.map (o)->
    return o.toString(16).padLeft(2,"0")
  return hex.join("")


parse_and_execute = (options)->
  if options.host?
    console.log "#{chalk.yellow("Light Host:")} #{options.host}:#{PORT}"
    if options.hex?
      console.log "#{chalk.red("Hex Override:")} #{options.hex}"
      send options.host, PORT, options.hex
    else
      if options.power?
        switch options.power.toLowerCase()
          when "off"
            console.log "Set light to #{chalk.red("OFF")} state"
            send options.host, PORT, "800502010088"
          when "on"
            console.log "Set light to #{chalk.green("ON")} state"
            send options.host, PORT, "800502010189"
          else
            console.log chalk.red("Invalid power state '#{options.power.toLowerCase()}'. Valid states are 'on' and 'off' only.")
      else
        if options.brightness? && options.temperature?
          
          console.log chalk.yellow("Set brightness to #{options.brightness}% and temperature to #{options.temperature}00K")
          send options.host, PORT, hexify(options.brightness, options.temperature)
        else
          console.log chalk.red("Brightness and temperature parameters are required.")

parse_and_execute(options)
