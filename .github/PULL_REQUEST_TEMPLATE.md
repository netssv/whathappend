# Summary
<!-- Describe your changes, what they fix, and why they are needed. -->


## Type
- [ ] feat (New Command or functionality)
- [ ] fix (Bug fix)
- [ ] docs (Documentation update)
- [ ] chore (Maintenance or Refactoring)
- [ ] security (Security hardening)

## 🛡️ Security & Integrity Checklist
<!-- Please verify all of the following. PRs failing these checks will not be merged. -->
- [ ] No new `debugger.sendCommand()` calls outside permitted emulation files.
- [ ] No `import()` with dynamic/variable paths (violates CSP).
- [ ] No `eval()` or `new Function()`.
- [ ] External network data passes through `stripAnsi()` before `xterm.js` writes (if applicable).
- [ ] HTML sanitization goes exclusively through the `DOMPurify` wrapper.

## 🚦 Testing & Linting
- [ ] `node dev-lint.js` passes locally (no line limits exceeded, manifest valid).
- [ ] Unit tests added/updated (`node --test tests/unit/*.test.js`).
- [ ] Command added to `COMMAND_MANIFEST` (if this is a new command).
