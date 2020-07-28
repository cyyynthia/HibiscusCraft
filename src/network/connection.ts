/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import { createCipheriv, createDecipheriv } from 'crypto'
import { EventEmitter } from 'events'
import { Socket } from 'net'

import Packet from '@hibiscus/network/packet'
import FriendlyBuffer from '@hibiscus/util/buffer'
import PacketEventsListener from '@hibiscus/network/events'

import IntentPacket from '@hibiscus/network/handshake/intent'
import PongPacket from '@hibiscus/network/status/pong'
import StatusPacket from '@hibiscus/network/status/status'

enum State { HANDSHAKING, PLAY, STATUS, LOGIN }

export default class Connection extends EventEmitter {
  private socket: Socket
  private state: State
  private encryption: Buffer | false = false
  private compression = false
  private protocol: number
  player: null

  on: PacketEventsListener<this>

  constructor (socket: Socket) {
    super()

    this.socket = socket
    this.state = State.HANDSHAKING
    this.socket.on('data', this.receive.bind(this))
  }

  setState (state: State) {
    this.state = state
  }

  receive (packet: Buffer) {
    const packets = this.decodePacket(packet)
    for (const packet of packets) {
      switch (this.state) {
        case State.HANDSHAKING:
          this.handleHandshake(packet)
        break
        case State.PLAY:
          this.handlePlay(packet)
        break
        case State.STATUS:
          this.handleStatus(packet)
        break
        case State.LOGIN:
          this.handleLogin(packet)
        break
      }
    }
  }

  send (packet: Packet) {
    if (this.socket.writable) {
      this.socket.write(this.encodePacket(packet))
    }
  }

  disconnect () {
    // todo: send msg n all
    this.socket.end()
  }

  private handleHandshake (packet: FriendlyBuffer) {
    if (packet.readVarInt() !== 0) {
      this.socket.end()
    }

    const intentPacket = new IntentPacket(packet)
    this.protocol = intentPacket.protocol
    console.log(this.protocol)
    if (intentPacket.intent === 1) {
      this.setState(State.STATUS)
    } else if (intentPacket.intent === 2) {
      this.setState(State.LOGIN)
    } else {
      this.socket.end()
    }
  }

  private handleStatus (packet: FriendlyBuffer) {
    const op = packet.readVarInt()
    switch (op) {
      case 0:
        this.send(new StatusPacket())
      break
      case 1:
        this.send(new PongPacket(packet.readBigInt64BE()))
        this.socket.end()
      break
      default:
        this.socket.end()
      break
    }
  }

  private handlePlay (packet: FriendlyBuffer) {

  }

  private handleLogin (packet: FriendlyBuffer) {

  }

  private decodePacket (packet: Buffer): FriendlyBuffer[] { // todo: legacy versions stuff
    if (this.encryption) {
      const cipher = createDecipheriv('aes-128-gcm', this.encryption, this.encryption)
      packet = Buffer.concat([ cipher.update(packet), cipher.final() ])
    }

    if (this.compression) {

    }

    const buf = new FriendlyBuffer(packet)
    const packets: FriendlyBuffer[] = []
    while (buf.isReadable()) {
      try {
        const n = buf.readVarInt()
        if (buf.readableBytes() < n) break
        packets.push(buf.readBytes(n))
      } catch (_) {
        break
      }
    }

    return packets
  }

  private encodePacket (packet: Packet): Buffer {
    let buffer = packet.encode()
    const length = buffer.length
    const vil = FriendlyBuffer.getVarIntSize(length)
    if (vil > 3) throw new Error('Too large')
  
    const fbuf = new FriendlyBuffer(Buffer.alloc(buffer.length + 3))
    fbuf.writeVarInt(length)
    fbuf.writeBytes(buffer)
    buffer = fbuf.toBuffer()

    if (this.compression) {

    }

    if (this.encryption) {
      const cipher = createCipheriv('aes-128-gcm', this.encryption, this.encryption)
      buffer = Buffer.concat([ cipher.update(buffer), cipher.final() ])
    }

    return buffer
  }
}
