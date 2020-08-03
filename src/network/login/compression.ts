/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import Packet from '@hibiscus/network/packet'
import { COMPRESSION_THRESHOLD } from '@hibiscus/constants'

export default class LoginCompressionPacket extends Packet {
  encode (): Buffer {
    this.buf.writeVarInt(3)
    this.buf.writeVarInt(COMPRESSION_THRESHOLD)
    return this.buf.toBuffer()
  }
}
