const shellies = require("shellies");
const MQTT = require("async-mqtt");
const commandLineArgs = require("command-line-args");

/**
 * @type { commandLineArgs.OptionDefinition[] }
 */
const optionDefinitions = [
  { name: "verbose", alias: "v", type: Boolean },
  { name: "mqtturl", type: String, multiple: false, defaultOption: true },
  { name: "mqttprefix", type: String, defaultValue: "shellies" },
  { name: "homeassistantprefix", type: String, defaultValue: "homeassistant" }
];

const args = commandLineArgs(optionDefinitions);
/**
 *
 * @param {{id:string, type:string}} device
 */
function getHomeAssistantDevice(device) {
  return {
    identifiers: ["shelly", device.id],
    manufacturer: "Shelly",
    model: device.type,
    name: device.id
  };
}

/**
 *
 * @param {import("async-mqtt").AsyncMqttClient} client
 * @param {{id:string, type:string}} device
 */
async function addToHomeAssistantDiscover(client, device) {
  if (!args.homeassistantprefix) {
    return;
  }
  try {
    const prefix = `${args.homeassistantprefix}/`;
    const id = `/shellies/${device.id}/`;
    switch (device.type) {
      case "SHPLG-S":
        await client.publish(
          prefix + "sensor" + id + "config",
          JSON.stringify({
            name: "SH-" + device.id + "-power",
            state_topic: `${args.mqttprefix}/${device.id}/powerMeter0`,
            unit_of_measurement: "W",
            device: getHomeAssistantDevice(device),
            device_class: "power",
            unique_id: "SH-" + device.id + "-power"
          }),
          {
            retain: true,
            qos: 0
          }
        );
        await client.publish(
          prefix + "switch" + id + "config",
          JSON.stringify({
            name: "SH-" + device.id + "-state",
            unique_id: "SH-" + device.id + "-state",
            state_topic: `${args.mqttprefix}/${device.id}/relay0`,
            command_topic: `${args.mqttprefix}/${device.id}/relay0/SET`,
            state_on: "true",
            state_off: "false",
            device: getHomeAssistantDevice(device)
          }),
          {
            retain: true,
            qos: 0
          }
        );
        //
        break;

      default:
        break;
    }
  } catch (error) {
    console.error("Erreur during publish of auto discovery", error);
  }
}

async function start() {
  const client = await MQTT.connectAsync(
    args.mqtturl,
    { connectTimeout: 10000 },
    true
  );
  console.log("MQTT connected ?", client.connected);

  shellies.on("discover", device => {
    // a new device has been discovered
    console.log(
      "Discovered device with ID",
      device.id,
      "and type",
      device.type
    );
    client
      .publish(`${args.mqttprefix}/${device.id}/state`, "online", {
        qos: 0,
        retain: true
      })
      .catch(error => console.error("Error during publish", error));

    client
      .publish(`${args.mqttprefix}/${device.id}/type`, device.type, {
        qos: 0,
        retain: true
      })
      .catch(error => console.error("Error during publish", error));

    addToHomeAssistantDiscover(client, device);

    device.on("change", (prop, newValue, oldValue) => {
      // a property on the device has changed
      console.log(device.id, prop, "changed from", oldValue, "to", newValue);
      client
        .publish(
          `${args.mqttprefix}/${device.id}/${prop}`,
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
        .publish(`${args.mqttprefix}/${device.id}/state`, "offline", {
          qos: 0,
          retain: true
        })
        .catch(error => console.error("Error during publish", error));
    });
  });
  // start discovering devices and listening for status updates
  await shellies.start();
  console.log("Start listening shellies");
}

start().catch(error => {
  console.error("Fatal error :", error);
});
