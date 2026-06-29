// ==UserScript==
// @name         Margonem - Auto Kalendarz SI
// @namespace    local.codex.margonem.calendar
// @version      1.9.0
// @description  Niezalezny modul Auto Kalendarza do Panelu dodatkow.
// @updateURL    https://raw.githubusercontent.com/ShadoxDDL/Dodatki-SI/main/auto-kalendarz.user.js
// @downloadURL  https://raw.githubusercontent.com/ShadoxDDL/Dodatki-SI/main/auto-kalendarz.user.js
// @match        *://*.margonem.pl/*
// @exclude      *://new.margonem.pl/*
// @exclude      *://www.margonem.pl/*
// @exclude      *://margonem.pl/*
// @exclude      *://forum.margonem.pl/*
// @exclude      *://commons.margonem.pl/*
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(() => {
  "use strict";

  const page = unsafeWindow;
  const TAG = "[Auto Kalendarz SI]";
  const MIN_LEVEL = 25;
  const RETRY_DELAY = 12 * 60 * 60 * 1000;
  const STARTUP_DELAY = 3000;
  const OPEN_LOCK_DELAY = 2 * 60 * 1000;
  const CALENDAR_CHECK_TIMEOUT = 3000;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function log(message, extra) {
    console.log(TAG, message, extra ?? "");
    page.console?.log(TAG, message, extra ?? "");
  }

  async function waitUntil(check, timeout, errorMessage) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const result = check();
      if (result) return result;
      await sleep(250);
    }
    throw new Error(errorMessage);
  }

  function dateId(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function attemptKey(heroId) {
    return `autoCalendarLastAttempt_${heroId}`;
  }

  function openLockKey(heroId) {
    return `autoCalendarOpenLock_${heroId}`;
  }

  function retryTime(heroId) {
    const lastAttempt = Number(page.localStorage.getItem(attemptKey(heroId)));
    return Number.isFinite(lastAttempt) ? lastAttempt + RETRY_DELAY : 0;
  }

  function openLockTime(heroId) {
    const lock = Number(page.localStorage.getItem(openLockKey(heroId)));
    return Number.isFinite(lock) ? lock + OPEN_LOCK_DELAY : 0;
  }

  async function waitForStableHero() {
    let previousId = null;
    let stableSince = 0;

    return waitUntil(() => {
      const currentId = page.hero?.id;
      if (!currentId || typeof page._g !== "function" || !page.g) return null;

      if (currentId !== previousId) {
        previousId = currentId;
        stableSince = Date.now();
        return null;
      }

      return Date.now() - stableSince >= STARTUP_DELAY ? currentId : null;
    }, 120000, "Postac nie ustabilizowala sie po przelogowaniu.");
  }

  function findTodayDayNumber(rewardDays) {
    const today = dateId(new Date());
    const dates = Object.keys(rewardDays ?? {})
      .map(key => ({
        key,
        timestamp: Number(key),
        date: dateId(new Date(Number(key) * 1000))
      }))
      .filter(entry => Number.isFinite(entry.timestamp))
      .sort((a, b) => a.timestamp - b.timestamp);

    const position = dates.findIndex(entry => entry.date === today);

    if (position !== -1) {
      return {
        dayNumber: position + 1,
        matchedTimestamp: dates[position].timestamp,
        rawValue: rewardDays[dates[position].key]
      };
    }

    return null;
  }

  function checkCalendarExists() {
    return new Promise(resolve => {
      let finished = false;

      const finish = value => {
        if (finished) return;
        finished = true;
        resolve(value);
      };

      try {
        page._g("rewards_calendar&action=show", response => {
          if (!response) return finish(false);

          if (
            response.e ||
            response.error ||
            response.err ||
            response.alert ||
            response.msg === "err"
          ) {
            return finish(false);
          }

          setTimeout(() => {
            const calendar = page.g?.rewardsCalendar;
            finish(Boolean(calendar?.data && calendar?.rewardDays));
          }, 500);
        });
      } catch (error) {
        console.error(TAG, error);
        finish(false);
      }

      setTimeout(() => finish(false), CALENDAR_CHECK_TIMEOUT);
    });
  }

  async function run() {
    log("Skrypt uruchomiony. Czekam na gre...");

    const heroId = await waitForStableHero();
    const heroName = page.hero.nick ?? heroId;
    const heroLevel = Number(page.hero.lvl ?? page.hero.level);

    if (!Number.isFinite(heroLevel) || heroLevel < MIN_LEVEL) {
      log(`Pomijam postac ${heroName}: poziom ${heroLevel || "nieznany"}, wymagany minimum ${MIN_LEVEL}.`);
      return;
    }

    const nextAttempt = retryTime(heroId);

    if (Date.now() < nextAttempt) {
      log(`Postac ${heroName} byla juz sprawdzana. Nastepna proba: ${new Date(nextAttempt).toLocaleString("pl-PL")}.`);
      return;
    }

    const lockedUntil = openLockTime(heroId);

    if (Date.now() < lockedUntil) {
      log(`Pomijam ponowne otwarcie kalendarza po przelogowaniu. Kolejna mozliwa proba: ${new Date(lockedUntil).toLocaleString("pl-PL")}.`);
      return;
    }

    page.localStorage.setItem(openLockKey(heroId), String(Date.now()));

    log(`Wykryto postac: ${heroName}. Sprawdzam czy istnieje aktywny kalendarz...`);

    const hasCalendar = await checkCalendarExists();

    if (!hasCalendar) {
      log("Brak aktywnego kalendarza eventowego. Pomijam postac.");
      page.localStorage.setItem(attemptKey(heroId), String(Date.now()));
      return;
    }

    const calendar = await waitUntil(
      () => page.g?.rewardsCalendar?.data && page.g?.rewardsCalendar?.rewardDays
        ? page.g.rewardsCalendar
        : null,
      5000,
      "Nie udalo sie pobrac danych kalendarza."
    );

    const today = findTodayDayNumber(calendar.rewardDays);
    log("Mapa dni kalendarza:", calendar.rewardDays);

    if (!today) {
      page.localStorage.setItem(attemptKey(heroId), String(Date.now()));
      throw new Error("Kalendarz nie zawiera nagrody przypisanej do dzisiejszej daty.");
    }

    const date = new Date().toLocaleDateString("pl-PL");

    log(`Data ${date}: wybieram pozycje ${today.dayNumber}.`, today);

    page._g(`rewards_calendar&action=open&day_no=${today.dayNumber}`);
    page.localStorage.setItem(attemptKey(heroId), String(Date.now()));

    log(`Wyslano zadanie odbioru nagrody dla daty ${date}.`);

    await sleep(1500);

    page.g?.rewardsCalendar?.close?.();

    log("Kalendarz zostal zamkniety.");
  }

  let calendarRunInProgress = false;

  async function runCalendarInBackground() {
    if (calendarRunInProgress) return;
    calendarRunInProgress = true;
    try {
      await run();
    } catch (error) {
      console.error(TAG, error);
      page.console?.error(TAG, error);
    } finally {
      calendarRunInProgress = false;
    }
  }

  void runCalendarInBackground();
  setInterval(() => void runCalendarInBackground(), 5 * 60 * 1000);
})();
