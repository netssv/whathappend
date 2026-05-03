# Developer Workflow

When adding or modifying a command, you MUST verify and update:
1. Create your logic in `modules/commands/` (atomic architecture, <200 LOC).
2. Register your function in `modules/core/registry.js`.
3. Add aliases and register in `ALL_KNOWN_CMDS` inside `modules/data/aliases.js`.
4. Update `modules/commands/util/detailed-help.js` (for `cmd?`).
5. Update `modules/commands/util/help.js` (for main `help` menu).
6. Update the corresponding markdown file in `docs/cmds/` to document the new command.

[⬅ Return to Knowledge Map](../map.md)
