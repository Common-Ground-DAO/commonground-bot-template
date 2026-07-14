# Common Ground community bot template

![Bot Lab artwork](assets/community-cover.png)

A small, production-minded starter for a [Common Ground](https://cg.mogged.eu) community bot. It listens to the public Socket.IO bot event contract, replies through the allowlisted bot REST API, and can run in either:

- `hello` mode: replies `hello` without any external AI service;
- `openai` mode: uses the OpenAI Responses API for community-aware answers.

The default trigger is `!bot`, replies are threaded under the triggering message, and the bot only processes one configured channel. It ignores its own messages, serializes work, bounds its duplicate-message cache, reconnects automatically, exposes a container health check, and never writes credentials to logs.

## Quick start

Requirements: Node.js 20+ or Docker, a Common Ground community bot token, the community UUID, and the target channel UUID.

```sh
cp .env.example .env
# Fill in CG_URL, CG_BOT_TOKEN, CG_COMMUNITY_ID, and CG_CHANNEL_ID.
npm ci
npm test
npm run dev
```

Then send `!bot` in the configured channel. In the default mode the bot replies `hello`.

For a container deployment:

```sh
chmod 600 .env
docker compose up -d --build
docker compose ps
```

The Compose service publishes no host port. Its internal `/health` endpoint drives the Docker health check, and the container runs read-only as an unprivileged user with Linux capabilities dropped.

## Provision the bot

Bot management is performed by a signed-in human session. Bot bearer tokens cannot call management routes. The examples use a curl cookie jar exported from a normal Common Ground login; an authenticated browser integration can call the same endpoints.

Create a community-owned bot (it is installed in its owner community automatically):

```sh
curl --fail-with-body -sS --cookie "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -d "{\"ownerType\":\"community\",\"ownerId\":\"$COMMUNITY_ID\",\"displayName\":\"Community Assistant\",\"imageId\":null,\"description\":\"Answers community questions.\"}" \
  "$CG_URL/api/v2/Bot/create"
```

Issue a dedicated production token:

```sh
curl --fail-with-body -sS --cookie "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -d "{\"botUserId\":\"$BOT_USER_ID\",\"name\":\"production\"}" \
  "$CG_URL/api/v2/Bot/tokens/issue"
```

The raw `cgb_...` value is shown once. Put it in a secret manager or a local `.env` with mode `0600`; never commit it, put it in a URL, or reuse a human session cookie in the bot process. The predefined member role is automatic. If the channel uses custom permissions, assign only the necessary custom role with `/api/v2/Bot/setRoles`.

See the [Common Ground bot API documentation](https://github.com/Common-Ground-DAO/commonground/blob/develop/docs/BOT-API.md) for token rotation, role assignment, rate limits, and the complete v1 allowlist.

## Enable OpenAI

Set these values in your secret environment:

```dotenv
BOT_MODE=openai
OPENAI_API_KEY=your_project_scoped_key
OPENAI_MODEL=gpt-5.6-luna
BOT_SYSTEM_PROMPT=You are a concise, helpful assistant for our community.
```

Restart the service after changing configuration. The implementation uses `client.responses.create(...)` and reads `response.output_text`. Keep the OpenAI key server-side and project-scoped, with appropriate budget and rate limits. No OpenAI request is made in `hello` mode.

## Behavior and customization

`BOT_TRIGGER=!bot` matches `!bot` and `!bot your question`. Set it to an empty value to process every non-empty message in the configured channel. The safest place to add commands, retrieval, moderation rules, or tool calls is in `src/responder.ts`; transport and credential handling remain isolated in `src/cg-client.ts` and `src/bot.ts`.

This template intentionally does not request access to DMs, uploads, calls, moderation, or human profile APIs. Common Ground enforces that boundary on the server even if the bot code is modified.

## Development

```sh
npm run check
npm test
npm run build
```

CI runs type checking, unit tests, and a clean Docker build. Use named bot tokens per environment. For rotation, issue a new token, deploy it, verify `/api/v2/Bot/whoami`, and only then revoke the old token.

## License

MIT
