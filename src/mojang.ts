/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import { createHash } from 'crypto'
import { get } from 'https'

export interface PlayerProfile {
  id: string,
  uuid: string,
  name: string,
  properties: [
    {
      name: string,
      value: string,
      signature?: string
    }
  ]
}

export function authenticate (playerName: string, secret: Buffer, pubKey: Buffer): Promise<PlayerProfile> {
  return new Promise(function(resolve, reject) {
    const loginHash = sha1([ 'OwO', secret, pubKey ])
    get(`https://sessionserver.mojang.com/session/minecraft/hasJoined?username=${playerName}&serverId=${loginHash}`, res => {
      if (res.statusCode !== 200) return reject()
      res.setEncoding('utf8')
      let payload = ''
      res.on('data', d => payload += d)
      res.on('end', () => {
        const profile = JSON.parse(payload)
        profile.uuid = profile.id.replace(/(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/, '$1-$2-$3-$4-$5')
        resolve(profile)
      })
    })
  })
}

// They're using a weird sha1
function sha1 (bufs: Array<Buffer | string>) {
  const sha = createHash('sha1')
  bufs.forEach(buf => sha.update(buf))
  const hash = Buffer.from(sha.digest())
  const isNegative = hash.readInt8(0) < 0
  if (isNegative) performTwosCompliment(hash)
  const digest = hash.toString('hex').replace(/^0+/g, '')
  return isNegative ? `-${digest}` : digest
}

function performTwosCompliment (buffer: Buffer) {
  let value
  let newByte
  let carry = true
  for (let i = buffer.length - 1; i >= 0; i--) {
    value = buffer.readUInt8(i)
    newByte = ~value & 0xff
    if (carry) {
      carry = newByte === 0xff
      buffer.writeUInt8(newByte + 1, i)
    } else {
      buffer.writeUInt8(newByte, i)
    }
  }
}
