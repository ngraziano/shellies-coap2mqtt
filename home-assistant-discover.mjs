import superagent from "superagent";

const payload_available = "online";
const payload_not_available = "offline";

const payload_on = "true";
const payload_off = "false";

/**
 *
 * @param {{id:string, type:string, host: string}} device device
 * @param {string} mac mac address of the device
 */
function getHomeAssistantDevice(device, mac) {
  // split device id in 6 parts of 2 chars
  const macFormated = mac.match(/.{2}/g).join(":");
  return {
    identifiers: [`shelly-${device.id}`],
    manufacturer: "Shelly",
    model: device.type,
    name: device.id,
    connections: [["mac", macFormated]],
    configuration_url: `http://${device.host}/`,
  };
}

/**
 *
 * @param {{id:string, type:string, host: string}} device device
 * @returns {Promise<string>} mac address of the device
 */
async function getDeviceMac(device) {
  if (device.id.length === 12) {
    return device.id;
  }
  const res = await superagent
    .get(`http://${device.host}/shelly`)
    .set("User-Agent", `shellies-coap2mqtt`)
    .timeout(10000);
  console.log("Mac query result", res.body.mac);
  return res.body.mac;
}

/**
 *
 * @param {import("mqtt").MqttClient} client
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

  const mac = await getDeviceMac(device);

  try {
    const prefix = `${homeassistantprefix}/`;
    switch (device.type) {
      case "SHSW-1":
        addRelay0(client, prefix, device, deviceprefix, mac);
        addInput0(client, prefix, device, deviceprefix, mac);
        break;
      case "SHSW-L":
        addPower0(client, prefix, device, deviceprefix, mac);
        addEnergyCounter0(client, prefix, device, deviceprefix, mac);
        addRelay0(client, prefix, device, deviceprefix, mac);
        addInternalTemp(client, prefix, device, deviceprefix, mac);
        addOverheated(client, prefix, device, deviceprefix, mac);
        break;
      case "SHSW-PM":
        addPower0(client, prefix, device, deviceprefix, mac);
        addEnergyCounter0(client, prefix, device, deviceprefix, mac);
        addRelay0(client, prefix, device, deviceprefix, mac);
        addInternalTemp(client, prefix, device, deviceprefix, mac);
        addOverheated(client, prefix, device, deviceprefix, mac);
        addoverPower(client, prefix, device, deviceprefix, mac);
        addoverPowerValue(client, prefix, device, deviceprefix, mac);
        break;
      case "SHPLG-S":
        addPower0(client, prefix, device, deviceprefix, mac);
        addEnergyCounter0(client, prefix, device, deviceprefix, mac);
        addRelay0(client, prefix, device, deviceprefix, mac);
        addInternalTemp(client, prefix, device, deviceprefix, mac);
        addOverheated(client, prefix, device, deviceprefix, mac);
        addoverPower(client, prefix, device, deviceprefix, mac);
        addoverPowerValue(client, prefix, device, deviceprefix, mac);
        break;
      case "SHPLG-1":
      case "SHPLG2-1":
        addPower0(client, prefix, device, deviceprefix, mac);
        addEnergyCounter0(client, prefix, device, deviceprefix, mac);
        addRelay0(client, prefix, device, deviceprefix, mac);
        addoverPower(client, prefix, device, deviceprefix, mac);
        addoverPowerValue(client, prefix, device, deviceprefix, mac);
        break;
      case "SHTRV-01":
        addTemperature(client, prefix, device, deviceprefix, mac);
        addTargetTemperature(client, prefix, device, deviceprefix, mac);
        addBattery(client, prefix, device, deviceprefix, mac);
        addMode(client, prefix, device, deviceprefix, mac);
        addValvePosition(client, prefix, device, deviceprefix, mac);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error("Erreur during publish of auto discovery", error);
  }
}

/**
 *
 * @param {import("mqtt").MqttClient} client
 * @param {string} prefix
 * @param {{id:string, type:string}} device
 * @param {string} deviceprefix
 */
