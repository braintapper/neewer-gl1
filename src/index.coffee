# import dgram from 'dgram'
# dgram with promises
import {DgramAsPromised} from "dgram-as-promised" 
import Sugar from 'sugar-and-spice'
Sugar.extend()
import chalk from "chalk"

import program from 'commander'
import os from 'os'

PORT = 5052


presets = 
  "on": "800502010189"
  "off": "800502010088"

program
.version("Neewer GL1 Key Light Control 2.0")
.option("-h, --host [char]")
.option("-H, --hex [char]")
.option("-I, --client_ip [char]")
.option("-p, --power [off/on]")
.option("-b, --brightness [int]")
.option("-t, --temperature [int]")
.option("-d, --delay [int]")


.parse(process.argv)

# Default command prints out a list of ports
program.parse()

options = program.opts()

command_queue = []

command_delay = 600

send = (host, port)->
  
  client = DgramAsPromised.createSocket('udp4')
  
  if command_queue.length > 0  
    hexCommand = command_queue.shift()
    message = new Buffer.from(hexCommand,"hex")
    
    bytes = await client.send message, 0, message.length, port, host #, (err, bytes) ->
    console.log "Sent message [#{hexCommand}] (#{bytes} bytes) to #{host}:#{port}"
      #
    closed = await client.close()
    console.log "Connection closed. Going to next in queue."
    # prevent commands from being issued too quickly
    send.delay command_delay, host,port 
  else
    console.log "Command queue is empty! Done."
    
convertIp = (ip)->
  segments = ip.split(".")
  ascii = segments.map
  hexified = Array.from(ip).map (char,index)->
    return char.charCodeAt(0).toString(16)
  return hexified.join("")

guessIp = ()->
  nics = os.networkInterfaces()
  addresses = []
  Object.keys(nics).forEach (key)->
    addresses.push nics[key]
  addresses =  addresses.flatten().filter( {family: "IPv4"} )
  return addresses.first().address

hexify = (brightness, temperature)->
  setting = [128,5,3,2]
  setting.append [parseInt(brightness),parseInt(temperature)]
  setting.append setting.sum()
  hex = setting.map (o)->
    return o.toString(16).padLeft(2,"0")
  return hex.join("")

parse_and_execute = (options)->
  if options.host?
    
    if options.client_ip?
      ipAddress = options.client_ip
      console.log "Using #{ipAddress} as the local IP address"
    else
      ipAddress = guessIp()
      console.log "client_ip not provided, using #{ipAddress} as the local IP address"
    
    if options.delay?
      command_delay = options.delay
    console.log "Command delay set to #{command_delay}ms"

    #init command
    initCommand = "80021000000d#{convertIp(ipAddress)}2e"
    # console.log initCommand 
    command_queue.append [ initCommand, initCommand, initCommand ]
    

    console.log "#{chalk.yellow("Light Host:")} #{options.host}:#{PORT}"
    if options.hex?
      console.log "#{chalk.red("Hex Override:")} #{options.hex}"
      # send options.host, PORT, options.hex
      command_queue.append options.hex
    else
      if options.power?
        switch options.power.toLowerCase()
          when "off"
            console.log "Set light to #{chalk.red("OFF")} state. Brightness and/or temperature parameters will be sent but have no effect."
            command_queue.append presets.off

          when "on"
            console.log "Set light to #{chalk.green("ON")} state"
            command_queue.append presets.on
          else
            console.log chalk.red("Invalid power state '#{options.power.toLowerCase()}'. Valid states are 'on' and 'off' only.")
      
      if options.brightness? && options.temperature?  
        console.log chalk.yellow("Set brightness to #{options.brightness}% and temperature to #{options.temperature}00K")
        command_queue.append hexify(options.brightness, options.temperature)
      else
        console.log chalk.red("When setting brightness or temperature, BOTH parameters are required.")
    await send options.host, PORT
  else
    console.log chalk.red("No options provided. Did not run.")

parse_and_execute(options)
