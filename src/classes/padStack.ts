/* eslint-disable prefer-destructuring */
/* eslint-disable prettier/prettier */
/* eslint-disable lines-between-class-members */
/* eslint-disable import/prefer-default-export */

// Main application Devices instances in memory storage
// Methods allows to read, store and emit storage events
//
// todo:
// - Stonger typization (disallow :any where its possible)
// - Inheritance
// - Ability to extend Class and constructor
// - More comments

import EventEmitter from "events";

export class PadStack {
  public collection: any;

  constructor() {
    this.collection = {
      stack: [],
      data: {},
      ports: []
    };
  }

  public emitter = new EventEmitter();

  public getStack = () => {
    return this.collection.stack;
  }

  public searchInStack = (uuid: string) => {
    if(Object.keys(this.collection.data).length === 0){
      return {error: `No Pads are currently connected`};
    }

    const padData = (this.collection.data as any)[uuid];
    if(!padData) {
      return {error: `Pad with identificator ${uuid} is not found `}
    }

    return {
      device: this.collection.stack[padData.index],
      stackMeta: this.collection.data[uuid],
    };
  }

  public addToStack = (pad: any) => {
    const newItemIndex = this.collection.stack.push(pad) - 1;
    this.collection.data[pad.uuid] = {
      index: newItemIndex,
      name: pad.padConfig.name,
      config: pad.padConfig,
      layout: pad.layout,
      port: pad.deviceMeta.path,
      uuid: pad.uuid
    }
    this.collection.ports.push(pad.deviceMeta.path);

    this.emitter.emit(
      'added',
      {
        added: pad,
        padMeta: this.collection.data[pad.uuid],
        port: this.collection.data[pad.uuid].port,
        stack: this.collection
      });

    return {
      added: pad,
      stack: this.collection
    };
  }

  public removeFromStack = (uuid: string) => {
    const pad: any = this.searchInStack(uuid);

    if(pad.error !== undefined){
      return pad.error;
    }

    this.collection.stack.splice(pad.stackMeta.index, 1);
    this.collection.ports.splice(pad.stackMeta.port, 1);
    delete this.collection.data[uuid];

    this.emitter.emit(
      'removed',
      {
        removed: pad.device,
        padMeta: pad.stackMeta,
        port: pad.stackMeta.port,
        stack: this.collection
      });

    return {
      removed: pad.device,
      padMeta: pad.stackMeta,
      port: pad.stackMeta.port,
      stack: this.collection
    };
  }

}
