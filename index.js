const shellies = require("shellies");
const MQTT = require("async-mqtt");
const commandLineArgs = require("command-line-args");

/**
 * @type { commandLineArgs.OptionDefinition[] }
 */
const optionDefinitions = [
  { name: "verbose", alias: "v", type: Boolean },
  { name: "mqtturl", type: String, multiple: true, defaultOption: true }
];

const args = commandLineArgs(optionDefinitions);

shellies.on("discover", device => {
  // a new device has been discovered
  console.log("Discovered device with ID", device.id, "and type", device.type);

  device.on("change", (prop, newValue, oldValue) => {
    // a property on the device has changed
    console.log(device.id, prop, "changed from", oldValue, "to", newValue);
  });

  device.on("offline", () => {
    // the device went offline
    console.log("Device with ID", device.id, "went offline");
  });
});

// start discovering devices and listening for status updates
shellies.start();
