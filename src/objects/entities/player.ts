/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import { PlayerProfile } from '@hibiscus/mojang'

import Connection from '@hibiscus/network/connection'
import LivingEntity from '@hibiscus/objects/livingEntity'
import { GameMode } from '@hibiscus/world/level'

export default class Player extends LivingEntity {
  connection: Connection
  profile: PlayerProfile
  gamemode: GameMode // todo: dynamic
  prevGamemode: GameMode

  x: number
  y: number
  z: number
  rtY: number
  rtX: number

  constructor (connection: Connection, profile: PlayerProfile) {
    super()

    this.connection = connection
    this.profile = profile
    this.gamemode = GameMode.CREATIVE
    this.prevGamemode = GameMode.CREATIVE
    this.x = 0 // todo: dynamic
    this.y = 0 // todo: dynamic
    this.z = 0 // todo: dynamic
    this.rtY = 0 // todo: dynamic
    this.rtX = 0 // todo: dynamic
  }
}
