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
    name: device.id,
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
      case "SHSW-1":
        await addRelay0(client, prefix, device, deviceprefix);
        break;
      case "SHSW-L":
        await addPower0(client, prefix, device, deviceprefix);
        await addEnergyCounter0(client, prefix, device, deviceprefix);
        await addRelay0(client, prefix, device, deviceprefix);
        await addInternalTemp(client, prefix, device, deviceprefix);
        await addOverheated(client, prefix, device, deviceprefix);
        break;
      case "SHSW-PM":
        await addPower0(client, prefix, device, deviceprefix);
        await addEnergyCounter0(client, prefix, device, deviceprefix);
        await addRelay0(client, prefix, device, deviceprefix);
        await addInternalTemp(client, prefix, device, deviceprefix);
        await addOverheated(client, prefix, device, deviceprefix);
        await addoverPower(client, prefix, device, deviceprefix);
        await addoverPowerValue(client, prefix, device, deviceprefix);
        break;
      case "SHPLG-S":
        await addPower0(client, prefix, device, deviceprefix);
        await addEnergyCounter0(client, prefix, device, deviceprefix);
        await addRelay0(client, prefix, device, deviceprefix);
        await addInternalTemp(client, prefix, device, deviceprefix);
        await addOverheated(client, prefix, device, deviceprefix);
        await addoverPower(client, prefix, device, deviceprefix);
        await addoverPowerValue(client, prefix, device, deviceprefix);
        break;
      case "SHPLG-1":
      case "SHPLG2-1":
        await addPower0(client, prefix, device, deviceprefix);
        await addEnergyCounter0(client, prefix, device, deviceprefix);
        await addRelay0(client, prefix, device, deviceprefix);
        await addoverPower(client, prefix, device, deviceprefix);
        await addoverPowerValue(client, prefix, device, deviceprefix);
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
      name: `SH-${device.id}-state`,
      unique_id: `SH-${device.id}-state`,
      state_topic: `${deviceprefix}/relay0`,
      command_topic: `${deviceprefix}/relay0/SET`,
      availability_topic: `${deviceprefix}/state`,
      payload_available,
      payload_not_available,
      state_on: "true",
      state_off: "false",
      device: getHomeAssistantDevice(device),
    }),
    {
      retain: true,
      qos: 0,
    }
  );
}

async function addPower0(client, prefix, device, deviceprefix) {
  await client.publish(
    prefix + `sensor/shellies/${device.id}-power/config`,
    JSON.stringify({
      name: `SH-${device.id}-power`,
      state_topic: `${deviceprefix}/power0`,
      availability_topic: `${deviceprefix}/state`,
      payload_available,
      payload_not_available,
      unit_of_measurement: "W",
      device: getHomeAssistantDevice(device),
      device_class: "power",
      unique_id: `SH-${device.id}-power`,
    }),
    {
      retain: true,
      qos: 0,
    }
  );
}

async function addEnergyCounter0(client, prefix, device, deviceprefix) {
  await client.publish(
    prefix + `sensor/shellies/${device.id}-energy/config`,
    JSON.stringify({
      name: `SH-${device.id}-energy`,
      state_topic: `${deviceprefix}/energyCounter0`,
      availability_topic: `${deviceprefix}/state`,
      payload_available,
      payload_not_available,
      unit_of_measurement: "Wmin",
      device: getHomeAssistantDevice(device),
      device_class: "power",
      unique_id: `SH-${device.id}-energy`,
    }),
    {
      retain: true,
      qos: 0,
    }
  );
}

async function addoverPowerValue(client, prefix, device, deviceprefix) {
  await client.publish(
    prefix + `sensor/shellies/${device.id}-overpowervalue/config`,
    JSON.stringify({
      name: `SH-${device.id}-overpowervalue`,
      state_topic: `${deviceprefix}/overPowerValue`,
      availability_topic: `${deviceprefix}/state`,
      payload_available,
      payload_not_available,
      unit_of_measurement: "W",
      device: getHomeAssistantDevice(device),
      device_class: "power",
      unique_id: `SH-${device.id}-overpowervalue`,
    }),
    {
      retain: true,
      qos: 0,
    }
  );
}

async function addInternalTemp(client, prefix, device, deviceprefix) {
  await client.publish(
    prefix + `sensor/shellies/${device.id}-deviceTemperature/config`,
    JSON.stringify({
      name: `SH-${device.id}-deviceTemperature`,
      state_topic: `${deviceprefix}/deviceTemperature`,
      availability_topic: `${deviceprefix}/state`,
      payload_available,
      payload_not_available,
      unit_of_measurement: "°C",
      device: getHomeAssistantDevice(device),
      device_class: "temperature",
      unique_id: `SH-${device.id}-deviceTemperature`,
    }),
    {
      retain: true,
      qos: 0,
    }
  );
}

async function addOverheated(client, prefix, device, deviceprefix) {
  await client.publish(
    prefix + `binary_sensor/shellies/${device.id}-overTemperature/config`,
    JSON.stringify({
      name: `SH-${device.id}-overTemperature`,
      state_topic: `${deviceprefix}/overTemperature`,
      availability_topic: `${deviceprefix}/state`,
      payload_available,
      payload_not_available,
      payload_on: "true",
      payload_off: "false",
      device: getHomeAssistantDevice(device),
      device_class: "heat",
      unique_id: `SH-${device.id}-overTemperature`,
    }),
    {
      retain: true,
      qos: 0,
    }
  );
}

async function addoverPower(client, prefix, device, deviceprefix) {
  await client.publish(
    prefix + `binary_sensor/shellies/${device.id}-overPower/config`,
    JSON.stringify({
      name: `SH-${device.id}-overPower`,
      state_topic: `${deviceprefix}/overPower`,
      availability_topic: `${deviceprefix}/state`,
      payload_available,
      payload_not_available,
      payload_on: "true",
      payload_off: "false",
      device: getHomeAssistantDevice(device),
      device_class: "heat",
      unique_id: `SH-${device.id}-overPower`,
    }),
    {
      retain: true,
      qos: 0,
    }
  );
}

module.exports = {
  addToHomeAssistantDiscover,
};
