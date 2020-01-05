const shellies = require("shellies");
const MQTT = require("async-mqtt");
const mqttWildcard = require("mqtt-wildcard");
const commandLineArgs = require("command-line-args");

const { addToHomeAssistantDiscover } = require("./home-assistant-discover");

const payload_available = "online";

/**
 * @type { commandLineArgs.OptionDefinition[] }
 */
const optionDefinitions = [
  { name: "verbose", alias: "v", type: Boolean },
  { name: "mqtturl", type: String, multiple: false, defaultOption: true },
  { name: "mqttprefix", type: String, defaultValue: "shellies" },
  { name: "homeassistantprefix", type: String, defaultValue: "homeassistant" },
  { name: "shelly_login", type: String, defaultValue: null },
  { name: "shelly_password", type: String, defaultValue: null }
];

const args = commandLineArgs(optionDefinitions);

/**
 *
 * @param {{id:string, type:string}} device
 */
function getDeviceTopicPrefix(device) {
  return `${args.mqttprefix}/${device.type}/${device.id}`;
}

/**
 *
 * @param {string[]} topics
 * @param {Buffer} payload
 */
async function handleSet([deviceType, deviceID, prop], payload) {
  const device = shellies.getDevice(deviceType, deviceID);
  if (device) {
    if (prop === "relay0") {
      const val = payload.toString();
      try {
        await device.setRelay(0, val === "ON");
      } catch (error) {
        console.error("Fail to set relay", error);
      }
    }
  }
}

/**
 *
 * @param {string} topic
 * @param {Buffer} payload
 */
function handleMqttMessage(topic, payload) {
  const setTopics = mqttWildcard(topic, `${args.mqttprefix}/+/+/+/SET`);
  if (setTopics) {
    handleSet(setTopics, payload);
  }
}

async function start() {
  const client = await MQTT.connectAsync(
    args.mqtturl,
    { connectTimeout: 10000 },
    true
  );
  console.log("MQTT connected ?", client.connected);

  client.on("message", handleMqttMessage);
  client.subscribe(`${args.mqttprefix}/+/+/+/SET`, { qos: 2 });

  shellies.on("discover", device => {
    // a new device has been discovered
    console.log(
      "Discovered device with ID",
      device.id,
      "and type",
      device.type
    );
    client
      .publish(`${getDeviceTopicPrefix(device)}/state`, payload_available, {
        qos: 0,
        retain: true
      })
      .catch(error => console.error("Error during publish", error));

    addToHomeAssistantDiscover(
      client,
      device,
      args.homeassistantprefix,
      getDeviceTopicPrefix(device)
    );

    device.on("change", (prop, newValue, oldValue) => {
      // a property on the device has changed
      console.log(device.id, prop, "changed from", oldValue, "to", newValue);
      client
        .publish(
          `${getDeviceTopicPrefix(device)}/${prop}`,
          JSON.stringify(newValue),
          {
            qos: 0,
            retain: true
          }
        )
        .catch(error => console.error("Error during publish", error));
    });

    device.on("offline", () => {
      // the device went offline
      console.log("Device with ID", device.id, "went offline");
      client
        .publish(`${getDeviceTopicPrefix(device)}/state`, payload_available, {
          qos: 0,
          retain: true
        })
        .catch(error => console.error("Error during publish", error));
    });
  });

  if (args.shelly_login && args.shelly_password) {
    shellies.setAuthCredentials(args.shelly_login, args.shelly_password);
  }

  // start discovering devices and listening for status updates
  await shellies.start();
  console.log("Start listening shellies");
}

start().catch(error => {
  console.error("Fatal error :", error);
});
