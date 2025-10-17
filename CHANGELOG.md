# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2025-10-18

### Added
- Company logo asset (`assets/logo.png`) for project branding
- Comprehensive test suite with 98+ passing tests
- Integration tests for advanced features

### Changed
- Widened TypeScript `rootDir` configuration to properly include test files
- Improved project structure for better maintainability

### Fixed
- TypeScript compilation error with test files outside rootDir

## [0.4.0] - 2025-10-02

### Added
- **Instances (Lazy-Evaluated Fields)** - Complete implementation
  - Value instances (calculated fields)
  - Pos instances (positioned reads)
  - Lazy evaluation with caching
  - Position restoration after instance reads
  - Support for complex types in instances
  - Sized reads in instances
  - Conditionals in instances
  - 11 comprehensive tests

### Improved
- Test coverage increased to 98 tests (69% increase)
- Enhanced documentation with more examples

## [0.3.0] - 2025-10-02

### Added
- **Switch/Case Type Selection** - Dynamic type selection based on expressions
  - Switch-on expression evaluation
  - Case-based type selection
  - Default type fallback
  - Complex expressions in switch-on
  - Enum values in switch statements
  - Nested switch types
  - Built-in types in cases
  - 7 comprehensive tests

### Improved
- Phase 2 (Core Features) marked as 100% complete
- Overall project completion: ~85% toward v1.0.0

## [0.2.0] - 2025-10-01

### Added
- **Expression Evaluator** - Complete Kaitai expression language support
  - Complete lexer for tokenizing expressions
  - Recursive descent parser for AST generation
  - Expression evaluator with context support
  - All operators: arithmetic, comparison, bitwise, logical
  - Ternary conditional (? :)
  - Member access, array access, method calls
  - Enum access (EnumName::value)
  - Proper operator precedence

- **Expression Integration**
  - if conditions with expressions
  - repeat-until with expression evaluation
  - repeat-expr with calculated counts
  - Calculated sizes and positions

- **Enum Support**
  - Enum definitions in schema
  - Enum value lookup
  - Enum access in expressions
  - 9 enum integration tests

- **KSY Parser** - Complete YAML parser for .ksy format definitions
- **Type Interpreter** - Execute schemas against binary streams

### Tests
- 80 tests passing

## [0.1.0] - 2025-10-01

### Added
- **KaitaiStream Class** - Complete binary stream reader
  - All integer types (u1-u8, s1-s8)
  - Floating point (f4, f8)
  - Both endianness (le, be)
  - Byte arrays and strings
  - Bit-level reading
  - Position management
  - Substreams

- **Error Handling** - Complete error system
- **String Encoding** - UTF-8, ASCII, Latin-1, UTF-16
- **Project Infrastructure**
  - Build tooling with tsup
  - TypeScript 5.9.3 strict mode
  - Testing with vitest
  - CI/CD with GitHub Actions
  - NPM publishing workflow

- **Documentation**
  - Complete README, ARCHITECTURE, CONTRIBUTING
  - Full JSDoc for all APIs

### Tests
- 58 tests passing

## [Unreleased]

### Planned for v1.0.0
- Substream processing (zlib, encryption)
- Type imports across files
- Parametric types
- Bit-sized integer support
- Performance optimizations

---

## Links

- [GitHub Repository](https://github.com/fabianopinto/kaitai-struct-ts)
- [NPM Package](https://www.npmjs.com/package/@k67/kaitai-struct-ts)
- [Kaitai Struct](https://kaitai.io/)
