/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import { createServer, Server, Socket } from 'net'
import config from '@hibiscus/config'
import Connection from '@hibiscus/network/connection'

export default class MinecraftServer {
  private static instance: MinecraftServer

  private server: Server
  private connections: Connection[] = []

  onlineCount: number = 0

  private constructor () {
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
