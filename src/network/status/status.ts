/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import { readFileSync } from 'fs'

import config from '@hibiscus/config'
import Server from '@hibiscus/server'
import Packet from '@hibiscus/network/packet'
import { PROTOCOL_VERSION, GAME_VERSION } from '@hibiscus/constants'

let faviconBlob: string | null = null

export default class StatusPacket extends Packet {
  encode (): Buffer {
    this.buf.writeVarInt(0)
    this.buf.writeUtf(
      JSON.stringify({
        version: { name: `Hibiscus ${GAME_VERSION}`, protocol: PROTOCOL_VERSION },
        description: { text: config.motd },
        players: {
          max: config.maxPlayers,
          online: Server.getInstance().playerManager.players.length,
          sample: []
        },
        favicon: this.getFavicon()
      })
    )
    return this.buf.toBuffer()
  }

  private getFavicon () {
    if (!faviconBlob) {
      const blob = readFileSync(config.favicon)
      faviconBlob = 'data:image/png;base64,' + blob.toString('base64')
    }

    return faviconBlob
  }
}
