/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

export default interface PacketEventListener<T> {
  (event: 'close', listener: () => void): T

  // Fallback
  (event: string, listener: Function): T
}
