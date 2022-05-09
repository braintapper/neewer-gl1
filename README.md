# Neewer GL1

This script allows you to interact with a Neewer GL1 LED panel over your network. You must configure the panel to connect to your wifi network for this script to work.

The Neewer GL1 is a lower cost alternative to an El Gato Key Light. It supports Wifi (configured via mobile app). I reverse engineered the protocol between my computer and the light and found that the light listens for commands over UDP on port 5052. As far as I could tell, the light does not return any data such as current state.

By being able to control the light using a script, you can integrate controls with something like a Stream Deck, which is how I use it.


## Protocol

To turn on the light, you send the hexadecimal code `800502010189` over UDP. To turn off the light, you send the hexadecimal code `800502010088` over UDP.

To set the brightness and temperature, you send a hexadecimal code with the pattern `80050302{brightness}{temperature first two digits}{checksum}`

For example, brightness = 20, temperature = 3300k is `800503021421bf`. 

To break that down further, you have 7 hex pairs: `80 05 03 02 14 21 bf`, where `80 + 05 + 03 + 02 + 14 + 21 = bf`

Translated to decimal, that is `128 + 5 + 3 + 2 + 20 + 33 = 191`

With this information, you should be able to write a simple UDP client in NodeJS, Python or other to send commands to the light. From there, you can integrate with a Streamdeck or other.

## Parameters

```
-h, --host [required] ip or hostname
-p, --power  
-b, --brightness (requires -t) 1-100
-t, --temperature (requires -b) 29-70
-H, --hex 
```

## Installation

1. Make sure a recent version of node is installed
2. Pull this repo
3. run `npm install`

## Examples

```
# e.g, light IP address is 192.168.1.236 

# turn light on
node index.mjs -h 192.168.1.236 -p on

# turn light off
node index.mjs -h 192.168.1.236 -p off

# set brightness to 10%, temperature to 3300k (light must be turned on first)
node index.mjs -h 192.168.1.236 -b 10 -t 33

# set brightness to 10%, temperature to 5000k using manual hex
node index.mjs -h 192.168.1.236 -H 800503020a32c6

```

## Other Notes

The script seems to work best when the Windows Neewer Live app is installed and running.

For my uses, the script is feature complete in the sense that I probably won't be updating the script very often, unless my own needs require me to. 

If you need more functionality, feel free to create your own fork.