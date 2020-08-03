/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import Packet from '@hibiscus/network/packet'
import Player from '@hibiscus/objects/entities/player'
import { GameMode } from '@hibiscus/world/level'

export default class PlayerAbilitiesPacket extends Packet {
  private player: Player

  constructor (player: Player) {
    super()
    this.player = player
  }

  encode (): Buffer {
    this.buf.writeVarInt(49)
    let byte = 0
    switch (this.player.gamemode) { // todo: can fly
      case GameMode.CREATIVE:
        byte |= 1 // invulnerable
        byte |= 2 // is flying; todo: dynamic
        byte |= 4 // can fly
        byte |= 8 // instant build
        break
      case GameMode.SPECTATOR:
        byte |= 1 // invulnerable
        byte |= 2 // is flying
        byte |= 4 // can fly
        break
    }
    if (this.player.gamemode === GameMode.CREATIVE) {
      byte |= 1 // invulnerable
      byte |= 2 // is flying; todo: dynamic
      byte |= 4 // can fly
      byte |= 8 // instant build
    }

    this.buf.writeIntBE(byte, 1)
    this.buf.writeFloat(0.05) // flying speed; todo: dynamic
    this.buf.writeFloat(0.1) // walking speed; todo: dynamic
    return this.buf.toBuffer()
  }
}
