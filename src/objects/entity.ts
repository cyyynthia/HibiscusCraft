/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

let counter = 0

export default class Entity {
  id: number

  constructor () {
    this.id = counter++
  }
}
