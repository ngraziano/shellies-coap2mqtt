# Shelly coap to MQTT

This program is a brige for Selly device to MQTT broker. It allow to keep using cloud function on shelly and get data in mqtt.

For now it is only tested with Shelly Plug S.

## Launch

node . mqtt://login:password@localhost --shelly_login pluglogin --shelly_password password

## Limitation

All plug must have the same password.
Control is limited to Shelly Plug S.
