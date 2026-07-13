import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/* oxlint-disable no-default-export */
export default function setup(): () => void {
  const dir = mkdtempSync(join(tmpdir(), 'ruuvi-test-logs-'))
  process.env.RUUVI_TEST_LOG_DIR = dir

  return () => {
    rmSync(dir, { recursive: true, force: true })
  }
}
