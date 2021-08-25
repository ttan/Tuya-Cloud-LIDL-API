import pkg from 'tuya-cloud-api'
const { tuyaApi } = pkg

import express from 'express'
const app = express();
const PORT = process.env.PORT || 5000

const apiClientId = 'TUYA_CLIENT_ID';
const apiClientSecret = 'TUYA_CLIENT_SECRET';

function scaleTo(val, in_min, in_max, out_min, out_max){
	var result = out_min + (val - in_min) * ((out_max - out_min) / (in_max - in_min))
  return result
}

async function toggleDevice(deviceId, state, cmd) {
  console.log(deviceId)
  var code = cmd
  console.log(code)

  if (code == "bright_value") {
    state = state * 10
  }

  if (code == "temp_value_v2") {
    state = scaleTo(state, 140, 500, 1, 1000)
    state = parseInt(state)
    state = 1000 - state
  }
  console.log(state)

  await tuyaApi.authorize({
    apiClientId,
    apiClientSecret,
    serverLocation: 'eu',
  });
  // get fresh device info
  const deviceStatus = await tuyaApi.getDeviceStatus({
    deviceId: deviceId,
  });
  const switchStatus = deviceStatus.find((item) => item.code === code);

  if (!switchStatus) {
    throw new Error(`Can not find status for command: ${code}`);
  }

  if (switchStatus.value === state) {
    return;
  }

  await tuyaApi.sendCommand({
    deviceId,
    commands: [
      {
        code,
        value: state,
      },
    ],
  });
}

async function getStatus(deviceId, code) {
  
  await tuyaApi.authorize({
    apiClientId,
    apiClientSecret,
    // Optionally you can select which server to use
    serverLocation: 'eu',
  });
  // get fresh device info
  let deviceStatus = await tuyaApi.getDeviceStatus({
    deviceId: deviceId,
  });

  for (let i = 0; i < deviceStatus.length; i++) {
    if (deviceStatus[i].code == code) {
      var value = deviceStatus[i].value
      // if (value == false) {
      //   value = 0
      // } else {
      //   value = 1
      // }
      if (code == "bright_value") {
        value = value / 10
        value = parseInt(value)
      }
      if (code == "temp_value_v2") {
         value = scaleTo(value, 1, 1000, 140, 500)
         value = parseInt(value)
      }
      console.log(value)
      return value;
    }
  }
}
  //const switchStatus = deviceStatus.find((item) => item.code === code);
  

app.get('/toggle/:deviceId/:command/:newStatus', (req, res) => {
  var toggledDeviceId = req.params.deviceId
  var cmd = req.params.command
  if (req.params.newStatus == 'true') {
    var status = true;
  } else if (req.params.newStatus == 'false') {
    var status = false;
  } else {
    var status = parseInt(req.params.newStatus)
  }
  {
    (async () => {
      try {
        await toggleDevice(toggledDeviceId, status, cmd);
        res.send("Done")
      } catch (error) {
        console.error('Error toggling device on', error);
        process.exit(1);
      }
    })();
  }
});

app.get('/status/:deviceId/:code', (req, res) => {
  var statusDeviceId = req.params.deviceId;
  var code = req.params.code;
  {
    (async () => {
      try {

        let result = await getStatus(statusDeviceId, code)
        res.send(result.toString())
       
      } catch (error) {
        console.error('Error getting device status', error);
        process.exit(1);
      }
    })();
  }
});

app.listen(PORT, () => console.log('Fuckin LIDL you made a shitty job'));
