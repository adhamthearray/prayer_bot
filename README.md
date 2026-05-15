# Prayer Reminder Bot

A lightweight Python bot that sends ntfy notifications before, at, and after each prayer time.

## Setup

1. Install ntfy on your phone from <https://ntfy.sh>.
2. Subscribe to a topic, for example `adham-prayer-bot`.
3. Install Python dependencies:

```bash
pip install -r requirements.txt
```

## Run

```bash
python prayer_bot.py
```

By default the bot uses Cairo, Egypt and the ntfy topic `adham-prayer-bot`.

## Configure

You can change settings with environment variables:

```powershell
$env:NTFY_TOPIC = "your-topic-name"
$env:PRAYER_CITY = "Cairo"
$env:PRAYER_COUNTRY = "Egypt"
$env:PRAYER_METHOD = "5"
$env:REMINDER_MINUTES = "30"
$env:AFTER_SALAH_MINUTES = "15"
python prayer_bot.py
```

`PRAYER_METHOD` is the AlAdhan calculation method ID. Method `5` is Egyptian General Authority of Survey.
