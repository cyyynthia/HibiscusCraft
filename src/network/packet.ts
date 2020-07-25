/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

export default abstract class Packet {
  readonly op: number

  abstract encode(): Buffer
}
