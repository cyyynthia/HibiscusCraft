/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import Packet from '@hibiscus/network/packet'
import Player from '@hibiscus/objects/entities/player'

export default class PlayerPositionPacket extends Packet {
  private player: Player

  constructor (player: Player) {
    super()
    this.player = player
  }

  encode (): Buffer {
    this.buf.writeVarInt(53)

    return this.buf.toBuffer()
  }
}
