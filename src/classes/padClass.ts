/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable prefer-destructuring */
/* eslint-disable prettier/prettier */
/* eslint-disable lines-between-class-members */
/* eslint-disable import/prefer-default-export */

// General Pad-family Device instance class
// Methods allows to read, write and calibrate the device
//
// todo:
// - Stonger typization (disallow :any where its possible)
// - Inheritance
// - Ability to extend Class and constructor
// - Fix freaking eslint
// - Add per device emitters for events
// - More comments
// - Better search (its awful)
// - Calibration

export class Pad {
  public deviceInterface: any;
  public deviceMeta: any;
  public listener: any;
  public padConfig: any;
  public uuid: string;
  public layout: any;


  constructor(device: any) {
    this.deviceInterface = device.deviceSerialObject;
    this.listener = device.listener;
    this.deviceMeta = device.deviceObject;
    this.uuid = device.uuid;
    this.layout = {};
  }

  // eslint-disable-next-line class-methods-use-this
  private correctValueType(value: string) {
    if(value.length === parseInt(value, 10).toString().length && Number.isInteger(parseInt(value, 10))){
      return parseInt(value, 10);
    }
      return value;
  }
  // eslint-disable-next-line class-methods-use-this
  private correctKeys(type: string, key: any | undefined): string {
    return key !== undefined ? `${key}.${type}` : type;
  }

  // very, very, VERY shitty way of counting amount of keys
  // eslint-disable-next-line class-methods-use-this
  private countKeys(config: any){
    const vars = Object.keys(config);
    let keys = 0;
    vars.forEach((key) => {
      if(key.includes('key'))
      keys += 1;
    })

    return keys;
  }

  public setup = async () => {
    const config = await this.getConfigDevice();
    this.layout.keysAmount = this.countKeys(config);
    this.padConfig = config;
    return this;
  }

  public updateSetup = async() => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const config = await this.getConfigDevice();
      if(config) {
        this.padConfig = config;
        resolve(this);
      } else {
        reject({error: `Couldn't retrieve configuration data from the device. Please check if device is still connected.`})
      }
    }).catch((err)=>{console.log(err)})
  }

  public getConfigDevice = async () => {
    const { listener, deviceInterface, correctValueType } = this;
    return new Promise((resolve, reject) => {
      deviceInterface.write('GET\n', async() => {
        const config: any = {};
        listener.on('data', (data: string) => {
          if(data.includes('GET')){
            if(data.includes('END')){
              resolve(config);
            } else {
              const param = data.split(' ')[1].split('=');
              let key;
              const val = correctValueType(param[1]);

              if(param[0].includes('.')){
                const [key1, key2] = param[0].split('.');
                if(config[key1] === undefined){
                  config[key1] = {};
                }
                config[key1][key2] = val;
              } else {
                key = param[0]
                config[key] = val;
              }

            }
          }
        })
      });
    }).catch((err)=>{console.log(err)})
  }

  public getConfigMem = async () => {
    return new Promise((resolve, reject) => {
      if(this.padConfig){
        resolve(this.padConfig);
      } else {
        reject({error: `Device wasn't setup correctly, please run setup() method first.`})
      }
    }).catch((err)=>{console.log(err)})
  }

  public getParamDevice = async (type: string, key: any | undefined) => {
    const { getConfigDevice, correctKeys } = this;
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const config: any = await getConfigDevice();
      let value: string | String | number;
      if(typeof config !== 'object'){
        reject({error: "Error occured during config retrieval process"});
      } else {
        if(key !== undefined) {
          value = config[key][type];
        } else {
          value = config[type];
        }
        if(Number.isInteger(value) || typeof value === 'string' || value instanceof String) {
          resolve({param: correctKeys(type, key), value});
        } else {
          reject({error: `Parameter ${correctKeys(type, key)} is not found`});
        }

      }

    }).catch((err)=>{console.log(err)})
  }

  public getParamMem = async (type: string, key: any | undefined) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      let param;
      if(key !== undefined){
        if(this.padConfig[key] === undefined){
          reject({error: `Key ${key} object is not found in configuration of the device`})
        }
        param = this.padConfig[key][type];
        if(param === undefined){
          reject({error: `Parameter ${type} is not found in Key ${key} object`})
        }
        resolve(param);
      } else {
        param = this.padConfig[type];
        if(param === undefined){
          reject({error: `Parameter ${type} is not found in the global scope of configuration of the device`})
        }
        resolve(param);
      }
    }).catch((err)=>{console.log(err)})
  }

  public writeParamMem = async(type: string, value: any, key: any | undefined) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const config = await this.getConfigMem();
      if(!config){
        reject({error: `Device wasn't setup correctly, please run setup() method first.`})
      }

      const param = await this.getParamMem(type, key);
      if(!param){
        reject({error: `Parameter ${type} is not found`});
      }

      if(key !== undefined){
        this.padConfig[key][type] = value;
      } else {
        this.padConfig[type] = value;
      }
      resolve(this.padConfig);

    }).catch((err)=>{console.log(err)})
  }

  public writeParamDevice = async (type: string, value: any, key: any | undefined) => {
    const { deviceInterface, getParamMem, correctKeys } = this;
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const param = await getParamMem(type, key) as any;
      if(param === undefined || param?.error !== undefined){
        reject({error: `Parameter ${type} is not found`});
      } else {
        const combined = `${correctKeys(type, key)} ${value}`;
        console.log(combined);
        deviceInterface.write(`${combined}\n`, async () => {
          resolve({action: 'written', type, value, key});
        });
      }
    }).catch((err)=>{console.log(err)})
  }

  public writeDevice = async (command: string) => {
    const { deviceInterface } = this;
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      deviceInterface.write(command, async () => {
        resolve(command);
      })
    })
  }

  public saveDevice = async () => {
    const { deviceInterface } = this;
    return new Promise((resolve, reject) => {
      deviceInterface.write('save\r');
      resolve({action: 'saved', details: this.padConfig})
    }).catch((err)=>{console.log(err)})
  }

  public saveSingle = async (type: string, value: any, key: any | undefined) => {
    const { saveDevice, writeParamMem, writeParamDevice } = this;
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
        await writeParamDevice(type, value, key);
        await writeParamMem(type, value, key);
        const result: any = await saveDevice();
        if(result && result.action === 'saved') {
          resolve(result);
        } else {
          reject({error: `Unexpected error during saving process`})
        }
    }).catch((err)=>{console.log(err)})
  }

  public saveAll = async (params: [any]) => {
    const { saveDevice, writeParamMem, writeParamDevice } = this;
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      if(Array.isArray(params) && params.length > 0) {
        params.forEach(async (node) => {
          await writeParamDevice(node.type, node.value, node.key);
          await writeParamMem(node.type, node.value, node.key);
        })
        saveDevice();
        resolve({action: 'saved', params});
      }
    }).catch((err)=>{console.log(err)})
  }

  public echo = async (command: string) => {
    const { deviceInterface, listener } = this;
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      deviceInterface(`echo ${command}\n`, async() => {});
    }).catch((err)=>{console.log(err)})
  }

  async calibrateEnable() {
    const { listener, deviceInterface } = this;
  }

  async calibrateDisable() {
    const { listener, deviceInterface } = this;
  }

  async calibrateSave() {
    const { listener, deviceInterface } = this;
  }

}
