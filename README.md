# Prayer Reminder Bot

A free Google Apps Script prayer reminder bot that sends ntfy notifications before, at, and after each prayer time.

This version does not need Render, Railway, or an always-on Python server. Google Apps Script runs a time trigger every few minutes, checks whether a prayer event is due, and sends the notification.

Google Apps Script may fail to reach `ntfy.sh` directly with `Address unavailable`. To avoid that, this project includes a tiny Cloudflare Worker relay. Apps Script calls the relay, and the relay publishes to ntfy.

## Files

- `Code.gs` - the Apps Script source code
- `appsscript.json` - Apps Script project settings
- `ntfy-relay-worker.js` - Cloudflare Worker relay for ntfy

## Setup

1. Install ntfy on your phone from <https://ntfy.sh>.
2. Subscribe to a topic, for example `adham-prayer-bot`.
3. Deploy the ntfy relay using `ntfy-relay-worker.js`.
4. Open <https://script.google.com>.
5. Create a new project.
6. Paste the contents of `Code.gs` into the Apps Script editor.
7. Open Project Settings and enable **Show appsscript.json manifest file in editor**.
8. Replace the manifest with `appsscript.json`.
9. In `Code.gs`, set `ntfyRelayUrl` and `ntfyRelayToken`.
10. Run `testNotification` once.
11. Run `setupPrayerReminderBot` once.
12. Approve the Google permissions.

After setup, the bot checks every 5 minutes.

## Configure

Edit this block in `Code.gs`:

```javascript
const CONFIG = {
  ntfyTopic: 'adham-prayer-bot',
  ntfyRelayUrl: 'PASTE_RELAY_URL_HERE',
  ntfyRelayToken: 'PASTE_RELAY_TOKEN_HERE',
  city: 'Cairo',
  country: 'Egypt',
  method: '5',
  reminderMinutes: 30,
  afterSalahMinutes: 15,
  checkWindowMinutes: 5,
  timeZone: 'Africa/Cairo',
};
```

## Deploy The Relay

1. Go to <https://dash.cloudflare.com>.
2. Open **Workers & Pages**.
3. Create a Worker.
4. Paste the contents of `ntfy-relay-worker.js`.
5. Deploy it.
6. Add these Worker variables:

```text
RELAY_TOKEN=make-a-long-random-secret
NTFY_TOPIC=adham-prayer-bot
```

7. Copy the Worker URL.
8. In `Code.gs`, set:

```javascript
ntfyRelayUrl: 'https://your-worker.your-subdomain.workers.dev',
ntfyRelayToken: 'make-a-long-random-secret',
```

The token in Apps Script must exactly match the Worker `RELAY_TOKEN`.

## How Caching Works

The bot stores today's fetched prayer times in Apps Script properties.

- If the cached date is today, it reuses the saved times.
- If the current date is different from the cached date, it fetches from AlAdhan again.
- Sent event IDs are also stored, so a notification is not sent twice.

## Useful Functions

- `setupPrayerReminderBot` - creates the repeating trigger
- `checkPrayerReminders` - manually checks for due reminders
- `testNotification` - sends one test ntfy notification
- `clearPrayerCache` - clears cached prayer times and sent-event history
