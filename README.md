<div align="center">
  <img src="assets/logo.png" alt="kaitai-struct-ts" width="200"/>

# kaitai-struct-ts

[![npm version](https://badge.fury.io/js/%40k67%2Fkaitai-struct-ts.svg)](https://www.npmjs.com/package/@k67/kaitai-struct-ts)
[![CI](https://github.com/fabianopinto/kaitai-struct-ts/workflows/CI/badge.svg)](https://github.com/fabianopinto/kaitai-struct-ts/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

**A runtime interpreter for [Kaitai Struct](https://kaitai.io/) binary format definitions in TypeScript.**

</div>

---

Parse any binary data format by providing a `.ksy` (Kaitai Struct YAML) definition file - no compilation step required!

## Features

### Core Features

- 🚀 **Runtime interpretation** - No code generation needed
- 📦 **Zero dependencies** (runtime) - Only YAML parser for development
- 🎯 **TypeScript native** - Full type safety and IntelliSense support
- 🌐 **Universal** - Works in Node.js and browsers
- 🧪 **Well tested** - 98 comprehensive tests
- 📖 **Well documented** - Clear API and examples

### Advanced Features

- ⚡ **Expression evaluation** - Full support for Kaitai expressions
- 🔀 **Switch/case types** - Dynamic type selection based on data
- 💎 **Instances** - Lazy-evaluated fields with caching
- 🎨 **Enums** - Named constants with expression access
- 🔁 **Conditional parsing** - if, repeat-expr, repeat-until
- 📍 **Positioned reads** - Absolute positioning with pos attribute

## Installation

```bash
npm install @k67/kaitai-struct-ts
# or
pnpm add @k67/kaitai-struct-ts
# or
yarn add @k67/kaitai-struct-ts
```

## Quick Start

### CLI Usage

Parse binary files directly from the command line:

```bash
# Using npx (no installation needed)
npx @k67/kaitai-struct-ts format.ksy data.bin

# Or with pnpm
pnpx @k67/kaitai-struct-ts format.ksy data.bin

# After installing globally
npm install -g @k67/kaitai-struct-ts
kaitai format.ksy data.bin

# Save output to file
kaitai format.ksy data.bin -o output.json

# Extract specific field
kaitai format.ksy data.bin --field header.version

# Get help
kaitai --help
```

### Library Usage

```typescript
import { parse, KaitaiStream } from "@k67/kaitai-struct-ts";
import { readFileSync } from "fs";

// Load your .ksy definition
const ksyDefinition = `
meta:
  id: my_format
  endian: le
seq:
  - id: magic
    contents: [0x4D, 0x59, 0x46, 0x4D]
  - id: version
    type: u2
  - id: name
    type: str
    size: 32
    encoding: UTF-8
`;

// Load your binary data
const binaryData = readFileSync("data.bin");

// Parse!
const result = parse(ksyDefinition, binaryData);

console.log(result.version); // Access parsed fields
console.log(result.name);
```

## Current Status

**Version:** 0.7.0
**Status:** Production Ready 🚀
**Completion:** ~95% toward v1.0.0

### ✅ Fully Implemented

- **Core Runtime** - Complete binary stream reader with all primitive types
- **KSY Parser** - Full YAML parser with schema validation
- **Type Interpreter** - Execute schemas against binary data
- **Expression Evaluator** - Complete Kaitai expression language support
- **Advanced Features** - Conditionals, enums, repetitions, instances, switch/case
- **CLI Tool** - Command-line utility for parsing binary files
- **Testing** - 100+ comprehensive tests, all passing
- **Documentation** - Complete user and developer documentation

### 🔄 Remaining for v1.0.0

- Substream processing (zlib, encryption)
- Type imports across files
- Additional performance optimizations

See [docs/development/PROGRESS.md](./docs/development/PROGRESS.md) for detailed progress tracking and [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for architecture diagrams.

## API Documentation

### `parse(ksy: string, buffer: ArrayBuffer | Uint8Array, options?: ParseOptions): Record<string, unknown>`

Parse binary data using a Kaitai Struct definition.

**Parameters:**

- `ksy` - YAML string containing the .ksy definition
- `buffer` - Binary data to parse
- `options` - Optional parsing options (validate, strict)

**Returns:** Parsed object with fields defined in the .ksy file

**Example:**

```typescript
import { parse } from "kaitai-struct-ts";

const result = parse(ksyYaml, binaryData, { validate: true });
console.log(result.fieldName);
```

### `KaitaiStream`

Low-level binary stream reader.

```typescript
const stream = new KaitaiStream(buffer);
const value = stream.readU4le(); // Read 4-byte unsigned little-endian integer
```

See [API Documentation](./docs/api.md) for complete reference (coming soon).

## CLI Reference

The `kaitai` command-line tool allows you to parse binary files without writing code.

```bash
# Basic usage
kaitai <ksy-file> <binary-file> [options]

# Examples
kaitai format.ksy data.bin                    # Parse and display
kaitai format.ksy data.bin -o result.json     # Save to file
kaitai format.ksy data.bin --field version    # Extract field
kaitai format.ksy data.bin --quiet            # Quiet mode
```

**📖 Full CLI Documentation:** [docs/CLI.md](./docs/CLI.md)

**Quick Reference:**

- `-o, --output <file>` - Write to file
- `--field <path>` - Extract specific field
- `-q, --quiet` - Suppress progress messages
- `-h, --help` - Show help
- See [docs/CLI.md](./docs/CLI.md) for all options and examples

## Examples

Check the [examples](./examples) directory for more usage examples:

- Basic struct parsing
- Working with enums
- Conditional parsing
- Repetitions

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Run tests with UI
pnpm test:ui

# Test coverage
pnpm test:coverage

# Lint
pnpm lint

# Format
pnpm format
```

## Roadmap

### ✅ Phase 1: Foundation (v0.1.0) - Complete

- ✅ Binary stream reader (KaitaiStream)
- ✅ All primitive types (u1-u8, s1-s8, f4, f8)
- ✅ String encoding (UTF-8, ASCII, Latin-1, UTF-16)
- ✅ Byte arrays and positioning
- ✅ Error handling system

### ✅ Phase 2: Core Features (v0.2.0-v0.4.0) - Complete

- ✅ KSY parser with validation
- ✅ Type interpreter
- ✅ Expression evaluator (full Kaitai expression language)
- ✅ Conditionals (if attribute)
- ✅ Enums with expression access
- ✅ Repetitions (repeat-expr, repeat-until, repeat-eos)
- ✅ Nested user-defined types

### ✅ Phase 3: Advanced Features (v0.5.0-v0.6.0) - Complete

- ✅ Switch/case type selection
- ✅ Instances (lazy-evaluated fields with caching)
- ✅ Parametric types
- ✅ Positioned reads (pos attribute)
- ✅ Sized substreams
- ✅ Processing framework (ready for zlib/encryption)

### ✅ Phase 4: CLI & Polish (v0.7.0) - Complete

- ✅ Command-line interface
- ✅ Documentation reorganization
- ✅ Production-ready release

### 🔄 Phase 5: v1.0.0 - Final Polish (In Progress)

- ⏳ Processing implementations (zlib, encryption)
- ⏳ Type imports across files
- ⏳ Additional performance optimizations
- ⏳ Extended format testing

**Current Status:** Production-ready, ~95% complete toward v1.0.0

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](./CONTRIBUTING.md) first.

## License

MIT © Fabiano Pinto

## Related Projects

- [Kaitai Struct](https://kaitai.io/) - Official Kaitai Struct project
- [kaitai-struct-compiler](https://github.com/kaitai-io/kaitai_struct_compiler) - Official compiler
- [Format Gallery](https://formats.kaitai.io/) - Collection of .ksy format definitions

## Acknowledgments

This project implements the [Kaitai Struct specification](https://doc.kaitai.io/) created by the Kaitai Struct team.
