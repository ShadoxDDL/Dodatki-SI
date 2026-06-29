// ==UserScript==
// @name         Margonem - Panel dodatkow
// @namespace    local.codex.margonem.panel
// @version      1.1.3
// @description  Wspolna zwijana belka dla niezaleznych dodatkow Margonem.
// @updateURL    https://raw.githubusercontent.com/ShadoxDDL/Dodatki-SI/main/panel-dodatkow.user.js
// @downloadURL  https://raw.githubusercontent.com/ShadoxDDL/Dodatki-SI/main/panel-dodatkow.user.js
// @match        http*://*.margonem.pl/*
// @exclude      http*://new.margonem.pl/*
// @exclude      http*://www.margonem.pl/*
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    const STORAGE_KEY = 'codex_addon_panel_collapsed';
    const uiGuard = document.createElement('style');
    uiGuard.textContent = `html:not(.codex-si-ui-ready) :is(
        #codex-addon-dock,
        #codex-stones-launcher,
        #codex-stones-settings,
        #codex-auto-bless-button,
        #codex-auto-bless,
        #Auto-X-launcher,
        #Auto-X,
        #codex-ulepszarka-launcher,
        #codex-ulepszarka-panel
    ){visibility:hidden!important;opacity:0!important;pointer-events:none!important}`;
    (document.head || document.documentElement).append(uiGuard);
    const BUTTON_IDS = [
        'codex-stones-launcher',
        'codex-auto-bless-button',
        'Auto-X-launcher',
        'codex-ulepszarka-launcher'
    ];
    let collapsed = localStorage.getItem(STORAGE_KEY) === '1';

    const style = document.createElement('style');
    style.textContent = `
#codex-addon-dock {
position:fixed;
z-index:2147483640;
width:26px;
display:flex;
flex-direction:column;
align-items:stretch;
font-family:Arial,Helvetica,sans-serif;
}
#codex-addon-dock-toggle {
position:relative;
z-index:2;
width:26px;
height:14px;
padding:0;
color:#ddd;
background:rgba(18,18,18,.97);
border:1px solid #666;
border-radius:3px 3px 0 0;
cursor:pointer;
font:700 10px/12px Arial,Helvetica,sans-serif;
}
#codex-addon-dock-items {
display:flex;
flex-direction:column;
gap:1px;
max-height:260px;
opacity:1;
overflow:hidden;
transform:translateY(0);
transform-origin:top center;
transition:max-height 260ms ease,opacity 220ms ease,transform 260ms ease;
}
#codex-addon-dock.collapsed #codex-addon-dock-items {
max-height:0;
opacity:0;
transform:translateY(-104px);
pointer-events:none;
}
#codex-addon-dock-items > button {
position:relative!important;
z-index:1!important;
inset:auto!important;
flex:0 0 26px!important;
width:26px!important;
height:26px!important;
min-width:26px!important;
min-height:26px!important;
margin:0!important;
padding:0!important;
border-radius:0!important;
transform:none!important;
visibility:visible!important;
pointer-events:auto!important;
}
#codex-addon-dock-items > button.active {
z-index:2!important;
}
#codex-addon-dock-items > button:last-child {
border-radius:0 0 3px 3px!important;
}`;

    const createPanel = () => {
        if (!document.body || document.getElementById('codex-addon-dock')) return;

        document.head.append(style);
        const dock = document.createElement('div');
        dock.id = 'codex-addon-dock';
        const toggle = document.createElement('button');
        toggle.id = 'codex-addon-dock-toggle';
        toggle.type = 'button';
        toggle.title = 'Zwin lub rozwin dodatki';
        const items = document.createElement('div');
        items.id = 'codex-addon-dock-items';
        dock.append(toggle, items);
        document.body.append(dock);

        const render = () => {
            dock.classList.toggle('collapsed', collapsed);
            toggle.textContent = collapsed ? '▼' : '▲';
            toggle.setAttribute('aria-expanded', String(!collapsed));
        };

        const collectButtons = () => {
            const buttons = BUTTON_IDS
                .map(id => document.getElementById(id))
                .filter(Boolean);
            buttons.forEach((button, index) => {
                if (items.children[index] !== button) {
                    items.insertBefore(button, items.children[index] || null);
                }
            });
        };

        const position = () => {
            const game = document.querySelector('#game, #centerbox, #centerbox2, #base, #background, .game-window, .game-container, canvas');
            const rect = game?.getBoundingClientRect() || { left: 0, top: 0 };
            dock.style.left = `${Math.max(0, Math.round(rect.left))}px`;
            dock.style.top = `${Math.max(0, Math.round(rect.top))}px`;
        };

        toggle.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            collapsed = !collapsed;
            localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
            render();
        });

        const observer = new MutationObserver(() => {
            collectButtons();
            position();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        window.addEventListener('resize', position, { passive: true });
        window.setInterval(() => {
            collectButtons();
            position();
        }, 1000);

        collectButtons();
        position();
        render();
    };

    const gameInterfaceReady = () => {
        if (document.readyState !== 'complete' || !document.body || !window.hero || window.g?.init !== 5) return false;
        const game = document.querySelector('#base') || document.querySelector('#background');
        if (!game) return false;
        const rect = game.getBoundingClientRect();
        return rect.width >= 300 && rect.height >= 200;
    };

    const boot = window.setInterval(() => {
        if (!gameInterfaceReady()) return;
        window.clearInterval(boot);
        document.documentElement.classList.add('codex-si-ui-ready');
        createPanel();
    }, 250);
})();
