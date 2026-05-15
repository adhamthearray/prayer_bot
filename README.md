# Prayer Reminder Bot

A free Google Apps Script prayer reminder bot that sends ntfy notifications before, at, and after each prayer time.

This version does not need Render, Railway, or an always-on Python server. Google Apps Script runs a time trigger every few minutes, checks whether a prayer event is due, and sends the notification.

Google Apps Script may fail to reach `ntfy.sh` directly with `Address unavailable`. To avoid that, this project includes a tiny Vercel relay. Apps Script calls the relay, and the relay publishes to ntfy.

## Files

- `Code.gs` - the Apps Script source code
- `appsscript.json` - Apps Script project settings
- `api/ntfy.js` - Vercel API relay for ntfy
- `ntfy-relay-worker.js` - old Cloudflare Worker relay, kept as an alternate option

## Setup

1. Install ntfy on your phone from <https://ntfy.sh>.
2. Subscribe to a topic, for example `adham-prayer-bot`.
3. Deploy the ntfy relay to Vercel.
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

## Deploy The Relay On Vercel

1. Go to <https://vercel.com>.
2. Create a new project.
3. Import this GitHub repo.
4. Keep the default framework settings.
5. Add these environment variables:

```text
RELAY_TOKEN=make-a-long-random-secret
NTFY_TOPIC=adham-prayer-bot
```

6. Deploy.
7. Copy the Vercel project URL and add `/api/ntfy`.
8. In `Code.gs`, set:

```javascript
ntfyRelayUrl: 'https://your-project.vercel.app/api/ntfy',
ntfyRelayToken: 'make-a-long-random-secret',
```

The token in Apps Script must exactly match the Vercel `RELAY_TOKEN`.

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
