# HibiscusCraft
[![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/G2G71TSDF)<br>
[![License](https://img.shields.io/github/license/Bowser65/HibiscusCraft.svg?style=flat-square)](https://github.com/Bowser65/HibiscusCraft/blob/mistress/LICENSE)

A toy project to re-implement a fully functional Minecraft Server in TypeScript, without dependencies.

## Goals
TL;DR: I want to be as close as possible to Vanilla Minecraft, + some anti-cheat measures.

### Generation
I want to craft (notice the pun, haha very fun) the same generator as Minecraft', but in TS. For the same seed, I want
to get the exact same world.

### Mob IA
Having the exact same behavior will be really difficult but I want to try and see if I can achieve it.

### Various game mechanics
Redstone, water, ... should behave the same as in vanilla' Minecraft

### Built-in anti-cheat
We all know that Minecraft is client-sided for way too many things. I want to try and see if I can reduce the amount
of working hacks in this thing without altering gameplay.

## Technical stuff
### Map storage
This is using the Anvil format by default to read and save maps for compatibility with the official server and client.
However, this thing can read both MCRegion and Alpha map formats. It'll backup the original files and convert it to
an Anvil map.

## Legal
This software is licensed under the [Open Source License version 3.0](https://github.com/Bowser65/HibiscusCraft/blob/mistress/LICENSE).
However, your use must abide by the [Minecraft EULA](https://account.mojang.com/documents/minecraft_eula).

For commercial use, even though this license allows it and we are not distributing Mojang's property, make sure to read
their [Commercial usage guidelines](https://account.mojang.com/terms#commercial).

This project is not an official Minecraft product. Not approved by or associated with Mojang AB.
