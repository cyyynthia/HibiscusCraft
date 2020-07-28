/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import FriendlyBuffer from '@hibiscus/util/buffer'
import { MAX_PACKET_LENGTH } from '@hibiscus/constants'

export default abstract class Packet {
  protected buf: FriendlyBuffer

  constructor () {
    this.buf = new FriendlyBuffer(Buffer.alloc(MAX_PACKET_LENGTH))
  }

  abstract encode (): Buffer
}
