const payload_available = "online";
const payload_not_available = "offline";

/**
 *
 * @param {{id:string, type:string}} device
 */
function getHomeAssistantDevice(device) {
  return {
    identifiers: [`shelly-${device.id}`],
    manufacturer: "Shelly",
    model: device.type,
    name: device.id
  };
}

/**
 *
 * @param {import("async-mqtt").AsyncMqttClient} client
 * @param {{id:string, type:string}} device
 * @param {string} homeassistantprefix
 * @param {string} deviceprefix
 */
async function addToHomeAssistantDiscover(
  client,
  device,
  homeassistantprefix,
  deviceprefix
) {
  if (!homeassistantprefix) {
    return;
  }
  try {
    const prefix = `${homeassistantprefix}/`;
    switch (device.type) {
      case "SHPLG-S":
        await addSensor0(client, prefix, device, deviceprefix);
        await addRelay0(client, prefix, device, deviceprefix);
        await addInternalTemp(client, prefix, device, deviceprefix);
        break;
      case "SHPLG2-1":
        await addSensor0(client, prefix, device, deviceprefix);
        await addRelay0(client, prefix, device, deviceprefix);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error("Erreur during publish of auto discovery", error);
  }
}

async function addRelay0(client, prefix, device, deviceprefix) {
  await client.publish(
    prefix + `switch/shellies/${device.id}-state/config`,
    JSON.stringify({
      name: "SH-" + device.id + "-state",
      unique_id: "SH-" + device.id + "-state",
      state_topic: `${deviceprefix}/relay0`,
      command_topic: `${deviceprefix}/relay0/SET`,
      availability_topic: `${deviceprefix}/state`,
      payload_available,
      payload_not_available,
      state_on: "true",
      state_off: "false",
      device: getHomeAssistantDevice(device)
    }),
    {
      retain: true,
      qos: 0
    }
  );
}

async function addSensor0(client, prefix, device, deviceprefix) {
  await client.publish(
    prefix + `sensor/shellies/${device.id}-power/config`,
    JSON.stringify({
      name: "SH-" + device.id + "-power",
      state_topic: `${deviceprefix}/powerMeter0`,
      availability_topic: `${deviceprefix}/state`,
      payload_available,
      payload_not_available,
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
}

async function addInternalTemp(client, prefix, device, deviceprefix) {
  await client.publish(
    prefix + `sensor/shellies/${device.id}-internalTemperature/config`,
    JSON.stringify({
      name: "SH-" + device.id + "-internalTemperature",
      state_topic: `${deviceprefix}/internalTemperature`,
      availability_topic: `${deviceprefix}/state`,
      payload_available,
      payload_not_available,
      unit_of_measurement: "°C",
      device: getHomeAssistantDevice(device),
      device_class: "temperature",
      unique_id: "SH-" + device.id + "-internalTemperature"
    }),
    {
      retain: true,
      qos: 0
    }
  );
}
module.exports = {
  addToHomeAssistantDiscover
};