function addRelay0(client, prefix, device, deviceprefix, mac) {
  client.publish(
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
      device: getHomeAssistantDevice(device, mac),
    }),
    {
      retain: true,
      qos: 0,
    }
  );
}

/**
 *
 * @param {import("mqtt").MqttClient} client
 * @param {string} prefix
 * @param {{id:string, type:string}} device
 * @param {string} deviceprefix
 */
function addInput0(client, prefix, device, deviceprefix, mac) {
  client.publish(
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
      device: getHomeAssistantDevice(device, mac),
    }),
    {
      retain: true,
      qos: 0,
    }
  );
}

/**
 *
 * @param {import("mqtt").MqttClient} client
 * @param {string} prefix
 * @param {{id:string, type:string}} device
 * @param {string} deviceprefix
 */
function addPower0(client, prefix, device, deviceprefix, mac) {
  client.publish(
    prefix + `sensor/shellies/${device.id}-power/config`,
    JSON.stringify({
      name: `SH-${device.id}-power`,
      state_topic: `${deviceprefix}/power0`,
      availability_topic: `${deviceprefix}/state`,
      payload_available,
      payload_not_available,
      unit_of_measurement: "W",
      device: getHomeAssistantDevice(device, mac),
      device_class: "power",
      unique_id: `SH-${device.id}-power`,
    }),
    {
      retain: true,
      qos: 0,
    }
  );
}

/**
 *
 * @param {import("mqtt").MqttClient} client
 * @param {string} prefix
 * @param {{id:string, type:string}} device
 * @param {string} deviceprefix
 */
