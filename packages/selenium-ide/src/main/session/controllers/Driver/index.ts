import { resolveBrowserVersion } from '@seleniumhq/get-driver'
import { ChildProcess } from 'child_process'
import webdriver, { WebDriver } from 'selenium-webdriver'
import { Session } from '../../../types'
import downloadDriver from './download'
import startDriver from './start'

interface DriverOptions {
  browser?: 'chrome'
  capabilities?: {
    'goog:chromeOptions': {
      debuggerAddress: string
    }
  }
  server?: string
}

export default class DriverController {
  constructor(session: Session) {
    this.session = session
  }
  session: Session
  driver?: WebDriver
  driverProcess?: ChildProcess
  async build({
    browser = 'chrome',
    capabilities = {
      'goog:chromeOptions': {
        debuggerAddress: 'localhost:8315',
      },
    },
    // The "9515" is the port opened by chrome driver.
    server = 'http://localhost:9515',
  }: DriverOptions) {
    const driver = await new webdriver.Builder()
      .usingServer(server)
      .withCapabilities(capabilities)
      .forBrowser(browser)
      .build()
    this.driver = driver
    return driver
  }
  async download(version: string) {
    return downloadDriver(version)
  }
  async getBrowserPath(): Promise<string> {
    return this.session.store.get('config.browserPath')
  }
  async getBrowserVersion(): Promise<string> {
    const path = await this.getBrowserPath()
    const version = await resolveBrowserVersion(path)
    return version as string
  }
  async setBrowserPath(browserPath: string): Promise<boolean> {
    this.session.store.set('config.browserPath', browserPath)
    return true
  }
  async startProcess(version: string): Promise<null | string> {
    const results = await startDriver(this.session)(version)
    if (results.success) {
      this.driverProcess = results.driver
      return null
    }
    return results.error
  }
  async stopProcess(): Promise<null | string> {
    if (this.driverProcess) {
      this.driverProcess.kill()
    }
    return null
  }
}