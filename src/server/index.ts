/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import { createServer, Server, Socket } from 'net'
import { KeyObject, generateKeyPairSync, privateDecrypt, constants as cryptoConstants } from 'crypto'
import Connection from '@hibiscus/network/connection'
import config from '@hibiscus/config'

export default class MinecraftServer {
  private static instance: MinecraftServer

  private server: Server
  private connections: Connection[] = []
  private privateKey: KeyObject
  publicKey: Buffer

  onlineCount: number = 0

  private constructor () {
    const keyPair = generateKeyPairSync('rsa', { modulusLength: 1024 })
    this.publicKey = keyPair.publicKey.export({ type: 'spki', format: 'der' })
    this.privateKey = keyPair.privateKey
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
      this.connections = this.connections.filter(c => c !== connection)
    })
  }

  static getInstance () {
    if (!this.instance) this.instance = new MinecraftServer()
    return this.instance
  }
}