function addEnergyCounter0(client, prefix, device, deviceprefix, mac) {
  client.publish(
    prefix + `sensor/shellies/${device.id}-energy/config`,
    JSON.stringify({
      name: `SH-${device.id}-energy`,
      state_topic: `${deviceprefix}/energyCounter0`,
      availability_topic: `${deviceprefix}/state`,
      payload_available,
      payload_not_available,
      unit_of_measurement: "Wmin",
      device: getHomeAssistantDevice(device, mac),
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
  client.publish(
    prefix + `sensor/shellies/${device.id}-energy-wh/config`,
    JSON.stringify({
      name: `SH-${device.id}-energy-wh`,
      state_topic: `${deviceprefix}/energyCounter0-wh`,
      availability_topic: `${deviceprefix}/state`,
      payload_available,
      payload_not_available,
      unit_of_measurement: "Wh",
      device: getHomeAssistantDevice(device, mac),
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

/**
 *
 * @param {import("mqtt").MqttClient} client
 * @param {string} prefix
 * @param {{id:string, type:string}} device
 * @param {string} deviceprefix
 */
function addoverPowerValue(client, prefix, device, deviceprefix, mac) {
  addCaractheristic(
    client,
    prefix,
    device,
    deviceprefix,
    mac,
    "overpowervalue",
    "W",
    "power"
  );
}

/**
 *
 * @param {import("mqtt").MqttClient} client
 * @param {string} prefix
 * @param {{id:string, type:string}} device
 * @param {string} deviceprefix
 */
function addInternalTemp(client, prefix, device, deviceprefix, mac) {
  addCaractheristic(
    client,
    prefix,
    device,
    deviceprefix,
    mac,
    "deviceTemperature",
    "°C",
    "temperature"
  );
}

/**
 *
 * @param {import("mqtt").MqttClient} client
 * @param {string} prefix
 * @param {{id:string, type:string}} device
 * @param {string} deviceprefix
 */
function addTemperature(client, prefix, device, deviceprefix, mac) {
  addCaractheristic(
    client,
    prefix,
    device,
    deviceprefix,
    mac,
    "temperature",
    "°C",
    "temperature"
  );
}

/**
 *
 * @param {import("mqtt").MqttClient} client
 * @param {string} prefix
 * @param {{id:string, type:string}} device
 * @param {string} deviceprefix
 */
function addTargetTemperature(client, prefix, device, deviceprefix, mac) {
  addCaractheristic(
    client,
    prefix,
    device,
    deviceprefix,
    mac,
    "targetTemperature",
    "°C",
    "temperature"
  );
}

/**
 *
 * @param {import("mqtt").MqttClient} client
 * @param {string} prefix
 * @param {{id:string, type:string}} device
 * @param {string} deviceprefix
 */
function addBattery(client, prefix, device, deviceprefix, mac) {
  addCaractheristic(
    client,
    prefix,
    device,
    deviceprefix,
    mac,
    "battery",
    "%",
    "battery"
  );
}

/**
 *
 * @param {import("mqtt").MqttClient} client
 * @param {string} prefix
 * @param {{id:string, type:string}} device
 * @param {string} deviceprefix
 */
function addMode(client, prefix, device, deviceprefix, mac) {
  addCaractheristic(
    client,
    prefix,
    device,
    deviceprefix,
    mac,
    "mode",
    undefined,
    undefined
  );
}

/**
 *
 * @param {import("mqtt").MqttClient} client
 * @param {string} prefix
 * @param {{id:string, type:string}} device
 * @param {string} deviceprefix
 */
function addValvePosition(client, prefix, device, deviceprefix, mac) {
  addCaractheristic(
    client,
    prefix,
    device,
    deviceprefix,
    mac,
    "valvePosition",
    "%",
    undefined
  );
}

/**
 *
 * @param {import("mqtt").MqttClient} client
 * @param {string} prefix
 * @param {{id:string, type:string}} device
 * @param {string} deviceprefix
 */
function addOverheated(client, prefix, device, deviceprefix, mac) {
  addBinaryCaractheristic(
    client,
    prefix,
    device,
    deviceprefix,
    mac,
    "overTemperature",
    "heat"
  );
}

/**
 *
 * @param {import("mqtt").MqttClient} client
 * @param {string} prefix
 * @param {{id:string, type:string}} device
 * @param {string} deviceprefix
 */
function addoverPower(client, prefix, device, deviceprefix, mac) {
  addBinaryCaractheristic(
    client,
    prefix,
    device,
    deviceprefix,
    mac,
    "overPower",
    "power"
  );
}

/**
 *
 * @param {import("mqtt").MqttClient} client
 * @param {string} prefix
 * @param {{id:string, type:string}} device
 * @param {string} deviceprefix
 * @param {string} characteristic
 * @param {string} deviceClass
 */
function addBinaryCaractheristic(
  client,
  prefix,
  device,
  deviceprefix,
  mac,
  characteristic,
  deviceClass
) {
  client.publish(
    prefix + `binary_sensor/shellies/${device.id}-${characteristic}/config`,
    JSON.stringify({
      name: `SH-${device.id}-${characteristic}`,
      state_topic: `${deviceprefix}/${characteristic}`,
      availability_topic: `${deviceprefix}/state`,
      payload_available,
      payload_not_available,
      payload_on,
      payload_off,
      device: getHomeAssistantDevice(device, mac),
      device_class: deviceClass,
      unique_id: `SH-${device.id}-${characteristic}`,
    }),
    {
      retain: true,
      qos: 0,
    }
  );
}

/**
 *
 * @param {import("mqtt").MqttClient} client
 * @param {string} prefix
 * @param {{id:string, type:string}} device
 * @param {string} deviceprefix
 * @param {string} characteristic
 * @param {string} unit
 * @param {string} deviceClass
 */
function addCaractheristic(
  client,
  prefix,
  device,
  deviceprefix,
  mac,
  characteristic,
  unit,
  deviceClass
) {
  client.publish(
    prefix + `sensor/shellies/${device.id}-${characteristic}/config`,
    JSON.stringify({
      name: `SH-${device.id}-${characteristic}`,
      state_topic: `${deviceprefix}/${characteristic}`,
      availability_topic: `${deviceprefix}/state`,
      payload_available,
      payload_not_available,
      unit_of_measurement: unit,
      device: getHomeAssistantDevice(device, mac),
      device_class: deviceClass,
      unique_id: `SH-${device.id}-${characteristic}`,
    }),
    {
      retain: true,
      qos: 0,
    }
  );
}

export { addToHomeAssistantDiscover };
