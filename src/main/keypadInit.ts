/* eslint-disable no-async-promise-executor */
/* eslint-disable no-unused-vars */
/* eslint-disable prettier/prettier */
import { v4 as uuidv4 } from 'uuid';
import { SerialPort, ReadlineParser } from 'serialport';
import { PadStack } from '../classes/padStack';
import { Pad } from '../classes/padClass';


// eslint-disable-next-line import/prefer-default-export, consistent-return
export async function checkConnectedPads(stack: PadStack) {
  return new Promise(async (resolve) => {
    const ports = await SerialPort.list();
    const searchList: any[] = [];
    const compatableList: any[] = [];

    ports.forEach(async (port) => {
      if (port.vendorId === '0727' && port.productId === '0727') {
        searchList.push(port);
      }
    });

    if (searchList && searchList.length > 0) {
      searchList.forEach((device) => {
        if(!stack.collection.ports.includes(device.path)){
          const deviceSerialConnection = new SerialPort({
            path: device.path,
            baudRate: 115200,
          });
          const parser = new ReadlineParser();

          deviceSerialConnection.pipe(parser);

          compatableList.push({
            listener: parser,
            deviceObject: device,
            deviceSerialObject: deviceSerialConnection,
            uuid: uuidv4()
          })
        }
      })
    }
    resolve(compatableList);
  }).catch((err) => console.log);
}

export async function handlePads(devices: any[], stack: PadStack) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {

    if(devices.length > 0){
      if(devices.length !== stack.collection.stack.length) {

        // eslint-disable-next-line no-restricted-syntax, guard-for-in
        for(const device in devices) {
          const deviceInstance = new Pad(devices[device]);

          // eslint-disable-next-line no-await-in-loop
          await deviceInstance.setup();

          if(stack.collection.stack.length === 0){
            stack.addToStack(deviceInstance);
          }

          deviceInstance.deviceInterface.on('close', function(state: any){
            if(state.disconnected === true){
              stack.removeFromStack(deviceInstance.uuid);
            }
          })
          resolve(stack);
        }
      } else {
        resolve(stack);
      }
    }
  }).catch((err) => console.log);
}

