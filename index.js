#!/usr/bin/env node

import { readdir, cp } from 'fs/promises'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'

async function* readdirRecursive(path) {
  const entries = await readdir(path, { withFileTypes: true })
  for (const entry of entries) {
    const res = resolve(path, entry.name)
    if (entry.isDirectory()) {
      yield* readdirRecursive(res)
    } else {
      yield res
    }
  }
}

async function main() {
  const source = join(dirname(fileURLToPath(import.meta.url)), './template')
  await cp(source, process.cwd(), { recursive: true })

  for await (const filename of readdirRecursive(source)) {
    console.log(chalk.greenBright('created:'), chalk.cyanBright(filename.replace(join(process.cwd(), 'template/'), '')))
  }
}

main().catch((error) => console.error(error))
