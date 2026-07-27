# Security Policy

The **sonite** project takes the security of our compiler, CLI, packages, and generated binaries seriously. 

If you believe you have found a security vulnerability in this repository, please report it to us as described below.

## Reporting Security Issues

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Instead, please report security vulnerabilities directly via email to:

*   **Email:** me@ethann.dev

*(Alternatively, you may submit a private disclosure through the **"Report a vulnerability"** tab under the repository's **Security** tab on GitHub.)*

### What to include in your report

Please include as much of the following information as possible to help us triage and resolve the issue quickly:

*   **Type of issue:** (e.g., arbitrary code execution during compilation, unsafe LLVM IR generation, memory safety bug in compiled output, buffer overflow)
*   **Affected area:** The specific workspace package, module, or source file location
*   **Environment:** Relevant OS, Node.js, pnpm, or Clang configuration details required to reproduce the issue
*   **Reproduction:** Step-by-step instructions or a minimal reproducible `.sn` code snippet
*   **Proof of concept:** Exploit code or assembly/LLVM IR output demonstrating the bug (if applicable)
*   **Impact:** A brief explanation of the potential security impact

## Response Expectations

*   **Initial Response:** You will receive an acknowledgment of your report within 48 hours.
*   **Updates:** We will keep you informed of our progress as we investigate and work on a fix.
*   **Disclosure:** Once a resolution is applied, we will coordinate public disclosure as appropriate.

## Dependency vulnerabilities

*   Run `sn audit` to check locked dependencies against known advisories.
*   Report toolchain/stdlib vulnerabilities through the channels above, not public issues.
*   See [docs/security/dependencies.md](docs/security/dependencies.md) for the dependency response process.

## Credentials and tokens

*   Registry tokens (`sn login`, `SN_REGISTRY_TOKEN`) are stored locally and are **never** written to crash reports, compiler diagnostics, or logs.
*   Use `sn logout` to revoke local tokens.
*   Do not commit tokens to source control.

## Native dependencies

Review `[native]` metadata and bundled artifacts before linking third-party libraries. See [docs/security/ffi.md](docs/security/ffi.md).

## Scope

This policy covers the Sonite compiler, CLI, LSP, VS Code extension, standard library, and published npm packages. The registry **server** may be operated separately; report server-side issues to the same contact.
