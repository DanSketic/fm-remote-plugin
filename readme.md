# 🔭 Remote Plugin

"Made for FM2" badge:

![made_for_FM2](https://github.com/DanSketic/Filing-Manager-Website/blob/graviton-rewrite/badges/made_for_fm2.svg)

Markdown usage:
```![MadeForFM2](https://raw.githubusercontent.com/DanSketic/Filing-Manager-Website/master/badges/made_for_fm2.svg?sanitize=true)```

This is a Remote Live Coding plugin for Graviton.

**NOTE**: This is very **experimantal**, unstable, insecure, etc. Still in work in progress.

What you can do for now:
* See who is in the same room as you
* Share folders (bidirectionally)
* See other peer's cursor
* Read and write files
* See how much time you have been coding
* Share terminals (read, and write!)

Contributions are welcomed!

## Todo
* [] Create line on other clients when creating a new line
* [] Ability to disconnect
* [] Implement `watchDir` on ExplorerProvider

## 🕹 Developing
Clone the repo to your .filingmanager/plugins:
```shell
git clone https://github.com/DanSketic/fm-sdk.git
```

Install dependencies:
```shell
yarn
```

Watch for changes (development):
```shell
yarn run watch
```

Build (optional):
```shell
yarn run build
```

Made by Marc Espín Sanz.
