#!/usr/bin/env node

import chalk from 'chalk'
import { existsSync } from 'fs'
import { readdir, cp, writeFile, mkdir, readFile } from 'fs/promises'
import { join, dirname, resolve, basename } from 'path'
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
  console.log(chalk.greenBright(command))

  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(chalk.redBright(error.message))
      }

      if (stderr) {
        console.log(chalk.redBright(stderr))
      }

      console.log(chalk.cyanBright(stdout))
      resolve()
    })
  })
}

async function createIdeaPrettierSettingsFile() {
  if (!existsSync(join(process.cwd(), '.idea'))) {
    await mkdir(join(process.cwd(), '.idea'))
  }

  await writeFile(
    join(process.cwd(), '.idea/prettier.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="PrettierConfiguration">
    <option name="myRunOnSave" value="true" />
    <option name="myRunOnReformat" value="true" />
  </component>
</project>`
  )

  console.log(chalk.greenBright('created:'), chalk.cyanBright('.idea/prettier.xml'))
}

async function copyTemplateFiles() {
  const source = join(dirname(fileURLToPath(import.meta.url)), './template')

  // TODO: why isn't this copying the .gitignore file and the .idea folder? - applied a manual workaround instead below
  await cp(source, process.cwd(), { recursive: true })

  for await (const filename of readdirRecursive(source)) {
    console.log(
      chalk.greenBright('created:'),
      chalk.cyanBright(filename.replace(join(dirname(fileURLToPath(import.meta.url)), 'template/'), ''))
    )
  }
}

async function createGitIgnoreFile() {
  await writeFile(
    join(process.cwd(), '.gitignore'),
    `.idea
node_modules`
  )
  console.log(chalk.greenBright('created:'), chalk.cyanBright('.gitignore'))
}

async function replaceTextInFile(filepath, text, replacement) {
  const contents = await readFile(filepath, { encoding: 'utf-8' })
  const regex = new RegExp(text, 'g')
  await writeFile(filepath, contents.replace(regex, replacement))
}

async function getPackageName() {
  const contents = await readFile('./package.json', { encoding: 'utf-8' })
  const settings = JSON.parse(contents)
  return settings.name
}

async function main() {
  await execShellCommand('git init')
  await execShellCommand('npm init -y')
  await execShellCommand('npm i prettier -D')
  await copyTemplateFiles()
  await replaceTextInFile('./LICENSE', '{{package-name}}', await getPackageName())
  await createGitIgnoreFile()
  await createIdeaPrettierSettingsFile()
  await execShellCommand('git add .')
  await execShellCommand('git commit -m "initial commit"')
}

main().catch((error) => console.error(error))
