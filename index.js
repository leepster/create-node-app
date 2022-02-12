#!/usr/bin/env node

import chalk from 'chalk'
import { readdir, cp } from 'fs/promises'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'

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

async function execShellCommand(command) {
  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(chalk.redBright(error.message))
      }

      if (stderr) {
        console.log(chalk.redBright(stderr))
      }

      console.log(chalk.greenBright(stdout))
      resolve()
    })
  })
}

async function main() {
  await execShellCommand('git init')
  await execShellCommand('npm init -y')

  const source = join(dirname(fileURLToPath(import.meta.url)), './template')
  await cp(source, process.cwd(), { recursive: true })

  for await (const filename of readdirRecursive(source)) {
    console.log(chalk.greenBright('created:'), chalk.cyanBright(filename.replace(join(process.cwd(), 'template/'), '')))
  }
}

main().catch((error) => console.error(error))
