# Sonite

Sonite is a statically typed programming language with TypeScript-inspired syntax that compiles to native code through LLVM.

The language is designed to provide a familiar and expressive development experience while producing native executables. The `sn` toolchain emits object code and links via a bundled LLVM/LLD native binding — users do not need clang, llc, ld.lld, or OpenSSL installed to build Sonite programs.

Supported targets: **Linux x64/ARM64**, **macOS x64/ARM64**, and **Windows x64** (Windows ARM64 deferred).

## Installation

Install the CLI from npm:

```bash
npm install -g @sonite/cli
sn --version
```

See [docs/installation.md](docs/installation.md) for platform requirements, VS Code extension setup, and uninstall instructions.

Full documentation: [docs/README.md](docs/README.md)

## Why Sonite?

Sonite is designed for developers who enjoy the syntax and developer experience of TypeScript but want to target native code.

It combines:

* TypeScript-inspired syntax
* Static typing and type inference
* Native compilation through LLVM
* Generics and advanced type system features
* Structs, classes, and interfaces
* First-class functions and closures
* A standard library written in Sonite
* Language Server Protocol support
* Editor support for VS Code and Cursor

The goal of Sonite is to make native development feel familiar to developers coming from TypeScript and JavaScript, without giving up the benefits of native compilation.
