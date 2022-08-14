# Neewer GL1

This script allows you to interact with a Neewer GL1 LED panel over your network. You must configure the panel to connect to your wifi network for this script to work.

The Neewer GL1 is a lower cost alternative to an El Gato Key Light. It supports Wifi (configured via mobile app). I reverse engineered the protocol between my computer and the light and found that the light listens for commands over UDP on port 5052. As far as I can tell, the light does not return any data such as current state.

By being able to control the light using a script, you can integrate controls with something like a Stream Deck, which is how I use it.

As of Version 2.0.0, you no longer need to keep the Neewer Live application running for it to work. In any case, the Neewer Live app on windows is a raging dumpster fire. If for whatever reason the app crashes, or your computer crashes, the app will stop working, because the `DeviceInfo.xml` and/or `UserInfo.xml` file(s) will be corrupted. That's because the executable is constantly updating those files, *and* requires them for operation. The application does not self-heal those files once they're corrupted. You basically need to back up those files and copy them back in when something goes wrong.


In order to use this script, you basically need to know the IP adddress of the light, which you can get after you configure the light using the Neewer mobile app. You will also need to know the IP address of your computer, which is easy enough.

## Parameters

```
-h, --host [required] ip or hostname
-I, --client_ip [char] your computer's IP. If you don't provide it, the script will try to guess your IP (first one it finds)
-H, --hex
-p, --power [on,off]
-b, --brightness (requires -t) 1-100
-t, --temperature (requires -b) 29-70
-d, --delay [int] in milliseconds. Default is 500. YMMV if you shorten the delay. The script may run faster, but may not execute.
```

You can generally mix and match the parameters as required, with exceptions:

1. If you use the Hex switch, power, brightness, temperature are ignored.
2. If you leave off the Power, and your light is off, the brightness and temperature change obviously won't do anything
3. If you include the Power switch and set it to be `off`, the brightness and temperature change won't matter, since the light is turning off anyways.
   


## Installation

1. Make sure a recent version of node is installed
2. Pull this repo
3. run `npm install`



## Examples

```
# e.g, light IP address is 192.168.1.236 

# turn light on, your computer IP is 192.168.1.100 and set brightness to 10%, temperature to 3300k, 
# delay between light commands is 500ms
node index.mjs -h 192.168.1.236 -p on  -b 10 -t 33 -I 192.168.1.100

# turn light on, your computer IP is 192.168.1.100 and set brightness to 10%, temperature to 3300k,
# delay between light commands is 400ms
node index.mjs -h 192.168.1.236 -p on  -b 10 -t 33 -I 192.168.1.100 -d 400

# turn light off, script guesses your IP
node index.mjs -h 192.168.1.236 -p off

# set brightness to 10%, temperature to 3300k (light must be turned on first)
node index.mjs -h 192.168.1.236 -b 10 -t 33

# set brightness to 10%, temperature to 5000k using manual hex
node index.mjs -h 192.168.1.236 -H 800503020a32c6

```

## Protocol Details

An HTTP/S based protocol would have been nice, Neewer opted against it. Because, you know... reasons. Because it doesn't appear that the lights provide status, it doesn't appear that you can write your own app to get the status of the light (since you can manually adjust its settings using its physical switches).

I'm not sure how the Neewer Live app scans the network for the lights, but to control them, all you basically need to know are:

1. The IP address of the light
2. Your computer's IP address

To reverse engineer the protocol, you can watch traffic between your computer and the light using Wireshark.

You'll notice that there's an initializing handshake between Neewer Live and your light, where it sends a message three times, and then the app sends a constant stream of short heartbeat messages afterwards.

The light never sends any information back, so if you change your light settings manually, your light will be out of sync with the app's state for the light.

I eventually realized that the command structure works like this:

1. Your computer sends three UDP hex messages containing your computer's IP in succession.
2. You can send any command or a heartbeat to the light to keep the window for the light to receive commands from your computer's IP open.
3. If no heartbeat command is received within a certain time window, then any further commands are rejected unless you resend the commands in #1.

There is a finite time window for a command to be received. If it's too fast or too slow, then the commands will be rejected. I could not be bothered to figure out this exact timing (but it is 4-5 times per second), as I only care that the script works for my uses. I have included an overridable delay between issuing UDP requests, defaulted to 500ms. I have found setting it shorter can result in faster response times for the light, but missed commands too. YMMV.


### Commands

The handshake/wakeup command looks like this: `80021000000d3139322e3136382e312e3130382e` for client IP address 192.168.1.108. The structure of the message is `80 02 10 00 00 0d [ip ascii to hex]`, terminated by `2e`

To turn on the light, you send the hexadecimal code `800502010189` over UDP. 
To turn off the light, you send the hexadecimal code `800502010088` over UDP.

To set the brightness and temperature, you send a hexadecimal code with the pattern `80050302{brightness}{temperature first two digits}{checksum}`

For example, brightness = 20, temperature = 3300k is `800503021421bf`. 

To break that down further, you have 7 hex pairs: `80 05 03 02 14 21 bf`, where `80 + 05 + 03 + 02 + 14 + 21 = bf`

Translated to decimal, that is `128 + 5 + 3 + 2 + 20 + 33 = 191`

With this information, you should be able to write a simple UDP client in NodeJS, Python or other to send commands to the light. 

From there, you can integrate with a Streamdeck or other.


## Other Notes

~~The script seems to work best when the Windows Neewer Live app is installed and running.~~ No longer required for v2.0.0

For my uses, the script is feature complete in the sense that I won't be updating the script very often (if at all), unless my own needs require me to.

If you need more functionality or want an NPM for this functionality, feel free to create your own fork.
