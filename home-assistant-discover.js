const payload_available = "online";
const payload_not_available = "offline";

const payload_on = "true";
const payload_off = "false";

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
        await addInput0(client, prefix, device, deviceprefix);
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
      case "SHTRV-01":
        await addTemperature(client, prefix, device, deviceprefix);
        await addTargetTemperature(client, prefix, device, deviceprefix);
        await addBattery(client, prefix, device, deviceprefix);
        await addMode(client, prefix, device, deviceprefix);
        await addValvePosition(client, prefix, device, deviceprefix);
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

async function addInput0(client, prefix, device, deviceprefix) {
  await client.publish(
    prefix + `binary_sensor/shellies/${device.id}-input/config`,
    JSON.stringify({
      name: `SH-${device.id}-input`,
      unique_id: `SH-${device.id}-input`,
      state_topic: `${deviceprefix}/input0`,
      availability_topic: `${deviceprefix}/state`,
      payload_available,
      payload_not_available,
      payload_on: "1",
      payload_off: "0",
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
      device_class: "energy",
      state_class: "total_increasing",
      unique_id: `SH-${device.id}-energy`,
    }),
    {
      retain: true,
      qos: 0,
    }
  );

  // energie in Wh
  await client.publish(
    prefix + `sensor/shellies/${device.id}-energy-wh/config`,
    JSON.stringify({
      name: `SH-${device.id}-energy-wh`,
      state_topic: `${deviceprefix}/energyCounter0-wh`,
      availability_topic: `${deviceprefix}/state`,
      payload_available,
      payload_not_available,
      unit_of_measurement: "Wh",
      device: getHomeAssistantDevice(device),
      device_class: "energy",
      state_class: "total_increasing",
      unique_id: `SH-${device.id}-energy-wh`,
    }),
    {
      retain: true,
      qos: 0,
    }
  );
}

async function addoverPowerValue(client, prefix, device, deviceprefix) {
  await addCaractheristic(
    client,
    prefix,
    device,
    deviceprefix,
    "overpowervalue",
    "W",
    "power"
  );
}

async function addInternalTemp(client, prefix, device, deviceprefix) {
  await addCaractheristic(
    client,
    prefix,
    device,
    deviceprefix,
    "deviceTemperature",
    "°C",
    "temperature"
  );
}

async function addTemperature(client, prefix, device, deviceprefix) {
  await addCaractheristic(
    client,
    prefix,
    device,
    deviceprefix,
    "temperature",
    "°C",
    "temperature"
  );
}

async function addTargetTemperature(client, prefix, device, deviceprefix) {
  await addCaractheristic(
    client,
    prefix,
    device,
    deviceprefix,
    "targetTemperature",
    "°C",
    "temperature"
  );
}

async function addBattery(client, prefix, device, deviceprefix) {
  await addCaractheristic(
    client,
    prefix,
    device,
    deviceprefix,
    "battery",
    "%",
    "battery"
  );
}

async function addMode(client, prefix, device, deviceprefix) {
  await addCaractheristic(
    client,
    prefix,
    device,
    deviceprefix,
    "mode",
    undefined,
    undefined
  );
}

async function addValvePosition(client, prefix, device, deviceprefix) {
  await addCaractheristic(
    client,
    prefix,
    device,
    deviceprefix,
    "valvePosition",
    "%",
    undefined
  );
}

async function addOverheated(client, prefix, device, deviceprefix) {
  await addBinaryCaractheristic(
    client,
    prefix,
    device,
    deviceprefix,
    "overTemperature",
    "heat"
  );
}

async function addoverPower(client, prefix, device, deviceprefix) {
  await addBinaryCaractheristic(
    client,
    prefix,
    device,
    deviceprefix,
    "overPower",
    "power"
  );
}

async function addBinaryCaractheristic(
  client,
  prefix,
  device,
  deviceprefix,
  characteristic,
  deviceClass
) {
  await client.publish(
    prefix + `binary_sensor/shellies/${device.id}-${characteristic}/config`,
    JSON.stringify({
      name: `SH-${device.id}-${characteristic}`,
      state_topic: `${deviceprefix}/${characteristic}`,
      availability_topic: `${deviceprefix}/state`,
      payload_available,
      payload_not_available,
      payload_on,
      payload_off,
      device: getHomeAssistantDevice(device),
      device_class: deviceClass,
      unique_id: `SH-${device.id}-${characteristic}`,
    }),
    {
      retain: true,
      qos: 0,
    }
  );
}

async function addCaractheristic(
  client,
  prefix,
  device,
  deviceprefix,
  characteristic,
  unit,
  deviceClass
) {
  await client.publish(
    prefix + `sensor/shellies/${device.id}-${characteristic}/config`,
    JSON.stringify({
      name: `SH-${device.id}-${characteristic}`,
      state_topic: `${deviceprefix}/${characteristic}`,
      availability_topic: `${deviceprefix}/state`,
      payload_available,
      payload_not_available,
      unit_of_measurement: unit,
      device: getHomeAssistantDevice(device),
      device_class: deviceClass,
      unique_id: `SH-${device.id}-${characteristic}`,
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
