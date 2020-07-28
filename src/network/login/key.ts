/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import FriendlyBuffer from '@hibiscus/util/buffer'

export default class KeyPacket {
  privateKey: Buffer
  nonce: Buffer

  constructor (buf: FriendlyBuffer) {
    this.privateKey = buf.readBytes(buf.readVarInt()).getBuffer()
    this.nonce = buf.readBytes(buf.readVarInt()).getBuffer()
  }
}
