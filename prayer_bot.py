import os
import time
from datetime import datetime, timedelta

import requests


NTFY_TOPIC = os.getenv("NTFY_TOPIC", "adham-prayer-bot")
CITY = os.getenv("PRAYER_CITY", "Cairo")
COUNTRY = os.getenv("PRAYER_COUNTRY", "Egypt")
METHOD = os.getenv("PRAYER_METHOD", "5")
REMINDER_MINUTES = int(os.getenv("REMINDER_MINUTES", "30"))
AFTER_SALAH_MINUTES = int(os.getenv("AFTER_SALAH_MINUTES", "15"))

PRAYER_NAMES = ("Fajr", "Dhuhr", "Asr", "Maghrib", "Isha")

PRAYER_DUA = """اللهم رب هذه الدعوة التامة،
والصلاة القائمة،
آت محمدا الوسيلة والفضيلة،
وابعثه مقاما محمودا الذي وعدته"""

AFTER_SALAH_ZIKR = """أستغفر الله، أستغفر الله، أستغفر الله

اللهم أنت السلام،
ومنك السلام،
تباركت يا ذا الجلال والإكرام"""


prayer_cache = {
    "date": None,
    "prayers": None,
}


def send_notification(title, message):
    response = requests.post(
        f"https://ntfy.sh/{NTFY_TOPIC}",
        data=message.encode("utf-8"),
        headers={
            "Title": title.encode("utf-8"),
            "Priority": "default",
            "Tags": "pray",
        },
        timeout=20,
    )
    response.raise_for_status()


def get_prayer_times():
    response = requests.get(
        "https://api.aladhan.com/v1/timingsByCity",
        params={
            "city": CITY,
            "country": COUNTRY,
            "method": METHOD,
        },
        timeout=20,
    )
    response.raise_for_status()

    timings = response.json()["data"]["timings"]
    return {name: timings[name][:5] for name in PRAYER_NAMES}


def get_cached_prayer_times():
    today = datetime.now().date()

    if prayer_cache["date"] == today and prayer_cache["prayers"] is not None:
        print(f"Prayer times already fetched for today: {today}")
        return prayer_cache["date"], prayer_cache["prayers"]

    print(f"Fetching prayer times for {today}...")
    prayers = get_prayer_times()
    prayer_cache["date"] = today
    prayer_cache["prayers"] = prayers
    print(f"Prayer times fetched for today: {today}")
    return prayer_cache["date"], prayer_cache["prayers"]


def create_events(prayers, today=None):
    events = []
    event_date = today or datetime.now().date()

    for prayer_name, prayer_time in prayers.items():
        prayer_datetime = datetime.strptime(
            f"{event_date} {prayer_time}",
            "%Y-%m-%d %H:%M",
        )
        reminder_time = prayer_datetime - timedelta(minutes=REMINDER_MINUTES)
        zikr_time = prayer_datetime + timedelta(minutes=AFTER_SALAH_MINUTES)

        events.append(
            {
                "id": f"{event_date}:{prayer_name}:reminder",
                "time": reminder_time,
                "title": f"{prayer_name} Reminder",
                "message": f"{prayer_name} is in {REMINDER_MINUTES} minutes.",
            }
        )
        events.append(
            {
                "id": f"{event_date}:{prayer_name}:time",
                "time": prayer_datetime,
                "title": f"{prayer_name} Time",
                "message": PRAYER_DUA,
            }
        )
        events.append(
            {
                "id": f"{event_date}:{prayer_name}:zikr",
                "time": zikr_time,
                "title": f"After {prayer_name}",
                "message": AFTER_SALAH_ZIKR,
            }
        )

    return sorted(events, key=lambda event: event["time"])


def sleep_until_next_day():
    tomorrow = datetime.now().date() + timedelta(days=1)
    midnight = datetime.combine(tomorrow, datetime.min.time())
    wait_seconds = max(60, (midnight - datetime.now()).total_seconds())
    print("No more events today. Sleeping until tomorrow.")
    time.sleep(wait_seconds)


def run_forever():
    sent_events = set()

    while True:
        try:
            prayer_date, prayers = get_cached_prayer_times()
            events = create_events(prayers, prayer_date)
            now = datetime.now()
            upcoming_events = [event for event in events if event["time"] > now]

            if not upcoming_events:
                sleep_until_next_day()
                sent_events.clear()
                continue

            next_event = upcoming_events[0]
            wait_seconds = max(0, (next_event["time"] - now).total_seconds())

            print(f"Next: {next_event['title']} at {next_event['time']:%H:%M}")
            print(f"Sleeping for {wait_seconds / 60:.1f} minutes.")
            time.sleep(wait_seconds)

            if next_event["id"] in sent_events:
                continue

            send_notification(next_event["title"], next_event["message"])
            sent_events.add(next_event["id"])
            print(f"Sent: {next_event['title']}")

        except requests.RequestException as exc:
            print(f"Network error: {exc}. Retrying in 5 minutes.")
            time.sleep(300)
        except KeyError as exc:
            print(f"Unexpected prayer API response missing {exc}. Retrying in 1 hour.")
            time.sleep(3600)


if __name__ == "__main__":
    run_forever()
