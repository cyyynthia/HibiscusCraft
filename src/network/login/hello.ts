/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import Server from '@hibiscus/server'
import Packet from '@hibiscus/network/packet'

export default class LoginHelloPacket extends Packet {
  private nonce: Buffer

  constructor (nonce: Buffer) {
    super()
    this.nonce = nonce
  }

  encode (): Buffer {
    this.buf.writeVarInt(1)
    this.buf.writeUtf('OwO')
    this.buf.writeVarInt(Server.getInstance().publicKey.length)
    this.buf.writeBytes(Server.getInstance().publicKey)
    this.buf.writeVarInt(this.nonce.length)
    this.buf.writeBytes(this.nonce)
    return this.buf.toBuffer()
  }
}
