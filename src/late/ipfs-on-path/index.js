import { join } from 'path'
import which from 'which'
import { execFile } from 'child_process'
import { logger, store, execOrSudo, createToggler, IS_WIN } from '../../utils'
import { recoverableErrorDialog } from '../../dialogs'

const CONFIG_KEY = 'ipfsOnPath'

export default async function (ctx) {
  createToggler(ctx, CONFIG_KEY, async (value, oldValue) => {
    if (value === oldValue || (oldValue === null && !value)) return
    if (value === true) return run('install')
    return run('uninstall')
  })

  firstTime()
}

async function firstTime () {
  // Check if we've done this before.
  if (store.get(CONFIG_KEY, null) !== null) {
    logger.info('[ipfs on path] no action taken')
    return
  }

  if (which.sync('ipfs', { nothrow: true }) !== null) {
    // ipfs already exists on user's system so we won't take any action
    // by default. Doesn't try again next time.
    store.set(CONFIG_KEY, false)
    return
  }

  // Tries to install ipfs-on-path on the system. It doesn't try to elevate
  // to sudo so the user doesn't get annoying prompts when running IPFS Desktop
  // for the first time. Sets the option according to the success or failure of the
  // procedure.
  const res = await run('install', false)
  store.set(CONFIG_KEY, res)
}

async function runWindows (script) {
  return new Promise(resolve => {
    execFile('powershell.exe', [
      '-nop', '-exec', 'bypass',
      '-win', 'hidden', '-File',
      join(__dirname, `scripts/${script}.ps1`).replace('app.asar', 'app.asar.unpacked')
    ], {}, err => {
      if (err) {
        logger.error(`[ipfs on path] ${err.toString()}`)
        recoverableErrorDialog(err)
        return resolve(false)
      }

      logger.info(`[ipfs on path] ${script}ed`)
      resolve(true)
    })
  })
}

async function run (script, trySudo = true) {
  if (IS_WIN) {
    return runWindows(script)
  }

  return execOrSudo({
    script: join(__dirname, `./scripts/${script}.js`),
    scope: 'ipfs on path',
    trySudo
  })
}
