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

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const CACHE_KEY = 'prayerData';
const SENT_EVENTS_KEY = 'sentEvents';

const PRAYER_DUA = `اللهم رب هذه الدعوة التامة،
والصلاة القائمة،
آت محمدا الوسيلة والفضيلة،
وابعثه مقاما محمودا الذي وعدته`;

const AFTER_SALAH_ZIKR = `أستغفر الله، أستغفر الله، أستغفر الله

اللهم أنت السلام،
ومنك السلام،
تباركت يا ذا الجلال والإكرام`;

function setupPrayerReminderBot() {
  deleteExistingCheckTriggers_();

  ScriptApp.newTrigger('checkPrayerReminders')
    .timeBased()
    .everyMinutes(CONFIG.checkWindowMinutes)
    .create();

  Logger.log(`Prayer reminder trigger created. Checking every ${CONFIG.checkWindowMinutes} minutes.`);
}

function checkPrayerReminders() {
  const now = new Date();
  const prayerData = getCachedPrayerData_(now);
  const events = createEvents_(prayerData.date, prayerData.prayers);
  const sentEvents = getSentEvents_();
  let sentCount = 0;

  events.forEach((event) => {
    if (!isEventDue_(event, now) || sentEvents[event.id]) {
      return;
    }

    sendNotification_(event.title, event.message);
    sentEvents[event.id] = new Date().toISOString();
    sentCount += 1;
    Logger.log(`Sent: ${event.title}`);
  });

  saveSentEvents_(sentEvents, prayerData.date);

  if (sentCount === 0) {
    Logger.log('No prayer reminders due right now.');
  }
}

function testNotification() {
  sendNotification_('Prayer Bot Test', 'Your Google Apps Script prayer bot can send ntfy notifications.');
}

function clearPrayerCache() {
  const properties = PropertiesService.getScriptProperties();
  properties.deleteProperty(CACHE_KEY);
  properties.deleteProperty(SENT_EVENTS_KEY);
  Logger.log('Prayer cache cleared.');
}

function getCachedPrayerData_(now) {
  const today = formatDate_(now);
  const configKey = getConfigKey_();
  const properties = PropertiesService.getScriptProperties();
  const cachedValue = properties.getProperty(CACHE_KEY);

  if (cachedValue) {
    const cached = JSON.parse(cachedValue);

    if (cached.date === today && cached.configKey === configKey) {
      Logger.log(`Prayer times already fetched for today: ${today}`);
      return cached;
    }

    Logger.log(`Cached prayer data is for ${cached.date}; current date is ${today}. Fetching again.`);
  }

  const prayers = fetchPrayerTimes_();
  const prayerData = {
    date: today,
    configKey,
    prayers,
    fetchedAt: new Date().toISOString(),
  };

  properties.setProperty(CACHE_KEY, JSON.stringify(prayerData));
  Logger.log(`Prayer times fetched for today: ${today}`);
  return prayerData;
}

function fetchPrayerTimes_() {
  const query = {
    city: CONFIG.city,
    country: CONFIG.country,
    method: CONFIG.method,
  };
  const url = `https://api.aladhan.com/v1/timingsByCity?${toQueryString_(query)}`;
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: false,
  });
  const data = JSON.parse(response.getContentText());
  const timings = data.data.timings;
  const prayers = {};

  PRAYER_NAMES.forEach((name) => {
    prayers[name] = timings[name].slice(0, 5);
  });

  return prayers;
}

function createEvents_(dateText, prayers) {
  const events = [];

  PRAYER_NAMES.forEach((prayerName) => {
    const prayerTime = parseLocalDateTime_(dateText, prayers[prayerName]);
    const reminderTime = addMinutes_(prayerTime, -CONFIG.reminderMinutes);
    const zikrTime = addMinutes_(prayerTime, CONFIG.afterSalahMinutes);

    events.push({
      id: `${dateText}:${prayerName}:reminder`,
      time: reminderTime,
      title: `${prayerName} Reminder`,
      message: `${prayerName} is in ${CONFIG.reminderMinutes} minutes.`,
    });

    events.push({
      id: `${dateText}:${prayerName}:time`,
      time: prayerTime,
      title: `${prayerName} Time`,
      message: PRAYER_DUA,
    });

    events.push({
      id: `${dateText}:${prayerName}:zikr`,
      time: zikrTime,
      title: `After ${prayerName}`,
      message: AFTER_SALAH_ZIKR,
    });
  });

  return events.sort((first, second) => first.time.getTime() - second.time.getTime());
}

function isEventDue_(event, now) {
  const ageMs = now.getTime() - event.time.getTime();
  const windowMs = CONFIG.checkWindowMinutes * 60 * 1000;
  return ageMs >= 0 && ageMs < windowMs;
}

function sendNotification_(title, message) {
  const url = `https://ntfy.sh/${encodeURIComponent(CONFIG.ntfyTopic)}`;

  UrlFetchApp.fetch(url, {
    method: 'post',
    payload: message,
    headers: {
      Title: title,
      Priority: 'default',
      Tags: 'pray',
    },
    muteHttpExceptions: false,
  });
}

function getSentEvents_() {
  const value = PropertiesService.getScriptProperties().getProperty(SENT_EVENTS_KEY);
  return value ? JSON.parse(value) : {};
}

function saveSentEvents_(sentEvents, today) {
  const keepPrefix = `${today}:`;
  const trimmed = {};

  Object.keys(sentEvents).forEach((eventId) => {
    if (eventId.indexOf(keepPrefix) === 0) {
      trimmed[eventId] = sentEvents[eventId];
    }
  });

  PropertiesService.getScriptProperties().setProperty(SENT_EVENTS_KEY, JSON.stringify(trimmed));
}

function deleteExistingCheckTriggers_() {
  ScriptApp.getProjectTriggers().forEach((trigger) => {
    if (trigger.getHandlerFunction() === 'checkPrayerReminders') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function parseLocalDateTime_(dateText, timeText) {
  const parts = dateText.split('-').map(Number);
  const timeParts = timeText.split(':').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2], timeParts[0], timeParts[1], 0, 0);
}

function addMinutes_(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function formatDate_(date) {
  return Utilities.formatDate(date, CONFIG.timeZone, 'yyyy-MM-dd');
}

function getConfigKey_() {
  return [
    CONFIG.city,
    CONFIG.country,
    CONFIG.method,
    CONFIG.reminderMinutes,
    CONFIG.afterSalahMinutes,
    CONFIG.timeZone,
  ].join('|');
}

function toQueryString_(params) {
  return Object.keys(params)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}
