/*
 * Copyright (c) 2020 Bowser65
 * Licensed under the Open Software License version 3.0
 */

export const enum GameMode { SURVIVAL, CREATIVE, ADVENTURE, SPECTATOR }
export const enum Difficulty { PEACEFUL, EASY, HARD }

export default class Level { // todo: actually load a level
  hardcore: boolean

  difficulty: Difficulty
  difficultyLocked: boolean

  seed: bigint = BigInt(69)

  constructor () {
    this.hardcore = false
    this.difficulty = Difficulty.PEACEFUL
    this.difficultyLocked = true
  }
}
