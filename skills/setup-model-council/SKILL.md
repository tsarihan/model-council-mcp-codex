---
name: setup-model-council
description: Configure Model Council subscription tiers and auto-populate usable local and cloud members. Use when the user asks to set up, initialize, reconfigure, add, remove, or trim council providers or members, change council tiers, or enable Claude, ChatGPT/Codex, Ollama cloud, or Grok participation.
---

# Setup Model Council

1. Call the `model-council` MCP server's `council_status` tool.
2. Ask only for relevant tier choices:
   - Claude: `free`, `pro`, `max5x`, `max20x`
   - ChatGPT: `free`, `plus`, `pro5x`, `pro20x`
   - Ollama: `free`, `pro`, `max`
   - Grok: `free`, `supergrok`, `premiumplus`, `heavy` — explain that the CLI
     provider fails closed without an unsafe RCE testing override and direct
     normal users to the X.AI API provider
   Skip an unavailable CLI unless the user explicitly wants to configure it for later.
3. Call `setup_council` with the chosen tier fields.
4. If the user asks to select members or defaults, call `configure_council` with only the requested fields. Preserve full model IDs exactly as returned by the tools.
5. Report resulting members grouped by provider, total count, quota warning, hints, rejected tier values, and any reload/restart notice.

Tier and member changes persist in the Model Council state file. Do not request API
keys in chat. For API-key providers or custom server addresses, explain the relevant
environment variables from `get_council_config`; never echo secret values.
