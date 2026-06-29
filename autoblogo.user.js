// ==UserScript==
// @name         Margonem - Auto Blogoslawienstwo
// @namespace    local.codex.margonem.autobless
// @version      1.9.2
// @description  Niezalezny modul Auto Blogoslawienstwo do Panelu dodatkow.
// @updateURL    https://raw.githubusercontent.com/ShadoxDDL/Dodatki-SI/main/autoblogo.user.js
// @downloadURL  https://raw.githubusercontent.com/ShadoxDDL/Dodatki-SI/main/autoblogo.user.js
// @match        https://*.margonem.pl/*
// @exclude      https://new.margonem.pl/*
// @exclude      https://www.margonem.pl/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(() => {
  'use strict';

  const KEY = 'codex_auto_blogo_v1';
  const CHECK_MS = 250;
  const RETRY_MS = 250;
  const EQUIP_COOLDOWN_MS = 60000;
  let lastTry = 0;
  let previousBlessed = null;
  let previousBattle = false;
  let panel;
  let launcher;
  let select;
  let status;
  let knownSignature = '';

  const load = () => {
    try {
      return { enabled: false, itemName: '', itemKey: '', panelX: null, panelY: null, lastEquipAt: 0, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
    } catch {
      return { enabled: false, itemName: '', panelX: null, panelY: null };
    }
  };
  let settings = load();
  const save = () => localStorage.setItem(KEY, JSON.stringify(settings));

  const RARITIES = {
    0: { name: 'Pospolity', color: '#9da1a7' },
    1: { name: 'Unikatowy', color: '#338742' },
    2: { name: 'Heroiczny', color: '#38b8eb' },
    3: { name: 'Legendarny', color: '#ff8400' },
    4: { name: 'Ulepszony', color: '#9fac28' },
    5: { name: 'Artefakt', color: '#e53935' },
  };

  function parseStats(item) {
    const parsed = String(item?.stat || '').split(';').reduce((out, part) => {
      const [key, value] = part.split('=');
      if (key) out[key] = value ?? true;
      return out;
    }, {});
    return item?._cachedStats && typeof item._cachedStats === 'object'
      ? { ...parsed, ...item._cachedStats }
      : parsed;
  }

  function rarityId(value) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
    const text = String(value || '').toLowerCase();
    if (/artef|artifact/.test(text)) return 5;
    if (/ulepsz|upgraded/.test(text)) return 4;
    if (/legend/.test(text)) return 3;
    if (/hero/.test(text)) return 2;
    if (/unik|unique/.test(text)) return 1;
    return 0;
  }

  function detectRarity(item, stats) {
    // Najpierw pola przeznaczone dokładnie na rangę (bez opisu bonusów przedmiotu).
    let text = [
      item.rarity, item.d?.rarity, stats.rarity,
      item.$?.[0]?.className, item.element?.className,
    ].filter(value => value != null).join(' ').toLowerCase();

    // W tooltipie szukamy wyłącznie sekcji/klasy rangi. Nie skanujemy całego opisu,
    // ponieważ może on zawierać np. napis „bonus legendarny”.
    const tip = String(item.tip ?? item.d?.tip ?? item.tooltip ?? item._tip ?? '');
    const structuredRank = tip.match(/(?:item-(?:type|rarity)|rarity)[^>]*>\s*(?:<[^>]+>\s*)*(pospolity|unikatowy|heroiczny|legendarny|ulepszony|artefakt)/i)?.[1];
    const plainTip = tip.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (structuredRank) text += ` ${structuredRank.toLowerCase()}`;
    else if (/^(pospolity|unikatowy|heroiczny|legendarny|ulepszony|artefakt)$/i.test(plainTip)) {
      text += ` ${plainTip.toLowerCase()}`;
    }

    if (/artef|artifact/.test(text)) return 5;
    if (/ulepsz|upgraded/.test(text)) return 4;
    if (/legend/.test(text)) return 3;
    if (/hero/.test(text)) return 2;
    if (/unik|unique/.test(text)) return 1;
    if (/pospol|common/.test(text)) return 0;

    // Fallback dla obiektów, które udostępniają jedynie liczbową rangę `pr`.
    return rarityId(stats.rarity ?? item.rarity ?? item.d?.rarity ?? item.pr ?? item.d?.pr ?? stats.pr ?? 0);
  }

  function bagItems() {
    const items = window.Engine?.items;
    if (items) {
      if (typeof items.fetchLocationItems === 'function') return items.fetchLocationItems('g') || [];
      const views = items.getViews?.('bag') || {};
      return Object.keys(views).map(id => items.getItemById?.(id)).filter(Boolean);
    }

    // Stary interfejs przechowuje przedmioty w globalnym g.item.
    const oldItems = window.g?.item;
    if (!oldItems) return [];
    return Object.entries(oldItems)
      .filter(([, item]) => !item.loc || item.loc === 'g')
      .map(([id, item]) => ({ ...item, id: item.id ?? id }));
  }

  function heroData() {
    return window.Engine?.hero?.d || window.hero || null;
  }

  function gameReady() {
    return Boolean(
      (window.Engine?.hero?.d && window.Engine?.items) ||
      (window.hero && window.g?.item)
    );
  }

  function heroIsDead() {
    return Boolean(window.Engine?.dead || window.hero?.dead);
  }

  function isInBattle() {
    // Stary interfejs: #battle ma display:block wyłącznie podczas walki.
    const oldBattleWindow = document.getElementById('battle');
    if (oldBattleWindow) {
      const style = getComputedStyle(oldBattleWindow);
      const rect = oldBattleWindow.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    }

    const battle = window.Engine?.battle;
    try {
      if (typeof battle?.isBattleActive === 'function' && battle.isBattleActive()) return true;
      if (typeof battle?.isActive === 'function' && battle.isActive()) return true;
    } catch {}

    if (battle?.d || battle?.battleData || battle?.data?.fighters) return true;
    if (window.g?.battle === true || Number(window.g?.battle) === 1 || window.battle?.active === true) return true;

    const battleWindow = document.querySelector('#battle-window, .battle-window');
    if (!battleWindow) return false;
    const style = getComputedStyle(battleWindow);
    const rect = battleWindow.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  }

  function blessingIsActive() {
    const hero = heroData();
    if (Number(hero?.is_blessed) === 1) return true;

    // Na starym interfejsie aktywne błogo jest przenoszone z torby
    // do osobnego slotu. W różnych wydaniach slot miał oznaczenie b/bless.
    const oldItems = window.g?.item;
    if (!oldItems) return false;
    return Object.values(oldItems).some(item =>
      Number(item?.cl) === 25 && ['b', 'bless', 'blessing'].includes(String(item?.loc || '').toLowerCase())
    );
  }

  function blessings() {
    const seenIds = new Set();
    return bagItems()
      .filter(item => Number(item.cl ?? item.d?.cl) === 25)
      .map(item => {
        const stats = parseStats(item);
        const id = String(item.id ?? item.d?.id ?? '');
        const rarityNumber = detectRarity(item, stats);
        const rarity = RARITIES[rarityNumber] || RARITIES[0];
        const rawAmount = item.amount ?? item.d?.amount ?? item.quantity ?? item.d?.quantity ??
          item.count ?? item.d?.count ?? stats.amount ?? stats.quantity ?? stats.count ?? stats.stack ?? 1;
        const parsedAmount = Number.parseInt(rawAmount, 10);
        const name = String(item.name ?? item.d?.name ?? 'Błogosławieństwo');
        return {
          item, id, name,
          ttl: Number(stats.ttl || 0),
          amount: Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 1,
          rarityId: rarityNumber,
          rarity,
          key: `${name}\u0000${rarityNumber}`,
        };
      })
      .filter(entry => entry.id && entry.ttl > 0)
      .filter(entry => {
        if (seenIds.has(entry.id)) return false;
        seenIds.add(entry.id);
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  }

  function uniqueBlessings() {
    const grouped = new Map();
    for (const entry of blessings()) {
      const old = grouped.get(entry.key);
      if (!old) grouped.set(entry.key, { ...entry });
      else old.amount += entry.amount;
    }
    return [...grouped.values()];
  }

  function setStatus(text, color = '#ddd') {
    if (!status) return;
    status.textContent = text;
    status.style.color = color;
  }

  function refreshPanel() {
    if (!select) return;
    const list = uniqueBlessings();
    const signature = JSON.stringify(list.map(x => [x.key, x.amount]));
    if (signature === knownSignature) return;
    knownSignature = signature;

    select.replaceChildren();
    if (!list.length) {
      select.add(new Option('Brak błogosławieństw w torbach', ''));
      setStatus('Nie znaleziono błogosławieństw', '#ffb74d');
      return;
    }

    for (const entry of list) {
      const option = new Option(`${entry.name} ×${entry.amount}`, entry.key);
      option.style.color = entry.rarity.color;
      option.dataset.color = entry.rarity.color;
      select.add(option);
    }
    const savedKey = settings.itemKey || list.find(x => x.name === settings.itemName)?.key;
    if (list.some(x => x.key === savedKey)) select.value = savedKey;
    else {
      select.value = list[0].key;
      settings.itemKey = list[0].key;
      settings.itemName = list[0].name;
      save();
    }
    const selected = list.find(x => x.key === select.value);
    if (selected) select.style.color = selected.rarity.color;
  }

  function createPanel() {
    const style = document.createElement('style');
    style.textContent = `
      #codex-auto-bless-button{position:fixed;z-index:999999;width:26px;height:26px;padding:0;
      display:grid;place-items:center;color:#ff5252;background-color:rgba(38,15,15,.94);border:1px solid #d83b3b;
      border-radius:3px;box-shadow:0 0 6px rgba(216,59,59,.65),0 2px 7px #000;cursor:pointer;
      font:16px/1 Arial,sans-serif;touch-action:manipulation;background-image:url('https://raw.githubusercontent.com/ShadoxDDL/Dodatki-SI/main/assets/autoblogo-icon.gif');
      background-position:center;background-repeat:no-repeat;background-size:22px 22px}
      #codex-auto-bless-button.active{color:#63dc72;background-color:rgba(12,38,18,.94);border-color:#35b653;
      box-shadow:0 0 7px rgba(53,182,83,.8),0 2px 7px #000}
      #codex-auto-bless{position:fixed;z-index:1000000;width:230px;padding:5px;
      color:#eee;background:rgba(14,18,14,.97);border:1px solid #35a853;border-radius:7px;
      box-shadow:0 0 7px rgba(53,168,83,.35),0 5px 18px #000;font:12px Arial,sans-serif;transform-origin:top right}
      #codex-auto-bless[hidden]{display:none!important}#codex-auto-bless *{box-sizing:border-box}
      #codex-auto-bless .row{display:flex;align-items:center;gap:4px}
      #codex-auto-bless .drag{flex:0 0 14px;color:#77806b;cursor:move;user-select:none;
      touch-action:none;font-size:11px;letter-spacing:-2px}
      #codex-auto-bless select{min-width:0;flex:1;height:28px;padding:3px 4px;color:#eee;
      background:#202820;border:1px solid #536044;border-radius:4px;font-size:10px}
      #codex-auto-bless .enabled{flex:0 0 28px;width:28px;height:28px;padding:0;border-radius:4px;
      color:#ff5252;background:#2b1717;border:1px solid #d83b3b;box-shadow:0 0 5px rgba(216,59,59,.55);
      cursor:pointer;font:16px/1 Arial}
      #codex-auto-bless .enabled.on{color:#63dc72;background:#142b19;border-color:#35b653;
      box-shadow:0 0 6px rgba(53,182,83,.75)}
    `;
    document.head.appendChild(style);

    launcher = document.createElement('button');
    launcher.id = 'codex-auto-bless-button';
    launcher.type = 'button';
    launcher.title = 'Auto błogosławieństwo';
    launcher.setAttribute('aria-label', 'Otwórz auto błogosławieństwo');
    launcher.textContent = '';
    document.body.appendChild(launcher);

    panel = document.createElement('div');
    panel.id = 'codex-auto-bless';
    panel.hidden = true;
    panel.innerHTML = `
      <div class="row">
        <span class="drag" title="Przeciągnij">⠿</span>
        <select class="items" title="Błogosławieństwa w torbach"></select>
        <button class="enabled" type="button" title="Włącz/wyłącz" aria-label="Włącz automatyczne używanie">⏻</button>
      </div>
    `;
    document.body.appendChild(panel);
    select = panel.querySelector('.items');
    const enabled = panel.querySelector('.enabled');
    enabled.classList.toggle('on', settings.enabled);
    enabled.setAttribute('aria-pressed', String(settings.enabled));
    launcher.classList.toggle('active', settings.enabled);

    const closePanel = () => {
      panel.hidden = true;
      launcher.setAttribute('aria-expanded', 'false');
    };
    launcher.addEventListener('click', event => {
      event.stopPropagation();
      panel.hidden = !panel.hidden;
      launcher.setAttribute('aria-expanded', String(!panel.hidden));
      if (!panel.hidden) positionUi();
    });
    installDragging(panel.querySelector('.drag'));
    document.addEventListener('pointerdown', event => {
      if (!panel.hidden && !panel.contains(event.target) && event.target !== launcher) closePanel();
    });

    enabled.addEventListener('click', () => {
      settings.enabled = !settings.enabled;
      save();
      enabled.classList.toggle('on', settings.enabled);
      enabled.setAttribute('aria-pressed', String(settings.enabled));
      launcher.classList.toggle('active', settings.enabled);
    });
    select.addEventListener('change', () => {
      const selected = uniqueBlessings().find(entry => entry.key === select.value);
      settings.itemKey = select.value;
      settings.itemName = selected?.name || '';
      select.style.color = selected?.rarity.color || '#eee';
      save();
      setStatus(`Wybrano: ${selected?.name || 'brak'}`, selected?.rarity.color || '#81c784');
    });
    refreshPanel();
    positionUi();
    window.addEventListener('resize', positionUi, { passive: true });
    window.setInterval(positionUi, 1500);
  }

  function installDragging(handle) {
    handle.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.target.closest('.close')) return;
      event.preventDefault();
      const rect = panel.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      handle.setPointerCapture?.(event.pointerId);

      const move = moveEvent => {
        const maxX = Math.max(4, innerWidth - panel.offsetWidth - 4);
        const maxY = Math.max(4, innerHeight - panel.offsetHeight - 4);
        settings.panelX = Math.max(4, Math.min(maxX, moveEvent.clientX - offsetX));
        settings.panelY = Math.max(4, Math.min(maxY, moveEvent.clientY - offsetY));
        panel.style.left = `${Math.round(settings.panelX)}px`;
        panel.style.top = `${Math.round(settings.panelY)}px`;
      };
      const stop = () => {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', stop);
        handle.removeEventListener('pointercancel', stop);
        save();
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', stop);
      handle.addEventListener('pointercancel', stop);
    });
  }

  function findHelmetSlot() {
    const selectors = [
      '[data-equip-slot="helmet"]', '[data-equip-slot="head"]', '[data-slot="helmet"]',
      '[data-slot="head"]', '[data-eq-slot="head"]', '.equipment-slot.helmet',
      '.equipment-slot--helmet', '#equipment #eq1', '#eq1'
    ];
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.getBoundingClientRect().width) return element;
    }

    // Stary interfejs: g.item często posiada bezpośrednią referencję jQuery do założonego hełmu.
    const equippedHelmet = Object.values(window.g?.item || {}).find(item =>
      Number(item?.cl) === 1 && item?.loc !== 'g' && (item?.$?.[0] || item?.obj?.[0])
    );
    return equippedHelmet?.$?.[0] || equippedHelmet?.obj?.[0] || null;
  }

  function findBlessingSlot() {
    const selectors = [
      '[data-equip-slot="blessing"]', '[data-equip-slot="bless"]',
      '[data-slot="blessing"]', '[data-slot="bless"]', '[data-eq-slot="blessing"]',
      '.equipment-slot.blessing', '.equipment-slot--blessing', '#equipment #blessing',
      '#equipment #bless', '#blessing', '#bless'
    ];
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.getBoundingClientRect().width) return element;
    }

    // Gdy błogo jest założone, wykorzystaj jego element graficzny.
    const oldBlessing = Object.values(window.g?.item || {}).find(item =>
      Number(item?.cl) === 25 && item?.loc !== 'g' &&
      (item?.$?.[0] || item?.obj?.[0] || item?.element)
    );
    const oldElement = oldBlessing?.$?.[0] || oldBlessing?.obj?.[0] || oldBlessing?.element;
    if (oldElement?.getBoundingClientRect) return oldElement;

    // Slot błoga leży bezpośrednio po lewej stronie slotu hełmu.
    // elementsFromPoint pozwala trafić również w slot bez stabilnego id/klasy.
    const helmet = findHelmetSlot();
    if (!helmet) return null;
    const rect = helmet.getBoundingClientRect();
    const x = rect.left - Math.max(2, rect.width / 2);
    const y = rect.top + rect.height / 2;
    return document.elementsFromPoint(x, y).find(element => {
      if (element === launcher || element === panel) return false;
      const candidate = element.getBoundingClientRect?.();
      return candidate && candidate.width >= 24 && candidate.width <= 40 &&
        candidate.height >= 24 && candidate.height <= 40;
    }) || null;
  }

  function positionUi() {
    if (!launcher || !panel) return;
    const gameElement = document.querySelector('#game, #centerbox, #centerbox2, .game-window, .game-container, canvas');
    const gameRect = gameElement?.getBoundingClientRect() || {
      left: 0, top: 0, right: innerWidth, bottom: innerHeight
    };
    const panelWidth = panel.offsetWidth || 230;

    launcher.style.width = '26px';
    launcher.style.height = '26px';
    launcher.style.left = `${Math.round(gameRect.left)}px`;
    launcher.style.top = `${Math.round(gameRect.top)}px`;

    if (Number.isFinite(settings.panelX) && Number.isFinite(settings.panelY)) {
      const maxX = Math.max(4, innerWidth - panel.offsetWidth - 4);
      const maxY = Math.max(4, innerHeight - panel.offsetHeight - 4);
      settings.panelX = Math.max(4, Math.min(maxX, settings.panelX));
      settings.panelY = Math.max(4, Math.min(maxY, settings.panelY));
      panel.style.left = `${Math.round(settings.panelX)}px`;
      panel.style.top = `${Math.round(settings.panelY)}px`;
    } else {
      const buttonRect = launcher.getBoundingClientRect();
      const panelLeft = Math.max(8, Math.min(innerWidth - panelWidth - 8, buttonRect.right - panelWidth));
      panel.style.left = `${Math.round(panelLeft)}px`;
      panel.style.top = `${Math.round(Math.min(innerHeight - 150, buttonRect.bottom + 6))}px`;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
    }
  }

  function tick() {
    refreshPanel();
    const hero = heroData();
    if (!settings.enabled || (!settings.itemKey && !settings.itemName) || !hero || heroIsDead()) return;
    const blessedNow = blessingIsActive();
    if (blessedNow) {
      // Rejestruje również błogo założone ręcznie już po uruchomieniu skryptu.
      if (previousBlessed === false) {
        settings.lastEquipAt = Date.now();
        save();
      }
      previousBlessed = true;
      setStatus('Błogosławieństwo jest aktywne', '#81c784');
      return;
    }
    previousBlessed = false;

    if (isInBattle()) {
      previousBattle = true;
      return;
    }
    previousBattle = false;

    const lastEquipAt = Number(settings.lastEquipAt || 0);
    if (Date.now() - lastEquipAt < EQUIP_COOLDOWN_MS) return;
    if (Date.now() - lastTry < RETRY_MS) return;

    const candidate = blessings()
      .filter(x => settings.itemKey ? x.key === settings.itemKey : x.name === settings.itemName)
      .sort((a, b) => a.ttl - b.ttl)[0];
    if (!candidate) {
      setStatus('Wybranego błoga nie ma w torbach', '#ffb74d');
      return;
    }
    if (typeof window._g !== 'function') return;

    lastTry = Date.now();
    setStatus(`Używam: ${candidate.name}`, '#ffd36a');
    window._g(`moveitem&st=1&id=${encodeURIComponent(candidate.id)}`);
  }

  function installBattleEndHook() {
    const afterBattle = () => {
      previousBattle = false;
      // Krótkie opóźnienie pozwala grze zamknąć warstwę walki i odświeżyć ekwipunek.
      window.setTimeout(tick, 0);
      window.setTimeout(tick, 50);
      window.setTimeout(tick, 150);
    };

    try {
      if (typeof window.API?.addCallbackToEvent === 'function') {
        window.API.addCallbackToEvent('close_battle', afterBattle);
      }
    } catch {}

    // Stary interfejs nie zawsze emituje close_battle. Obserwujemy więc
    // bezpośrednio zmianę display na elemencie pokazanym podczas walki.
    const oldBattleWindow = document.getElementById('battle');
    if (oldBattleWindow) {
      let wasVisible = isInBattle();
      const observer = new MutationObserver(() => {
        const visible = isInBattle();
        if (wasVisible && !visible) afterBattle();
        wasVisible = visible;
      });
      observer.observe(oldBattleWindow, {
        attributes: true,
        attributeFilter: ['style', 'class'],
      });
    }
  }

  const boot = window.setInterval(() => {
    if (!window.g || !window.hero || !window.g.item) return;
    if (!gameReady() || !document.body) return;
    clearInterval(boot);
    createPanel();
    installBattleEndHook();
    tick();
    window.setInterval(tick, CHECK_MS);
  }, 500);
})();
