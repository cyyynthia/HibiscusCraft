/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import Server from '@hibiscus/server'
import Packet from '@hibiscus/network/packet'

export default class ChangeDifficultyPacket extends Packet {
  encode (): Buffer {
    this.buf.writeVarInt(13)
    this.buf.writeIntBE(Server.getInstance().level.difficulty, 1)
    this.buf.writeIntBE(Server.getInstance().level.difficultyLocked ? 1 : 0, 1)
    return this.buf.toBuffer()
  }
}
