---
name: model-council-status
description: Show the Model Council's detected providers, current members, subscription tiers, concurrency limits, timeouts, quota warning, and configuration hints. Use when the user asks for model council status, health, configuration, available members, provider login state, quota usage, or troubleshooting information.
---

# Model Council Status

Call the `model-council` MCP server's `council_status` tool exactly once.

Present:

- Detected Ollama, Claude CLI, Codex CLI, and Grok CLI availability and login state.
- Current members grouped by provider, preserving every model ID verbatim.
- Resolved tiers, provider concurrency limits, and text/repository timeouts.
- The quota warning verbatim.
- Configuration hints and any pending-reload notice.

Do not call another tool or change configuration unless the user explicitly asks.
If configuration is requested, use `$setup-model-council`.
