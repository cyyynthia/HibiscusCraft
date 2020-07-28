/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import Packet from '@hibiscus/network/packet'

export default class PongPacket extends Packet {
  private timestamp: bigint

  constructor (timestamp: bigint) {
    super()
    this.timestamp = timestamp
  }

  encode (): Buffer {
    this.buf.writeVarInt(1)
    this.buf.writeBigInt64BE(this.timestamp)
    return this.buf.toBuffer()
  }
}
