import shellies from "shellies";
import mqttWildcard from "mqtt-wildcard";
import commandLineArgs from "command-line-args";
import { connectAsync } from "mqtt";
import {
  addGatewayToHomeAssistantDiscover,
  addToHomeAssistantDiscover,
} from "./home-assistant-discover.mjs";

const payload_available = "online";
const payload_unavailable = "offline";

/**
 * @type { commandLineArgs.OptionDefinition[] }
 */
const optionDefinitions = [
  { name: "verbose", alias: "v", type: Boolean },
  { name: "cleanup", type: Boolean, defaultValue: false },
  { name: "mqtturl", type: String, multiple: false, defaultOption: true },
  { name: "mqttprefix", type: String, defaultValue: "shellies" },
  { name: "homeassistantprefix", type: String, defaultValue: "homeassistant" },
  { name: "shelly_login", type: String, defaultValue: null },
  { name: "shelly_password", type: String, defaultValue: null },
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
  const client = await connectAsync(args.mqtturl, {
    connectTimeout: 10000,
    will: {
      topic: `${args.mqttprefix}/gatewaystate`,
      payload: payload_unavailable,
      qos: 0,
      retain: true,
    },
  });

  client.on("reconnect", () => {
    console.log("Reconnecting to MQTT");
    client.publish(`${args.mqttprefix}/gatewaystate`, payload_available, {
      qos: 0,
      retain: true,
    });
  });

  await client.publishAsync(
    `${args.mqttprefix}/gatewaystate`,
    payload_available,
    {
      qos: 0,
      retain: true,
    }
  );

  await addGatewayToHomeAssistantDiscover(
    client,
    args.homeassistantprefix,
    args.mqttprefix
  );

  console.log("MQTT connected ?", client.connected);

  client.on("message", handleMqttMessage);
  await client.subscribeAsync(`${args.mqttprefix}/+/+/+/SET`, { qos: 2 });

  shellies.on("discover", (device) => {
    // a new device has been discovered
    console.log(
      "Discovered device with ID",
      device.id,
      "and type",
      device.type
    );
    client
      .publishAsync(
        `${getDeviceTopicPrefix(device)}/state`,
        payload_available,
        {
          qos: 0,
          retain: true,
        }
      )
      .catch((error) => console.error("Error during publish", error));

    addToHomeAssistantDiscover(
      client,
      device,
      args.homeassistantprefix,
      getDeviceTopicPrefix(device)
    ).catch((error) =>
      console.error("Error during home assistant auto discovery", error)
    );

    device.on(
      "change",
      /**
       * @param {string} prop
       */
      (prop, newValue, oldValue, device) => {
        // a property on the device has changed
        console.log(device.id, prop, "changed from", oldValue, "to", newValue);


        publishValue = (val) => {
          client
            .publishAsync(
              `${getDeviceTopicPrefix(device)}/${prop}`,
              JSON.stringify(val),
              {
                qos: 0,
                retain: true,
              }
            )
            .catch((error) => console.error("Error during publish", error));
        };

        if (prop === "deviceTemperature") {
          // add a filter to reduce the number of messages sent to MQTT for deviceTemperature
          if (device._lastDeviceTemperatureStat === undefined) {
            device._lastDeviceTemperatureStat = {
              lastValueSent: newValue,
              lastMean: newValue,
              lastValueTime: Date.now(),
              lastMeanDuration: 0,
            };
            publishValue(newValue);
          } else {
            const stat = device._lastDeviceTemperatureStat;
            const now = Date.now();
            const timeSinceLastValue = now - stat.lastValueTime || 1; // avoid division by zero
            const newMean = (stat.lastMean * stat.lastMeanDuration + newValue * timeSinceLastValue) / (stat.lastMeanDuration + timeSinceLastValue);
            stat.lastMean = newMean;
            stat.lastMeanDuration += timeSinceLastValue;
            stat.lastValueTime = now;

            if (stat.lastMeanDuration >= 60000) {
              // if the mean duration is greater than 60 seconds, send the mean value to MQTT
              publishValue(newMean);
              stat.lastMeanDuration = 0;
              stat.lastValueSent = newMean;
            } else if (Math.abs(newValue - stat.lastValueSent) >= 5) {
              // if the new value differs from the last sent value by 5 degrees or more, send the new value to MQTT
              publishValue(newValue);
              stat.lastMeanDuration = 0;
              stat.lastValueSent = newValue;
            } else if (Math.abs(stat.lastValueSent - stat.lastMean) >= 1) {
              // if the mean value differs from the last sent value by 1 degree or more, send the mean value to MQTT
              publishValue(stat.lastMean);
              stat.lastMeanDuration = 0;
              stat.lastValueSent = stat.lastMean;
            }

          }
        } else {
          publishValue(newValue);
        }
        // special case for energy counter to convert from Wmin to Wh
        if (prop.startsWith("energyCounter")) {
          client
            .publishAsync(
              `${getDeviceTopicPrefix(device)}/${prop}-wh`,
              JSON.stringify(newValue / 60),
              {
                qos: 0,
                retain: true,
              }
            )
            .catch((error) => console.error("Error during publish", error));
        }
      }
    );

    device.on("online", () => {
      // the device went online
      console.log("Device with ID", device.id, "went online");
      client
        .publishAsync(
          `${getDeviceTopicPrefix(device)}/state`,
          payload_available,
          {
            qos: 0,
            retain: true,
          }
        )
        .catch((error) => console.error("Error during publish", error));
    });

    device.on("offline", () => {
      // the device went offline
      console.log("Device with ID", device.id, "went offline");
      client
        .publishAsync(
          `${getDeviceTopicPrefix(device)}/state`,
          payload_unavailable,
          {
            qos: 0,
            retain: true,
          }
        )
        .catch((error) => console.error("Error during publish", error));
    });
  });

  if (args.shelly_login && args.shelly_password) {
    shellies.setAuthCredentials(args.shelly_login, args.shelly_password);
  }

  // start discovering devices and listening for status updates
  await shellies.start();
  console.log("Start listening shellies");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Remove old configuration
 */
async function cleanup() {
  const client = await connectAsync(args.mqtturl, {
    connectTimeout: 10000,
  });
  console.log("MQTT connected ?", client.connected);

  client.on("message", (topic, payload) => {
    if (payload && payload.byteLength > 0) {
      client.publish(topic, "", {
        retain: true,
        qos: 0,
      });
    }
  });
  await client.subscribeAsync(
    `${args.homeassistantprefix}/+/shellies/+/config`,
    {
      qos: 0,
    }
  );

  await delay(5000);

  await client.endAsync();
}

(args.cleanup ? cleanup() : Promise.resolve())
  .catch((error) => {
    console.error("Cleanup error :", error);
  })
  .then(() => {
    start().catch((error) => {
      console.error("Fatal error :", error);
    });
  });
