/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

import { gzipSync, gunzipSync } from 'zlib'

export enum NbtType { END, BYTE, SHORT, INT, LONG, FLOAT, DOUBLE, BYTE_ARRAY, STRING, LIST, COMPOUND, INT_ARRAY, LONG_ARRAY }
type NbtToJs = {
  [NbtType.END]: never
  [NbtType.BYTE]: number
  [NbtType.SHORT]: number
  [NbtType.INT]: number
  [NbtType.LONG]: bigint
  [NbtType.FLOAT]: number
  [NbtType.DOUBLE]: number
  [NbtType.BYTE_ARRAY]: Buffer
  [NbtType.STRING]: string
  [NbtType.LIST]: NbtListSpec
  [NbtType.COMPOUND]: NbtCompound
  [NbtType.INT_ARRAY]: number[]
  [NbtType.LONG_ARRAY]: bigint[]
}

export type NbtListSpec = { type: NbtType, values: any[] }

export default class NbtCompound {
  private buffer: Buffer
  private cursor = 0
  object: Record<string, any> = {}

  constructor (name: string = '') {
    this.buffer = Buffer.alloc((2 ** 30) - 1)
    this.buffer.writeInt8(10, this.cursor++)
    this.buffer.writeInt16BE(name.length, this.cursor)
    this.buffer.write(name, this.cursor += 2, 'utf8')
    this.cursor += name.length
  }

  write<T extends NbtType> (type: T, name: string, value: NbtToJs[T]) {
    this.buffer.writeInt8(type, this.cursor++)
    this.buffer.writeInt16BE(name.length, this.cursor)
    this.buffer.write(name, this.cursor += 2, 'utf8')
    this.cursor += name.length
    this.writeRaw(type, value)
    if (type === NbtType.COMPOUND) {
      this.object[name] = (<NbtCompound>value).object
    } else {
      this.object[name] = value
    }
  }

  private writeRaw (type: NbtType, value: any) {
    switch (type) {
      case NbtType.BYTE:
        this.buffer.writeInt8(value, this.cursor++)
        break
      case NbtType.SHORT:
        this.buffer.writeInt16BE(value, this.cursor)
        this.cursor += 2
        break
      case NbtType.INT:
        this.buffer.writeInt32BE(value, this.cursor)
        this.cursor += 4
        break
      case NbtType.LONG:
        this.buffer.writeBigInt64BE(value, this.cursor)
        this.cursor += 8
        break
      case NbtType.FLOAT:
        this.buffer.writeFloatBE(value, this.cursor)
        this.cursor += 4
        break
      case NbtType.DOUBLE:
        this.buffer.writeDoubleBE(value, this.cursor)
        this.cursor += 8
        break
      case NbtType.BYTE_ARRAY:
        this.buffer = Buffer.concat([ this.buffer.slice(0, this.cursor), value ], this.buffer.byteLength)
        this.cursor += value.byteLength
        break
      case NbtType.STRING:
        this.buffer.writeUInt16BE(value.length, this.cursor)
        this.buffer.write(value, this.cursor += 2, 'utf8')
        this.cursor += value.length
        break
      case NbtType.LIST:
        this.buffer.writeInt8(value.type, this.cursor++)
        this.buffer.writeUInt32BE(value.values.length, this.cursor)
        this.cursor += 4
        value.values.forEach((item: any) => this.writeRaw(value.type, item))
        break
      case NbtType.COMPOUND: {
        const buf = value.toBuffer()
        this.buffer = Buffer.concat([ this.buffer.slice(0, this.cursor), buf ], this.buffer.byteLength)
        this.cursor += buf.byteLength
        break
      }
      case NbtType.INT_ARRAY:
        this.buffer.writeUInt32BE(value.length, this.cursor)
        value.forEach((item: number) => this.buffer.writeInt32BE(item, this.cursor += 4))
        this.cursor += 4
        break
      case NbtType.LONG_ARRAY:
        this.buffer.writeUInt32BE(value.length, this.cursor)
        this.cursor -= 4
        value.forEach((item: bigint) => this.buffer.writeBigInt64BE(item, this.cursor += 8))
        this.cursor += 8
        break
      default:
        throw new Error('Invalid data type')
    }
  }

  toBuffer () {
    this.buffer.writeInt8(0, this.cursor++)
    return this.buffer.slice(0, this.cursor)
  }

  toCompressedBuffer () {
    return gzipSync(this.toBuffer()) // todo: async?
  }
}

function readOne (type: NbtType, buffer: Buffer): [ number, any ] {
  switch (type) {
    case NbtType.BYTE:
      return [ 1, buffer.readInt8() ]
    case NbtType.SHORT:
      return [ 2, buffer.readInt16BE() ]
    case NbtType.INT:
      return [ 4, buffer.readInt32BE() ]
    case NbtType.LONG:
      return [ 8, buffer.readBigInt64BE() ]
    case NbtType.FLOAT:
      return [ 4, buffer.readFloatBE() ]
    case NbtType.DOUBLE:
      return [ 8, buffer.readDoubleBE() ]
    case NbtType.BYTE_ARRAY: {
      const length = buffer.readInt32BE()
      return [ 4 + length, buffer.slice(4, 4 + length) ]
    }
    case NbtType.STRING: {
      const length = buffer.readUInt16BE()
      return [ 2 + length, buffer.slice(2, 2 + length).toString('utf8') ]
    }
    case NbtType.LIST: {
      let cursor = 0
      let array: any[] = []
      const listType = buffer.readInt8(cursor++)
      const listLength = buffer.readInt32BE(cursor)
      cursor += 4
      for (let i = 0; i < listLength; i++) {
        const [ readBytes, item ] = readOne(listType, buffer.slice(cursor))
        cursor += readBytes
        array.push(item)
      }
      return [ cursor, array ]
    }
    case NbtType.COMPOUND: {
      let type
      let cursor = 0
      const object: Record<string, any> = {}
      while ((type = buffer.readInt8(cursor++)) !== NbtType.END) {
        const nameLength = buffer.readUInt16BE(cursor)
        const name = buffer.slice(cursor += 2, cursor += nameLength).toString('utf8')
        const [ readBytes, data ] = readOne(type, buffer.slice(cursor))
        object[name] = data
        cursor += readBytes
      }
      return [ cursor, object ]
    }
    case NbtType.INT_ARRAY: {
      let cursor = 0
      let array: number[] = []
      const listLength = buffer.readInt32BE()
      for (let i = 0; i < listLength; i++) {
        array.push(buffer.readInt32BE(cursor += 4))
      }
      return [ cursor + 4, array ]
    }
    case NbtType.LONG_ARRAY: {
      let cursor = -4
      let array: bigint[] = []
      const listLength = buffer.readInt32BE()
      for (let i = 0; i < listLength; i++) {
        array.push(buffer.readBigInt64BE(cursor += 8))
      }
      return [ cursor + 8, array ]
    }
    default:
      throw new Error('Invalid data type')
  }
}

export function deserialize (buffer: Buffer): Record<string, any> {
  let payloadLength = buffer.byteLength
  if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
    // todo: async?
    buffer = gunzipSync(buffer)
  }

  if (buffer.readUInt8(0) !== 10) {
    throw new Error('Not a NbtCompound')
  }

  let cursor = 3 + buffer.readUInt16BE(1)
  const [ readBytes, object ] = readOne(10, buffer.slice(cursor))
  object.$$name = buffer.slice(3, cursor).toString('utf8')
  object.$$payloadLength = payloadLength
  object.$$nbtLength = buffer.byteLength
  return object
}
