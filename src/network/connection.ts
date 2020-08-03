/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import { Socket } from 'net'
import { EventEmitter } from 'events'
import { inflate, deflate } from 'zlib'
import { createCipheriv, createDecipheriv, randomBytes, Cipher, Decipher } from 'crypto'

import Server from '@hibiscus/server'
import { COMPRESSION_THRESHOLD } from '@hibiscus/constants'
import { authenticate } from '@hibiscus/mojang'
import Player from '@hibiscus/objects/entities/player'
import FriendlyBuffer from '@hibiscus/util/buffer'

import PacketEventsListener from '@hibiscus/network/events'
import Packet from '@hibiscus/network/packet'
import IntentPacket from '@hibiscus/network/handshake/intent'
import StatusPacket from '@hibiscus/network/status/status'
import PongPacket from '@hibiscus/network/status/pong'
import LoginHelloPacket from '@hibiscus/network/login/hello'
import KeyPacket from '@hibiscus/network/login/key'
import LoginSuccessPacket from '@hibiscus/network/login/success'
import LoginCompressionPacket from '@hibiscus/network/login/compression'

const enum State { HANDSHAKING, PLAY, STATUS, LOGIN }
type Encryptor = { cipher: Cipher, decipher: Decipher }

export default class Connection extends EventEmitter {
  private socket: Socket
  private state: State
  private encryptor: Encryptor
  private compression: boolean
  private protocol: number
  player: Player | null
  playerName: string
  nonce: Buffer

  on: PacketEventsListener<this>

  constructor (socket: Socket) {
    super()

    this.socket = socket
    this.nonce = randomBytes(4)
    this.state = State.HANDSHAKING
    this.socket.on('data', this.receive.bind(this))
    this.socket.on('close', this.disconnect.bind(this))
    this.compression = false
  }

  async send (packet: Packet) {
    const buf = await this.encodePacket(packet)
    if (this.socket.writable) {
      this.socket.write(buf)
    }
  }

  disconnect () {
    // todo: send msg n all
    this.socket.end()
    this.emit('close')
  }

  private async receive (packet: Buffer) {
    const packets = await this.decodePacket(packet)
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
          .then(() => this.socket.end())
      break
      default:
        this.socket.end()
      break
    }
  }

  private handlePlay (packet: FriendlyBuffer) {
    console.log(packet.readVarInt())
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
      const key = Server.getInstance().decrypt(packet.privateKey)
      const profile = await authenticate(this.playerName, key, Server.getInstance().publicKey)
      this.encryptor = {
        cipher: createCipheriv('aes-128-cfb8', key, key),
        decipher: createDecipheriv('aes-128-cfb8', key, key)
      }

      this.send(new LoginCompressionPacket())
      this.compression = true

      this.send(new LoginSuccessPacket(profile))

      const player = new Player(this, profile)
      this.player = player
      this.state = State.PLAY

      Server.getInstance().playerManager.summonPlayer(player)
    } catch (e) {
      return this.disconnect() // 'Authentication failed.')
    }
  }

  private async decodePacket (packet: Buffer): Promise<FriendlyBuffer[]> { // todo: legacy versions stuff
    if (this.encryptor) {
      packet = this.encryptor.decipher.update(packet)
    }

    const buf = new FriendlyBuffer(packet)
    const packets: FriendlyBuffer[] = []
    while (buf.isReadable()) {
      try {
        const n = buf.readVarInt()
        if (buf.readableBytes() < n) break
        let payload = buf.readBytes(n).getBuffer()
        if (this.compression) {
          const buf = new FriendlyBuffer(payload)
          const length = buf.readVarInt()
          payload = buf.readBytes(buf.readableBytes()).getBuffer()
          if (length !== 0) {
            payload = await this.decompress(payload)
          }
        }

        packets.push(new FriendlyBuffer(payload))
      } catch (_) {
        break
      }
    }

    return packets
  }

  private async encodePacket (packet: Packet): Promise<Buffer> {
    let buffer = packet.encode()
    const b = Buffer.alloc(buffer.byteLength + 3)

    if (this.compression) {
      const fbuf = new FriendlyBuffer(b)
      if (buffer.byteLength > COMPRESSION_THRESHOLD) {
        fbuf.writeVarInt(buffer.byteLength)
        buffer = await this.compress(buffer)
      } else {
        fbuf.writeVarInt(0)
      }
      fbuf.writeBytes(buffer)
      buffer = fbuf.toBuffer()
    }

    const length = buffer.byteLength
    const vil = FriendlyBuffer.getVarIntSize(length)
    if (vil > 3) throw new Error('Too large')
    const fbuf = new FriendlyBuffer(b)
    fbuf.writeVarInt(length)
    fbuf.writeBytes(buffer)
    buffer = fbuf.toBuffer()

    if (this.encryptor) {
      buffer = this.encryptor.cipher.update(buffer)
    }

    return buffer
  }

  private compress (buffer: Buffer): Promise<Buffer> {
    return new Promise<Buffer>(resolve => deflate(buffer, (_, res) => resolve(res)))
  }

  private decompress (buffer: Buffer): Promise<Buffer> {
    return new Promise<Buffer>(resolve => inflate(buffer, (_, res) => resolve(res)))
  }
}
