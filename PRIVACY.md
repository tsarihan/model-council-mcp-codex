# Privacy Policy

**Effective date:** 2026-07-25
**Applies to:** the `model-council` Codex/Claude Code plugin and the
`model-council-mcp` standalone MCP server (the "Software").

model-council runs **entirely on your own machine**. It has no backend service, no
analytics, and no telemetry. The author receives nothing — no prompts, no responses, no
usage data, no crash reports.

## What data the Software handles

- **Your prompts and the models' responses** are sent only to the model endpoints **you**
  configure: your local Ollama server, any self-hosted vLLM / SGLang / TensorRT-LLM
  servers, cloud API providers you supply keys for (OpenAI / Anthropic / X.AI), Ollama
  `:cloud` models (routed through Ollama's cloud infrastructure), and — for subscription
  members — your own locally installed `claude`, `codex`, and `grok` CLIs. **Cloud models
  of any provider send your prompts to that provider's cloud.** Check each cloud
  provider's data-retention and training policies before use, and do not send personal or
  sensitive data to any provider whose policies you have not reviewed. Each provider
  processes that data under **its own** privacy policy. There is no model-council
  intermediary.
- **Credentials.** API keys are read from your MCP client's configuration / secure
  storage and used only to call the provider you supplied them for. Subscription members
  run under **your own** Claude, ChatGPT, and Grok logins via the first-party CLIs; the
  Software strips `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, and ambient
  Anthropic base-URL/redirect credentials from Claude subscription calls;
  `OPENAI_API_KEY` and `CODEX_API_KEY` from Codex subscription calls; and
  `XAI_API_KEY` from the disabled-by-default Grok CLI path. This keeps
  subscription calls from silently switching to API-key billing.

## What is stored on disk

- `~/.config/model-council/state.json` — your selected subscription tiers and chosen
  council members. This is the only persistent application-state file. It contains no
  conversation content.
- Subscription CLI calls can create temporary prompt, output, or image files in the
  operating system's temporary directory. They are removed after each call on a
  best-effort basis; a crash or cleanup failure can leave a temporary remnant.
- Session state owned by the `claude` / `codex` / `grok` CLIs (e.g. `~/.codex`) is
  managed by those tools, not by this Software.

Nothing is transmitted off your machine except the model requests you initiate to the
endpoints you configured.

## Subprocesses

Environment detection and subscription inference shell out to the locally installed
`claude`, `codex`, and `grok` binaries. The Codex probe is a login-status check.
The Claude probe runs in an empty temporary working directory with `--safe-mode`,
strict MCP configuration, tools disabled, and no session persistence. Grok CLI
members and probes are disabled by default because the tested `--tools none` plus
`--permission-mode bypassPermissions` combination still permits arbitrary commands.
`GROK_CLI_UNSAFE_ACCEPT_RCE=true` bypasses this protection for isolated security
testing only.

## Data sharing and third parties

The author does not collect, receive, sell, or share any of your data — there is no
mechanism by which it could. The only third parties involved are the model providers
**you** explicitly configure, each governed by its own terms and privacy policy.

## Changes

Updates to this policy are published in this file in the public repository.

## Contact

Questions: **tsarihan@gmail.com** · Issues:
<https://github.com/tsarihan/model-council-mcp-codex/issues>
