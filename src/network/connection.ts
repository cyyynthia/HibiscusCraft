/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import { EventEmitter } from 'events'
import { Socket } from 'net'

import Packet from './packet'

export default class Connection extends EventEmitter {
  private socket: Socket
  player: null

  constructor (socket: Socket) {
    super()

    this.socket = socket
  }

  send (packet: Packet) {
    if (this.socket.writable) {
      this.socket.write(packet.encode())
    }
  }
}
