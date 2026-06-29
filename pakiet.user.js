// ==UserScript==
// @name         Dodatki-SI
// @version      1.2.1
// @updateURL    https://raw.githubusercontent.com/ShadoxDDL/Dodatki-SI/main/pakiet.user.js
// @downloadURL  https://raw.githubusercontent.com/ShadoxDDL/Dodatki-SI/main/pakiet.user.js
// @match        http*://*.margonem.pl/*
// @exclude      http*://new.margonem.pl/*
// @exclude      http*://www.margonem.pl/*
// @exclude      http*://margonem.pl/*
// @exclude      http*://forum.margonem.pl/*
// @exclude      http*://commons.margonem.pl/*
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    const BASE_URL = 'https://raw.githubusercontent.com/ShadoxDDL/Dodatki-SI/main/';
    const MODULES = [
        'panel-dodatkow.user.js',
        'autox.user.js',
        'ulepszarka.user.js',
        'kamyki.user.js',
        'autoblogo.user.js',
        'auto-kalendarz.user.js'
    ];

    const loadModule = async name => {
        const cacheKey = 'codex_addon_cache_' + name;
        let code;
        try {
            const response = await fetch(BASE_URL + name + '?refresh=' + Date.now(), {
                cache: 'no-store',
                credentials: 'omit'
            });
            if (!response.ok) throw new Error('HTTP ' + response.status);
            code = await response.text();
            localStorage.setItem(cacheKey, code);
        } catch (error) {
            code = localStorage.getItem(cacheKey);
            if (!code) throw new Error('Nie mozna pobrac modulu ' + name + ': ' + error.message);
            console.warn('[Pakiet dodatkow] Uzywam zapisanej wersji:', name, error);
        }
        new Function(code + '\n//# sourceURL=' + BASE_URL + name)();
    };

    (async () => {
        for (const moduleName of MODULES) await loadModule(moduleName);
    })().catch(error => console.error('[Pakiet dodatkow]', error));
})();
