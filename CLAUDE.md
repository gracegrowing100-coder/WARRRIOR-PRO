# Tool compatibility instructions

`../AGENTS.md` is the canonical instruction file for this Codex workspace.
This file exists so cross-host gstack tooling can detect the same routing policy.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool.
When in doubt, invoke the most narrowly applicable skill.

Key routing rules:

- Product ideas and brainstorming: use `office-hours`.
- Strategy and scope: use `plan-ceo-review`.
- Architecture: use `plan-eng-review`.
- Design-system consultation or plan review: use `design-consultation` or
  `plan-design-review`.
- Full planning review pipeline: use `autoplan`.
- Bugs and errors: use `investigate`.
- Web application QA: use `qa` or `qa-only`.
- Code or diff review: use `review`.
- Visual polish: use `design-review`.
- Shipping, deployment, or pull requests: use `ship` or `land-and-deploy`.
- Save working context: use `context-save`.
- Restore saved context: use `context-restore`.
- Create a backlog-ready specification: use `spec`.
