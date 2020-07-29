/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import { join } from 'path'

export interface Config {
  serverIp: string
  serverPort: number
  allowCrack: boolean
  maxPlayers: number
  motd: string | string[]
  favicon: string,
  dimensions: {
    overworld: boolean,
    nether: boolean,
    end: boolean
  }
}

let config: Config = {
  serverIp: '127.0.0.1',
  serverPort: 25565,
  allowCrack: false,
  maxPlayers: 10,
  motd: '§dAn HibiscusCraft server',
  favicon: join(__dirname, '..', 'files', 'favicon.png'),
  dimensions: {
    overworld: true,
    nether: true,
    end: true
  }
}

try {
  const cfg = require('../config.json')
  // todo: validate cfg
  config = Object.assign(config, cfg)
} catch (e) {
  console.log('No config.json file present or the file is corrupted, using default configuration')
}

export default config
