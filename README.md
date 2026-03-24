# oxvault

npm wrapper for the [Oxvault MCP security scanner](https://github.com/oxvault/scanner).

Oxvault scans MCP (Model Context Protocol) servers for security vulnerabilities before they run inside your AI agent. 66% of MCP servers have security issues — prompt injection, credential exposure, tool poisoning, and more.

## Install

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

See the [full documentation](https://github.com/oxvault/scanner) for all flags and output formats.

## Supported Platforms

| OS      | Architectures      |
| ------- | ------------------ |
| Linux   | x64 (amd64), arm64 |
| macOS   | x64 (amd64), arm64 |
| Windows | x64 (amd64), arm64 |

## How It Works

On `npm install`, this package downloads the correct pre-built binary from the [GitHub releases page](https://github.com/oxvault/scanner/releases) for your OS and architecture. The `oxvault` command then proxies directly to that binary — no Node.js overhead at runtime.

## License

Apache-2.0 — see [LICENSE](https://github.com/oxvault/scanner/blob/main/LICENSE).
