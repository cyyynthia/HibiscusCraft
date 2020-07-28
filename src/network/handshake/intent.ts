/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import FriendlyBuffer from '@hibiscus/util/buffer'

export default class IntentPacket {
  protocol: number
  host: string
  port: number
  intent: number

  constructor (buf: FriendlyBuffer) {
    this.protocol = buf.readVarInt()
    this.host = buf.readUtf(255)
    this.port = buf.readUIntBE(2)
    this.intent = buf.readVarInt()
  }
}
