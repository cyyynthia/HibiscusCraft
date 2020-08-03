/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import { createServer, Server, Socket } from 'net'
import { KeyObject, generateKeyPairSync, privateDecrypt, constants as cryptoConstants } from 'crypto'

import Connection from '@hibiscus/network/connection'
import PlayerManager from '@hibiscus/server/playerManager'
import Level from '@hibiscus/world/level'
import config from '@hibiscus/config'

export default class MinecraftServer {
  private static instance: MinecraftServer

  private server: Server
  private connections: Connection[] = []
  private privateKey: KeyObject
  publicKey: Buffer

  level: Level
  playerManager: PlayerManager

  private constructor () {
    const keyPair = generateKeyPairSync('rsa', { modulusLength: 1024 })
    this.publicKey = keyPair.publicKey.export({ type: 'spki', format: 'der' })
    this.privateKey = keyPair.privateKey
    this.level = new Level()
    this.playerManager = new PlayerManager()
    this.server = createServer(this.onConnect.bind(this))
  }

  startup () {
    console.log(`Listening on ${config.serverIp}:${config.serverPort}`)
    this.server.listen(config.serverPort, config.serverIp)
  }

  shutdown () {
    for (const connection of this.connections) {
      connection.disconnect()
    }
  }

  decrypt (data: Buffer): Buffer {
    return privateDecrypt({ key: this.privateKey, padding: cryptoConstants.RSA_PKCS1_PADDING }, data)
  }

  private onConnect (socket: Socket) {
    const connection = new Connection(socket)
    this.connections.push(connection)
    connection.on('close', () => {
      if (connection.player) this.playerManager.removePlayer(connection.player)
      this.connections = this.connections.filter(c => c !== connection)
    })
  }

  static getInstance () {
    if (!this.instance) this.instance = new MinecraftServer()
    return this.instance
  }
}
