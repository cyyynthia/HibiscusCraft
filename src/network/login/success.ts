/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import Packet from '@hibiscus/network/packet'
import { PlayerProfile } from '@hibiscus/mojang'

export default class LoginSuccessPacket extends Packet {
  private profile: PlayerProfile

  constructor (profile: PlayerProfile) {
    super()
    this.profile = profile
  }

  encode (): Buffer {
    this.buf.writeVarInt(2)
    this.buf.writeUuid(this.profile.id)
    this.buf.writeUtf(this.profile.name)
    return this.buf.toBuffer()
  }
}
