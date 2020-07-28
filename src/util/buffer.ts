/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

export default class FriendlyBuffer {
  private buffer: Buffer
  private cursor: number = 0

  constructor (buffer: Buffer) {
    this.buffer = buffer
  }

  isReadable (size: number = 1) {
    return this.buffer.length - this.cursor - size >= 0
  }

  readableBytes () {
    return this.buffer.length - this.cursor
  }

  readIntBE (byteLength: number) {
    this.cursor += byteLength
    return this.buffer.readIntBE(this.cursor - byteLength, byteLength)
  }

  readUIntBE (byteLength: number) {
    this.cursor += byteLength
    return this.buffer.readUIntBE(this.cursor - byteLength, byteLength)
  }

  readBigInt64BE () {
    this.cursor += 8
    return this.buffer.readBigInt64BE(this.cursor - 8)
  }

  readVarInt () {
    let cur = 0
    let value = 0
    let byte

    do {
      byte = this.readIntBE(1)
      value |= (byte & 0x7f) << (7 * cur++)
      if (cur <= 5) continue
      throw new Error('VarInt too big')
    } while ((byte & 0x80) !== 0)

    return value | 0
  }

  readUtf (maxLength: number) {
    const length = this.readVarInt()
    if (length > maxLength * 4) {
      throw new Error('String too large')
    }
    if (length < 0) {
      throw new Error('A string with negative length?')
    }
    this.cursor += length
    return this.buffer.slice(this.cursor - length, this.cursor).toString('utf8')
  }

  readBytes (length: number) {
    this.cursor += length
    return new FriendlyBuffer(this.buffer.slice(this.cursor - length, this.cursor))
  }

  writeIntBE (int: number, byteLength: number) {
    this.cursor += byteLength
    this.buffer.writeIntBE(int, this.cursor - byteLength, byteLength)
  }

  writeUIntBE (int: number, byteLength: number) {
    this.cursor += byteLength
    this.buffer.writeUIntBE(int, this.cursor - byteLength, byteLength)
  }

  writeBigInt64BE (bigint: bigint) {
    this.cursor += 8
    return this.buffer.writeBigInt64BE(bigint, this.cursor - 8)
  }

  writeVarInt (int: number) {
    do {
      if ((int & 0xFFFFFF80) === 0) {
        this.writeUIntBE(int, 1)
        break
      }
      this.writeUIntBE(int & 0x7F | 0x80, 1)
      int >>>= 7
    } while (true)
  }

  writeUtf (string: string, maxLength: number = 32767) {
    const bytes = Buffer.from(string, 'utf8')
    if (string.length > maxLength) {
      throw new Error('String too large')
    }

    this.writeVarInt(bytes.length)
    this.writeBytes(bytes)
  }

  writeBytes (bytes: Buffer) {
    this.cursor += bytes.length
    const wrote = this.buffer.slice(0, this.cursor - bytes.length)
    this.buffer = Buffer.concat([ wrote, bytes ], this.buffer.byteLength)
  }

  static getVarIntSize (int: number) {
    for (let i = 1; i < 5; ++i) {
      if ((int & -1 << i * 7) != 0) continue
      return i
    }
    return 5
  }

  toBuffer (): Buffer {
    return this.buffer.slice(0, this.cursor)
  }

  getBuffer (): Buffer {
    return this.buffer
  }
}
