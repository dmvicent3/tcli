# tcli

A CLI tool for managing translations in projects using next-translate.

## Features

- Add, update, and remove translation keys
- Batch translation from JSON files
- Manage namespaces and languages
- Verify missing translation keys across all languages and namespaces
- Uses Google Gemini API for translating

## Installation

```sh
npm install -g tcli
```

## Usage

### Initialize configuration

```sh
tcli init
```

### Translation Management

```sh
tcli add <key> <value> --ns <namespace> --lang <language>
tcli update <key> <value> --ns <namespace> --lang <language>
tcli remove <key> --ns <namespace> --lang <language>
tcli batch <file.json> --ns <namespace> --langs <language>
```

### Namespace management

```sh
tcli ns add <name>
tcli ns remove <name>
tcli ns list
tcli ns default <name>
```

### Language management

```sh
tcli lang add <lang>
tcli lang remove <lang>
tcli lang list
```

### Verify missing translation keys

```sh
tcli verify
```

## Environment Setup

```
GEMINI_API_KEY=your_api_key_here
```

You can get an API key from: https://makersuite.google.com/app/apikey

## Development

### Setup

```sh
git clone <repository-url>
cd tcli
bun install
```

### Build

```sh
bun run build
```

### Development

```sh
bun run dev
```

## Release Process

This project uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing.

### Making Changes

1. Make your changes to the codebase
2. Create a changeset:
   ```sh
   bun run changeset
   ```
3. Follow the prompts to describe your changes
4. Commit the changeset file
5. Push to the main branch

### Publishing

The project uses GitHub Actions to automatically:
- Create release PRs when changesets are added
- Publish to NPM when release PRs are merged

### Manual Release (if needed)

```sh
# Version packages
bun run version

# Build and publish
bun run release
```

## License

MIT
