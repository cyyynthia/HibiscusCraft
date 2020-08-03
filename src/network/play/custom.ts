/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import Packet from '@hibiscus/network/packet'

export default class CustomPayloadPacket extends Packet {
  private type: string
  private payload: Buffer

  constructor (type: string, payload: Buffer) {
    super()
    this.type = type
    this.payload = payload
  }

  encode (): Buffer {
    this.buf.writeVarInt(24)
    this.buf.writeUtf(this.type)
    this.buf.writeBytes(this.payload)
    return this.buf.toBuffer()
  }
}
