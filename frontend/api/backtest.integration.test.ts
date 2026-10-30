// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { EventEmitter } from 'node:events'
import { Readable } from 'node:stream'
import type { IncomingMessage, ServerResponse } from 'node:http'
import handler from './backtest'

const image = 'atlas-backtest:integration'
const name = `atlas-gateway-${randomBytes(6).toString('hex')}`
const key = randomBytes(32).toString('hex')

let port = 0

function docker(...args: string[]): string {
  const result = spawnSync('docker', args, {
    encoding: 'utf8',
    timeout: 120000,
  })

  if (result.status !== 0) {
    throw new Error(result.stderr || 'Docker command failed')
  }

  return result.stdout.trim()
}

async function invoke(body: unknown) {
  const request = Object.assign(
    Readable.from([Buffer.from(JSON.stringify(body))]),
    { method: 'POST', url: '/api/backtest' }
  ) as IncomingMessage

  let output = ''

  const response = Object.assign(new EventEmitter(), {
    statusCode: 200,
    setHeader() { return this },
    end(value?: string) {
      output = value ?? ''
      return this
    },
  }) as unknown as ServerResponse

  await handler(request, response)

  return {
    status: response.statusCode,
    body: JSON.parse(output),
  }
}

beforeAll(async () => {
  docker('build', '-t', image, '..')

  docker(
    'run', '-d',
    '--name', name,
    '--read-only',
    '--tmpfs', '/tmp:rw,noexec,nosuid,size=32m',
    '--cap-drop', 'ALL',
    '--security-opt', 'no-new-privileges',
    '--memory', '256m',
    '--cpus', '1',
    '-e', `ATLAS_BACKTEST_SERVICE_KEY=${key}`,
    '-p', '127.0.0.1::8765',
    image
  )

  const mapping = docker('port', name, '8765/tcp')
  port = Number(mapping.split(':').at(-1))

  vi.stubEnv(
    'ATLAS_BACKTEST_URL',
    `http://127.0.0.1:${port}`
  )
  vi.stubEnv('ATLAS_BACKTEST_SERVICE_KEY', key)
  vi.stubEnv('NODE_ENV', 'test')

  // Wait for the actual HTTP listener to become ready.
  let ready = false

  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/health`
      )

      if (response.ok) {
        ready = true
        break
      }
    } catch {
      // Startup may not be complete yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  if (!ready) {
    throw new Error('Backend container did not become healthy')
  }
}, 180000)

afterAll(() => {
  spawnSync('docker', ['rm', '-f', name], {
    encoding: 'utf8',
    timeout: 30000,
  })

  vi.unstubAllEnvs()
})

describe('Real gateway-to-C++ integration', () => {
  it('executes a real authenticated backtest', async () => {
    const rows = [
      ['2026-01-05', 100, 105, 98, 103, 1500000],
      ['2026-01-06', 103, 108, 101, 106, 1700000],
      ['2026-01-07', 106, 107, 99, 101, 1400000],
      ['2026-01-08', 101, 104, 97, 99, 1650000],
      ['2026-01-09', 99, 103, 96, 102, 1800000],
    ]

    const bars = rows.map((row) => ({
      timestamp: row[0],
      open: row[1],
      high: row[2],
      low: row[3],
      close: row[4],
      volume: row[5],
    }))

    const result = await invoke({
      bars,
      strategy: 'buy-and-hold',
      capital: 10000,
      commission: 0,
      slippage_bps: 0,
      fast: 3,
      slow: 5,
    })

    expect(result.status).toBe(200)
    expect(result.body.response_version).toBe(1)
    expect(result.body.portfolio.final_equity).toBeCloseTo(
      9902.912621359224,
      2
    )
    expect(result.body.portfolio.trades).toHaveLength(1)
  })
})
