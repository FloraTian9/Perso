# Perso Douyin Minigame

This is a separate Douyin minigame client for Perso. The existing Next.js website stays in `src/`; open this folder as an independent project in the Douyin developer tool.

## Setup

1. Create a Douyin minigame in the Open Platform console and copy its AppID.
2. Replace `appid` in `project.config.json`.
3. Deploy the Perso Next.js app to an HTTPS domain.
4. Set `API_BASE_URL` in `js/config.js` to that deployed origin, without a trailing slash.
5. Add the deployed domain to the Douyin Open Platform request domain allowlist.
6. Open `douyin-minigame/` in the Douyin developer tool.

## Current MVP

- Canvas-only minigame shell, no npm dependency.
- Topic input through the Douyin keyboard API.
- Calls the existing Perso `/api/chat` endpoint with spectator opening mode.
- Parses the returned SSE text and displays MBTI roundtable messages.
- Bundles only the default four persona assets: `INTJ / ENFP / ISTJ / ESTP`.

## Security

Do not put `.env.local`, `QWEN_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or any service-role credential in this folder. The minigame client should only call the deployed Perso server.
