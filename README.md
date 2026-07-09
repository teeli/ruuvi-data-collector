# Ruuvi Data Collector

Scans for data from RuuviTag and Ruuvi Air devices and writes into
[InfluxDB](https://www.influxdata.com/). Built with TypeScript on
[Bun.sh](https://bun.sh/)

New and improved version of
[ruuvi-influx-collector](https://github.com/teeli/ruuvi-influx-collector):

## Prerequisites

- [Bun](https://bun.sh/)
- Bluetooth LE-capable hardware, with your OS's Bluetooth stack available to
  [`@stoprocent/noble`](https://github.com/stoprocent/noble)
- An InfluxDB instance with a bucket, org, and API token

### Setup

1. Install dependencies: `bun install`
2. Generate a config file: `bun run config:generate` (scaffolds `config.ts` at
   the repo root)
3. Edit `config.ts` with your InfluxDB connection details, and optionally device
   aliases and log settings

## Run Ruuvi Data Collector

- `bun run start` — run once

### Systemd service

To run Ruuvi Data Collector as a systemd service, see
[example](ruuvi-data-collector-example.service).

## Development

- `bun run watch` — run with file watching
- `bun run test` — run tests
- `bun run lint` / `bun run lint:fix` — lint TypeScript
- `bun run lint:md` / `bun run lint:md:fix` — lint markdown
- `bun run format` — format with Prettier
- `bun run compile` — typecheck

### Development Environment Setup

1. `bun install` — also installs git hooks via husky
2. Start a local InfluxDB for testing:
   `docker compose -f influxdb/docker-compose.yml up -d`
3. Follow [Setup](#setup) to generate `config.ts`, pointing it at the local
   InfluxDB instance
