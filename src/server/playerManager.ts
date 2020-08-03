/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import Player from '@hibiscus/objects/entities/player'
import PlayerLoginPacket from '@hibiscus/network/play/login'
import CustomPayloadPacket from '@hibiscus/network/play/custom'
import ChangeDifficultyPacket from '@hibiscus/network/play/difficulty'
import PlayerInfoPacket, { PlayerInfoAction } from '@hibiscus/network/play/playerInfo'
import PlayerAbilitiesPacket from '@hibiscus/network/play/abilities'

import Packet from '@hibiscus/network/packet'

export default class PlayerManager {
  players: Player[] = [] // todo: map by uuid?

  summonPlayer (player: Player) {
    player.connection.send(new PlayerLoginPacket(player))
    player.connection.send(new CustomPayloadPacket('minecraft:brand', Buffer.from('Hibiscus')))
    player.connection.send(new ChangeDifficultyPacket())
    player.connection.send(new PlayerAbilitiesPacket(player))
    // ClientboundSetCarriedItemPacket
    // ClientboundUpdateRecipesPacket
    // ClientboundUpdateTagsPacket

    this.broadcast(new PlayerInfoPacket(PlayerInfoAction.ADD_PLAYER, player))
    for (const p of this.players) {
      player.connection.send(new PlayerInfoPacket(PlayerInfoAction.ADD_PLAYER, p))
    }
  }

  removePlayer (player: Player) {

  }

  broadcast (packet: Packet) {
    this.players.forEach(p => p.connection.send(packet))
  }
}
