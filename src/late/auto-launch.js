import AutoLaunch from 'auto-launch'
import { store, logger, createToggler } from '../utils'

const CONFIG_KEY = 'autoLaunch'

const autoLauncher = new AutoLaunch({
  name: 'IPFS Desktop'
})

export default function (ctx) {
  const activate = async (value, oldValue) => {
    if (process.env.NODE_ENV === 'development') {
      logger.info('[launch on startup] unavailable during development')
      return
    }

    if (value === oldValue) return

    try {
      if (value === true) {
        if (!await autoLauncher.isEnabled()) await autoLauncher.enable()
        logger.info('[launch on startup] enabled')
      } else {
        if (await autoLauncher.isEnabled()) await autoLauncher.disable()
        logger.info('[launch on startup] disabled')
      }

      return true
    } catch (e) {
      logger.error(e.stack)
      return false
    }
  }

  activate(store.get(CONFIG_KEY, false))
  createToggler(ctx, CONFIG_KEY, activate)
}
