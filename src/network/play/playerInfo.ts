/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import Packet from '@hibiscus/network/packet'
import Player from '@hibiscus/objects/entities/player'

export const enum PlayerInfoAction {
  ADD_PLAYER,
  UPDATE_GAME_MODE,
  UPDATE_LATENCY,
  UPDATE_DISPLAY_NAME,
  REMOVE_PLAYER
}

export default class PlayerInfoPacket extends Packet {
  private action: PlayerInfoAction
  private players: Player[]

  constructor (action: PlayerInfoAction, ...players: Player[]) {
    super()
    this.action = action
    this.players = players
  }

  encode (): Buffer {
    this.buf.writeVarInt(51)
    this.buf.writeVarInt(this.action)
    this.buf.writeVarInt(this.players.length)
    for (const player of this.players) {
      this.buf.writeUuid(player.profile.id)
      switch (this.action) {
        case PlayerInfoAction.ADD_PLAYER:
          this.buf.writeUtf(player.profile.name)
          this.buf.writeVarInt(player.profile.properties.length)
          for (const prop of player.profile.properties) {
            this.buf.writeUtf(prop.name)
            this.buf.writeUtf(prop.value)
            if (prop.signature) {
              this.buf.writeIntBE(1, 1)
              this.buf.writeUtf(prop.signature)
            } else {
              this.buf.writeIntBE(0, 1)
            }
          }
          this.buf.writeVarInt(player.gamemode)
          this.buf.writeVarInt(69) // Latency; todo: dynamic
          this.buf.writeIntBE(0, 1)
          break
        // UPDATE_GAME_MODE
        // UPDATE_LATENCY
        // UPDATE_DISPLAY_NAME
        // REMOVE_PLAYER
      }
    }
    return this.buf.toBuffer()
  }
}
