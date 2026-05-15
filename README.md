# Prayer Reminder Bot

A free Google Apps Script prayer reminder bot that sends ntfy notifications before, at, and after each prayer time.

This version does not need Render, Railway, or an always-on server. Google Apps Script runs a time trigger every few minutes, checks whether a prayer event is due, and sends the notification.

## Files

- `Code.gs` - the Apps Script source code
- `appsscript.json` - Apps Script project settings

## Setup

1. Install ntfy on your phone from <https://ntfy.sh>.
2. Subscribe to a topic, for example `adham-prayer-bot`.
3. Open <https://script.google.com>.
4. Create a new project.
5. Paste the contents of `Code.gs` into the Apps Script editor.
6. Open Project Settings and enable **Show appsscript.json manifest file in editor**.
7. Replace the manifest with `appsscript.json`.
8. In `Code.gs`, edit the `CONFIG` values if needed.
9. Run `setupPrayerReminderBot` once.
10. Approve the Google permissions.

After setup, the bot checks every 5 minutes.

## Configure

Edit this block in `Code.gs`:

```javascript
const CONFIG = {
  ntfyTopic: 'adham-prayer-bot',
  city: 'Cairo',
  country: 'Egypt',
  method: '5',
  reminderMinutes: 30,
  afterSalahMinutes: 15,
  checkWindowMinutes: 5,
  timeZone: 'Africa/Cairo',
};
```

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
