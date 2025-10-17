# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported |
| ------- | --------- |
| 0.5.x   | ✅        |
| 0.4.x   | ✅        |
| < 0.4   | ❌        |

## Reporting a Vulnerability

We take the security of kaitai-struct-ts seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Where to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to:

- **Email**: fabianopinto@example.com (replace with your actual email)

### What to Include

Please include the following information in your report:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Varies based on severity and complexity

### Disclosure Policy

- We will acknowledge your email within 48 hours
- We will provide a more detailed response within 7 days
- We will work with you to understand and resolve the issue
- We will publicly disclose the issue once a fix is available
- We will credit you in the disclosure (unless you prefer to remain anonymous)

## Security Best Practices for Users

When using kaitai-struct-ts:

1. **Keep Updated**: Always use the latest version
2. **Validate Input**: Validate all .ksy files before parsing
3. **Limit Resources**: Set appropriate limits for parsing operations
4. **Sandbox**: Run parsing in isolated environments when processing untrusted data
5. **Monitor**: Watch for security advisories in our GitHub repository

## Security Features

- **Type Safety**: Full TypeScript type checking
- **Error Handling**: Comprehensive error handling system
- **Validation**: Schema validation for .ksy files
- **No Eval**: No use of `eval()` or similar dangerous functions
- **Dependencies**: Minimal runtime dependencies (only YAML parser)

## Known Security Considerations

- **Binary Parsing**: Parsing untrusted binary data always carries risks
- **Memory Usage**: Large files can consume significant memory
- **Infinite Loops**: Malformed .ksy files could cause infinite loops (use timeouts)

## Security Updates

Security updates will be released as patch versions and announced via:

- GitHub Security Advisories
- Release notes
- NPM package updates

Subscribe to repository notifications to stay informed.
