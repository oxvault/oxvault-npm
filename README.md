# oxvault

npm wrapper for the [OxVault scanner](https://github.com/oxvault/scanner) — AI supply-chain security for the agentic era.

OxVault scans MCP (Model Context Protocol) servers and ML models for security issues before they run inside your AI agent: prompt injection, credential exposure, tool poisoning, unsafe model formats, and more. It ships 150+ detection rules, and v0.4 added model scanning.

## Publishing status

This package is **not yet published to npm**. The publish workflow is in place (`.github/workflows/publish.yml`, tag-triggered with provenance) and runs on the first tagged release.

Until it's published, install the scanner directly:

```sh
curl -fsSL https://oxvault.dev/install.sh | sh
```

Once published, the npm commands below will work.

## Install (once published)

Run without installing (always fetches latest):

```sh
npx oxvault scan ./my-mcp-server
```

Or install globally:

```sh
npm install -g oxvault
oxvault scan ./my-mcp-server
```

## Usage

```sh
# Scan a local MCP server
oxvault scan ./server

# Scan an npm package
oxvault scan @company/mcp-server

# Scan a GitHub repo
oxvault scan github:user/repo

# CI/CD mode — fail on high severity findings
oxvault scan ./server --format=sarif --fail-on=high

# Skip source code analysis
oxvault scan ./server --skip-sast

# Pin tool hashes (rug pull protection)
oxvault pin npx -y @company/server

# Check for rug pulls since last pin
oxvault check npx -y @company/server
```

See the [documentation](https://oxvault.dev/docs) for all flags and output formats.

## Supported Platforms

| OS      | Architectures      |
| ------- | ------------------ |
| Linux   | x64 (amd64), arm64 |
| macOS   | x64 (amd64), arm64 |
| Windows | x64 (amd64), arm64 |

## How It Works

On `npm install`, this package's postinstall script (`scripts/install.js`) resolves the latest scanner release from the GitHub Releases API (falling back to the package version), then downloads the matching `scanner_<version>_<os>_<arch>` archive from the [scanner releases page](https://github.com/oxvault/scanner/releases) and extracts the `oxvault` binary into `bin/`. The `oxvault` command (`bin/run.js`) then proxies directly to that binary — no Node.js overhead at runtime. If the download fails, install still succeeds and prints manual-install instructions.

## License

Apache-2.0 — see [LICENSE](https://github.com/oxvault/scanner/blob/main/LICENSE).
