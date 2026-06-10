# ECC for Codex CLI

This supplements the root `AGENTS.md` with a repo-local ECC baseline.

## Repo Skill

- Repo-generated Codex skill: `.agents/skills/DoppApp/SKILL.md`
- Claude-facing companion skill: `.claude/skills/DoppApp/SKILL.md`
- Keep user-specific credentials and private MCPs in `~/.codex/config.toml`, not in this repo.

## MCP Baseline

Treat `.codex/config.toml` as the default ECC-safe baseline for work in this repository.
The generated baseline enables GitHub, Context7, Exa, Memory, Playwright, and Sequential Thinking.

## Multi-Agent Support

- Explorer: read-only evidence gathering
- Reviewer: correctness, security, and regression review
- Docs researcher: API and release-note verification

## Workflow Files

- No dedicated workflow command files were generated for this repo.

Use these workflow files as reusable task scaffolds when the detected repository workflows recur.

## Current Product Logic Notes

- Customer app must require `localStorage.deliveryAddress` before normal browsing. If missing, show the blocking delivery address modal; do not add a dismiss path until an address is saved.
- Delivery address shape is `{ id, title, address, latitude, longitude }` and is saved under the exact key `deliveryAddress`.
- Restaurants should be derived from stored/admin restaurant data but positioned around the selected customer address, between 500 m and 5 km away. Do not reintroduce Istanbul-centered coordinates for the customer-facing list.
- Demo orders read the delivery destination from `deliveryAddress`; checkout should not collect a separate address field.
- Courier start coordinates are generated near the selected restaurant, and delivery duration should scale with restaurant-to-address distance.
- Admin uses temporary browser-local auth: `/[locale]/admin` shows login until `localStorage.adminAuth === "true"`, credentials are `admin` / `1234`, and logout removes `adminAuth`.
