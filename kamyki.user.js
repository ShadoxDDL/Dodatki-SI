// ==UserScript==
// @name         Margonem - Kamyki z podpisami SI
// @namespace    local.codex.margonem.stones
// @version      1.2.5
// @description  Stale aktywne podpisy teleportow z ustawieniem wielkosci czcionki.
// @updateURL    https://raw.githubusercontent.com/ShadoxDDL/Dodatki-SI/main/kamyki.user.js
// @downloadURL  https://raw.githubusercontent.com/ShadoxDDL/Dodatki-SI/main/kamyki.user.js
// @match        https://*.margonem.pl/*
// @exclude      https://new.margonem.pl/*
// @exclude      https://www.margonem.pl/*
// @grant        none
// ==/UserScript==

!function () {

    /* ===== KONFIGURACJA CZCIONKI ===== */
    let FONT_SIZE = Math.min(24, Math.max(6, Number(localStorage.getItem('codex_stones_font_size')) || 10)); // ← zmień tylko to
    /* ================================= */

    const config = {
  "177": "AGAR",
  "189": "ORLA",
  "229": "KAMB",
  "580": "MUSH",
  "6064": "MONIA",
  "632": "KOT",
  "727": "WLAD",
  "972": "MYSZ",
  "1142": "P5",
  "1150": "GOP",
  "1159": "P5",
  "1322": "ADA",
  "1462": "PANC",
  "1481": "MOCNY",
  "1526": "HENR",
  "1527": "HELG",
  "1746": "KIC",
  "1901": "CIUT",
  "1912": "FURB",
  "2021": "ŹRÓDŁ",
  "2024": "MAGUA",
  "2063": "BREH",
  "2308": "SZCZĘT",
  "2353": "ART",
  "2354": "ZOR",
  "2355": "TH",
  "2356": "FUR",
  "2532": "ZORG",
  "2646": "VARI",
  "2729": "FOV",
  "2766": "MARLO",
  "3035": "CHOP",
  "3039": "SET",
  "3149": "GOB",
  "3312": "BB",
  "3327": "TER",
  "3339": "PUST",
  "3340": "VERA",
  "3341": "CHAG",
  "3361": "LAMBO",
  "3409": "JACK",
  "3437": "KOZ",
  "3466": "OHYD",
  "3530": "W.STO",
  "3597": "DENDR",
  "3627": "SILVA",
  "3765": "ZYF",
  "3883": "REGU",
  "4046": "SOPEL",
  "4056": "SYBA",
  "4057": "SYBA",
  "4066": "HYDRA",
  "4157": "TYRT",
  "4161": "WAŻKA",
  "4185": "KRZOK",
  "4196": "LULEK",
  "4206": "ARACH",
  "4266": "REUZ",
  "4268": "DRAKO",
  "4998": "KAMB",
  "5293": "TOLL.S",
  "5395": "OWAD",
  "5657": "TOLY",
  "5662": "TOLY",
  "5672": "CIUT",
  "5684": "P9",
  "5685": "P9",
  "5694": "YAOT",
  "5708": "TEZA",
  "5709": "TEZA",
  "5851": "SHEBA",
  "5856": "BUREK",
  "5862": "SK",
  "5872": "DWK",
  "5938": "PRZED",
  "5939": "M.KOM",
  "5940": "SADO",
  "5941": "TS",
  "5942": "SSK",
  "5943": "STŚ",
  "5944": "LOCHY",
  "5945": "BERGA",
  "5946": "KORYT",
  "6053": "TORKA",
  "6055": "DRIADY",
  "6476": "PRZYZ",
  "6477": "ŁOWKA",
  "6537": "JOTUN",
  "6623": "GRAB",
  "6627": "LISZ",
  "6632": "TOLL.A",
  "6633": "TOL.U",
  "6772": "NADZ",
  "6781": "FIGL",
  "6938": "JERT",
  "6944": "M.RYC",
  "6945": "M.ŁOW",
  "6946": "M.MAG",
  "6949": "RENE",
  "6956": "GRUB",
  "7060": "ARCY",
  "7066": "CZACH",
  "7069": "OZIR",
  "7345": "K.ŚNI",
  "7353": "UMI",
  "7441": "FOD",
  "7466": "WOR",
  "7474": "GONS",
  "7477": "ZONS",
  "7689": "CERAS",
  "7693": "OGR",
  "7695": "SAT",
  "7701": "MYSZ",
  "7827": "ARYT",
  "7843": "M.MAD",
  "7859": "ALD",
  "7864": "MARLO",
  "8532": "MAZ",
  "8556": "LUN",
  "8554": "FOV",
  "3627": "SILV",
  "3628": "SILV",
  "7848": "MAGU",
  "5660": "TOLY",
  "8541": "WYSŁ",
  "8187": "WABI",
  "8181": "FANG",
  "7849": "MAGUA"
}

    const NI = false;

    function createTextOverlay(text) {
        const div = document.createElement("div");
        div.textContent = text;
        div.className = "priw8-item-overlay-text";
        return div;
    }

    function appendItemOverlay(id, text) {
        if (NI) {
            const el = document.querySelector(`.item-id-${id}`);
            if (!el) return;
            const current = el.querySelector(".priw8-item-overlay-text");
            if (current) {
                current.textContent = text;
                return;
            }
            el.appendChild(createTextOverlay(text));
        } else {
            const el = document.querySelector(`#item${id}`);
            if (!el) return;
            const current = el.querySelector(".priw8-item-overlay-text");
            if (current) {
                current.textContent = text;
                return;
            }
            el.appendChild(createTextOverlay(text));
        }
    }

    function removeItemOverlay(id) {
        const selector = NI ? `.item-id-${id}` : `#item${id}`;
        document.querySelector(selector)
            ?.querySelector(".priw8-item-overlay-text")
            ?.remove();
    }

    function parseStats(stats) {
        if (!stats) return {};
        const res = {};
        stats.split(";").forEach(e => {
            const [k, v] = e.split("=");
            res[k] = v ?? "true";
        });
        return res;
    }

    function itemLooksLikeTeleport(it) {
        const text = [it.name, it.tip, it.stat]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
        return /teleport|kamie[nń]|kamyk|zw[oó]j/.test(text);
    }

    function getItemStats(it) {
        const parsed = parseStats(it.stat);
        if (
            itemLooksLikeTeleport(it) &&
            it._cachedStats &&
            typeof it._cachedStats === "object"
        ) {
            return { ...parsed, ...it._cachedStats };
        }
        return parsed;
    }

    function getItemTp(it) {
        const s = getItemStats(it);
        return [s.custom_teleport, s.teleport]
            .find(value => value && String(value).toLowerCase() !== "true") || "";
    }

    function getTpMap(tp) {
        return String(tp).match(/\d+/)?.[0] || "";
    }

    function onItem(items) {
        for (const id in items) {
            const tp = getItemTp(items[id]);
            const label = config[tp] || config[getTpMap(tp)];
            if (label) appendItemOverlay(id, label);
            else removeItemOverlay(id);
        }
    }

    function init() {
        const org = NI ? Engine.communication.parseJSON : window.parseInput;

        const override = function (data) {
            const res = org.apply(this, arguments);
            if (data?.item) onItem(data.item);
            return res;
        };

        NI
            ? Engine.communication.parseJSON = override
            : window.parseInput = override;

        const css = `
            .priw8-item-overlay-text {
                position: absolute;
                left: 50%;
                bottom: 1px;
                transform: translateX(-50%);
                font-size: var(--codex-stones-font-size, ${FONT_SIZE}px);
                color: #fff;
                pointer-events: none;
                white-space: nowrap;
                z-index: 5;
                text-shadow:
                    1px 1px 0 #000,
                    -1px -1px 0 #000,
                    1px -1px 0 #000,
                    -1px 1px 0 #000,
                    0 1px 0 #000,
                    0 -1px 0 #000,
                    1px 0 0 #000,
                    -1px 0 0 #000;
            }
        `;

        const style = document.createElement("style");
        style.innerHTML = css;
        document.head.appendChild(style);

        window.setInterval(() => {
            const items = NI ? window.Engine?.items?.getAll?.() : window.g?.item;
            if (items) onItem(items);
        }, 500);
    }

    function createStonesSettings() {
        if (!document.body || document.getElementById('codex-stones-launcher')) return;

        document.documentElement.style.setProperty('--codex-stones-font-size', FONT_SIZE + 'px');
        const launcher = document.createElement('button');
        launcher.id = 'codex-stones-launcher';
        launcher.type = 'button';
        launcher.title = 'Kamyki - rozmiar podpisow';
        launcher.setAttribute('aria-label', 'Ustaw rozmiar podpisow teleportow');
        Object.assign(launcher.style, {
            position: 'fixed', zIndex: '999999', width: '26px', height: '26px', padding: '0', overflow: 'hidden',
            display: 'grid', placeItems: 'center', color: '#63dc72', background: 'rgba(12,38,18,.94)',
            border: '1px solid #35b653', boxShadow: '0 0 7px rgba(53,182,83,.8)', cursor: 'pointer',
            font: '700 14px/1 Arial, sans-serif'
        });
        const itemIcon = document.createElement('span');
        itemIcon.className = 'item item-id-837984866 item-tpl-33073';
        Object.assign(itemIcon.style, {
            position: 'static', display: 'block', width: '24px', height: '24px',
            margin: '0', pointerEvents: 'none',
            backgroundImage: "url('https://raw.githubusercontent.com/ShadoxDDL/Dodatki-SI/main/assets/kamyki.gif')",
            backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundSize: 'contain'
        });
        launcher.append(itemIcon);

        const panel = document.createElement('div');
        panel.id = 'codex-stones-settings';
        panel.hidden = true;
        Object.assign(panel.style, {
            position: 'fixed', zIndex: '2147483642', width: '55px', padding: '5px', color: '#eee',
            background: 'rgba(20,14,26,.97)', border: '1px solid #140e1a', borderRadius: '5px',
            boxShadow: '0 3px 12px #000', font: '12px Arial, sans-serif'
        });
        const label = document.createElement('label');
        label.textContent = '';
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '6';
        input.max = '24';
        input.step = '1';
        input.value = String(FONT_SIZE);
        Object.assign(input.style, {
            width: '45px', margin: '0', color: '#eee', background: '#140e1a',
            border: '1px solid #140e1a', borderRadius: '2px', outline: 'none', colorScheme: 'dark'
        });
        label.append(input);
        panel.append(label);
        document.body.append(launcher, panel);

        launcher.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            panel.hidden = !panel.hidden;
            if (!panel.hidden) {
                const rect = launcher.getBoundingClientRect();
                panel.style.left = Math.round(rect.right + 6) + 'px';
                panel.style.top = Math.round(rect.top) + 'px';
                input.focus();
            }
        });
        document.addEventListener('pointerdown', event => {
            if (panel.hidden || panel.contains(event.target) || launcher.contains(event.target)) return;
            panel.hidden = true;
        }, true);
        input.addEventListener('input', () => {
            const value = Math.min(24, Math.max(6, Number(input.value) || 10));
            FONT_SIZE = value;
            input.value = String(value);
            localStorage.setItem('codex_stones_font_size', String(value));
            document.documentElement.style.setProperty('--codex-stones-font-size', value + 'px');
        });
    }

    init();
    if (document.body) createStonesSettings();
    else document.addEventListener('DOMContentLoaded', createStonesSettings, { once: true });

}();
