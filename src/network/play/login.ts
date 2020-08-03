/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import { createHash } from 'crypto'

import Config from '@hibiscus/config'
import Server from '@hibiscus/server'
import Packet from '@hibiscus/network/packet'
import Player from '@hibiscus/objects/entities/player'
import { Overworld, Nether, TheEnd } from '@hibiscus/world/dimensions'
import NbtCompound, { NbtType } from '@hibiscus/nbt'

export default class PlayerLoginPacket extends Packet {
  private player: Player

  constructor (player: Player) {
    super()
    this.player = player
  }

  encode (): Buffer {
    this.buf.writeVarInt(37)

    // Gamemode
    let gamemode = this.player.gamemode
    if (Server.getInstance().level.hardcore) gamemode |= 8

    // Dimensions
    const dimensionNames: string[] = []
    const dimensionArray: NbtCompound[] = []
    const dimensions = new NbtCompound()
    if (Config.dimensions.overworld) {
      dimensionNames.push('minecraft:overworld')
      dimensionArray.push(Overworld)
    }
    if (Config.dimensions.nether) {
      dimensionNames.push('minecraft:the_nether')
      dimensionArray.push(Nether)
    }
    if (Config.dimensions.end) {
      dimensionNames.push('minecraft:the_end')
      dimensionArray.push(TheEnd)
    }
    dimensions.write(NbtType.LIST, 'dimension', { type: NbtType.COMPOUND, values: dimensionArray })

    // Seed
    const obfSeed = createHash('sha256').update(Server.getInstance().level.seed.toString()).digest().readBigInt64BE()

    // Write
    this.buf.writeIntBE(this.player.id, 4)
    this.buf.writeIntBE(gamemode, 1)
    this.buf.writeIntBE(this.player.prevGamemode, 1)
    this.buf.writeVarInt(dimensionNames.length)
    dimensionNames.forEach(d => this.buf.writeUtf(d))
    this.buf.writeNbt(dimensions)
    this.buf.writeUtf('minecraft:overworld')
    this.buf.writeUtf('minecraft:overworld')
    this.buf.writeBigInt64BE(obfSeed)
    this.buf.writeUIntBE(Config.maxPlayers, 1)
    this.buf.writeIntBE(8, 1) // Chunk radius; todo: dynamic
    this.buf.writeIntBE(1, 1) // Reduced Debug Info; todo: dynamic
    this.buf.writeIntBE(0, 1) // Show Death Screen; todo: dynamic
    this.buf.writeIntBE(0, 1) // Is debug
    this.buf.writeIntBE(1, 1) // Is flat; todo: dynamic

    return this.buf.toBuffer()
  }
}
