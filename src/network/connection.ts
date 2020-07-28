/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import { Socket } from 'net'
import { EventEmitter } from 'events'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

import Server from '@hibiscus/server'
import { PlayerProfile, authenticate } from '@hibiscus/mojang'
import FriendlyBuffer from '@hibiscus/util/buffer'
import PacketEventsListener from '@hibiscus/network/events'
import Packet from '@hibiscus/network/packet'

import IntentPacket from '@hibiscus/network/handshake/intent'
import StatusPacket from '@hibiscus/network/status/status'
import PongPacket from '@hibiscus/network/status/pong'
import LoginHelloPacket from '@hibiscus/network/login/hello'
import KeyPacket from '@hibiscus/network/login/key'

enum State { HANDSHAKING, PLAY, STATUS, LOGIN }
type Compressor = { inflate: any, deflate: any }

export default class Connection extends EventEmitter {
  private socket: Socket
  private state: State
  private encryption: Buffer | false = false
  private compression = false
  private protocol: number
  playerName: string
  player: null
  nonce: Buffer

  on: PacketEventsListener<this>

  constructor (socket: Socket) {
    super()

    this.socket = socket
    this.nonce = randomBytes(4)
    this.state = State.HANDSHAKING
    this.socket.on('data', this.receive.bind(this))
  }

  setPlayer (player: PlayerProfile) {
    console.log('no', player)
  }

  setupCompression () {
    console.log('yes')
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

  private receive (packet: Buffer) {
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

  private handleHandshake (packet: FriendlyBuffer) {
    if (packet.readVarInt() !== 0) {
      this.socket.end()
    }

    const intentPacket = new IntentPacket(packet)
    this.protocol = intentPacket.protocol
    if (intentPacket.intent === 1) {
      this.state = State.STATUS
    } else if (intentPacket.intent === 2) {
      this.state = State.LOGIN
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
    const op = packet.readVarInt()
    switch (op) {
      case 0:
        this.playerName = packet.readUtf(16)
        this.send(new LoginHelloPacket(this.nonce))
      break
      case 1:
        this.authenticate(new KeyPacket(packet))
      break
      default:
        this.disconnect() // todo: err message
      break
    }
  }

  private async authenticate (packet: KeyPacket) {
    try {
      if (!Server.getInstance().decrypt(packet.nonce).equals(this.nonce)) throw new Error()
      this.encryption = Server.getInstance().decrypt(packet.privateKey)
      const profile = await authenticate(this.playerName, this.encryption, Server.getInstance().publicKey)
      this.setupCompression()
      this.setPlayer(profile)
    } catch (e) {
      return this.disconnect() // 'Authentication failed.')
    }
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

    if (this.compression) {

    } else {
      const fbuf = new FriendlyBuffer(Buffer.alloc(buffer.length + 3))
      fbuf.writeVarInt(length)
      fbuf.writeBytes(buffer)
      buffer = fbuf.toBuffer()
    }

    if (this.encryption) {
      const cipher = createCipheriv('aes-128-gcm', this.encryption, this.encryption)
      buffer = Buffer.concat([ cipher.update(buffer), cipher.final() ])
    }

    return buffer
  }
}
