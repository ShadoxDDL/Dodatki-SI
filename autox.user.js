// ==UserScript==
// @name         MDMA - Auto-X SI
// @description  Auto-X dla SI
// @updateURL    https://raw.githubusercontent.com/ShadoxDDL/Dodatki-SI/main/autox.user.js
// @downloadURL  https://raw.githubusercontent.com/ShadoxDDL/Dodatki-SI/main/autox.user.js
// @version      1.0.5
// @author       Libit
// @match        http*://*.margonem.pl/
// @exclude      http*://margonem.*/*
// @exclude      http*://www.margonem.*/*
// @exclude      http*://new.margonem.*/*
// @exclude      http*://forum.margonem.*/*
// @exclude      http*://commons.margonem.*/*
// @exclude      http*://dev-commons.margonem.*/*
// @grant        none
// ==/UserScript==
(function () {
    const saveSettings = () => localStorage.setItem('Auto-X', JSON.stringify(ls));
    if (!JSON.parse(localStorage.getItem('Auto-X'))) localStorage.setItem('Auto-X', JSON.stringify({ pos: { x: 0, y: 0, height: 73, width: 105 }, settings: {} }));
    const ls = JSON.parse(localStorage.getItem('Auto-X'));
    if (typeof ls.collapsed !== 'boolean') ls.collapsed = false;
    if (typeof ls.panelHidden !== 'boolean') ls.panelHidden = true;
    if (typeof ls.docked !== 'boolean') {
        ls.docked = true;
        ls.pos.x = 0;
        ls.pos.y = 0;
    }
    if (ls.dockVersion !== 5) {
        ls.docked = true;
        ls.pos.x = 0;
        ls.pos.y = 0;
        ls.dockVersion = 5;
    }
    if (!ls.settings[window.getCookie('mchar_id')]) {
        ls.settings[window.getCookie('mchar_id')] = {
            enabled: false,
            enabledAutoF: false,
            escapeQueued: false,
            autoCloseBattleConfigured: false,
            lvl: {
                min: 0,
                max: 500
            }
        }
    }
    const characterSettings = ls.settings[window.getCookie('mchar_id')];
    if (typeof characterSettings.enabledAutoF !== 'boolean') characterSettings.enabledAutoF = false;
    if (typeof characterSettings.escapeQueued !== 'boolean') characterSettings.escapeQueued = false;
    if (typeof characterSettings.autoCloseBattleConfigured !== 'boolean') characterSettings.autoCloseBattleConfigured = false;
    if (characterSettings.autoCloseBattleConfigVersion !== 4) {
        characterSettings.autoCloseBattleConfigured = false;
        characterSettings.autoCloseBattleConfigVersion = 4;
    }
    saveSettings();

    const showMissingTeleportMessage = () => {
        const message = document.createElement('div');
        message.className = 'Auto-X-missing-teleport';
        message.textContent = 'Brak zwoj\u00f3w na kwiaty!';
        Object.assign(message.style, {
            position: 'fixed',
            left: '50%',
            top: '20%',
            transform: 'translate(-50%, 0)',
            width: '720px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            color: '#ffe600',
            font: 'bold 28px Arial, Helvetica, sans-serif',
            textShadow: '2px 2px 3px #000, -2px -2px 3px #000',
            pointerEvents: 'none',
            zIndex: '2147483647',
            opacity: '1',
            transition: 'opacity 2400ms ease, transform 2400ms ease-out'
        });
        document.body.append(message);
        setTimeout(() => {
            message.style.transform = 'translate(-50%, 150px)';
            message.style.opacity = '0';
        }, 50);
        setTimeout(() => {
            message.remove();
        }, 2500);
    };

    const Engine = new class Engine {
        constructor() {
            this.settings = ls.settings[window.getCookie('mchar_id')];
            this.killDistance = 2;
            this.target = undefined;
            this.quickFightTriggered = false;
            this.lastAttackAt = 0;
            this.attackInterval = 250;
            this.retryInterval = 750;
            this.attackedTargets = new Map();
            this.wasInBattle = false;
            this.escapeInProgress = false;
        }
        get hero() {
            return window.hero;
        }
        get allInit() {
            return window.g?.init === 5;
        }
        get notInBattle() {
            return !window.g.battle;
        }
        get map() {
            return window.map;
        }
        checkEmo(other) {
            const otherElement = document.querySelector(`#other${other.id}`);
            if (!otherElement) return false;
            return !otherElement.querySelector(
                '.emo-cointainer > .emo.emo-battle, ' +
                '.emo-cointainer > .emo.emo-protection, ' +
                '.emo-cointainer > .emo.emo-protected, ' +
                '.emo-cointainer > .emo.emo-pvp-protection, ' +
                '.emo-cointainer > .emo.emo-guard, ' +
                '.emo-cointainer > .emo.emo-immunity, ' +
                '.emo-cointainer > .emo[class*="protect"], ' +
                '.emo-cointainer > .emo[class*="ochron"], ' +
                '.emo-cointainer > .emo[title*="ochron" i], ' +
                '.emo-cointainer > .emo[title*="protection" i], ' +
                '.emo-cointainer > .emo[data-type*="protect" i], ' +
                '.emo-cointainer > .emo[data-name*="ochron" i]'
            );
        }
        getOthersArray() {
            return Object.keys(window.g.other).map(id => window.g.other[id]);
        }
        getTargets() {
            const others = this.getOthersArray();
            const visibleIds = new Set(others.map(other => String(other.id)));
            const now = Date.now();
            for (const [targetId, state] of this.attackedTargets) {
                if (!visibleIds.has(targetId)) {
                    this.attackedTargets.delete(targetId);
                    continue;
                }
                const other = others.find(candidate => String(candidate.id) === targetId);
                const isAvailable = this.checkEmo(other);
                if (!isAvailable) state.sawBattle = true;
                else if (state.sawBattle) this.attackedTargets.delete(targetId);
                else if (now - state.attackedAt >= this.retryInterval) this.attackedTargets.delete(targetId);
            }
            return others
                .filter(other => [1, 3, 6].includes(other.relation))
                .filter(other => this.settings.lvl.max >= other.lvl && other.lvl >= this.settings.lvl.min)
                .filter(other => !this.attackedTargets.has(String(other.id)))
                .filter(other => this.checkEmo(other));
        }
        getClosestTarget(targets) {
            let closestTarget = targets[0];
            for (const target of targets) {
                if (Math.hypot(target.x - this.hero.x, target.y - this.hero.y) < Math.hypot(closestTarget.x - this.hero.x, closestTarget.y - this.hero.y)) {
                    closestTarget = target;
                }
            }
            return closestTarget;
        }
        waitForGameInit() {
            return new Promise(resolve => {
                const wait = () => {
                    if (this.allInit) resolve();
                    else setTimeout(wait, 20);
                }
                wait();
            })
        }
        pressF() {
            const target = document.activeElement || document;
            for (const type of ['keydown', 'keypress', 'keyup']) {
                const event = new KeyboardEvent(type, {
                    key: 'f',
                    code: 'KeyF',
                    keyCode: 70,
                    charCode: type === 'keypress' ? 102 : 0,
                    which: 70,
                    bubbles: true,
                    cancelable: true
                });
                Object.defineProperty(event, 'keyCode', { get: () => 70 });
                Object.defineProperty(event, 'which', { get: () => 70 });
                target.dispatchEvent(event);
            }
        }
        setBattleMode(quick) {
            const wantedTexts = quick ? ['szybka walka'] : ['walka turowa'];
            const visibleElements = [...document.querySelectorAll('button, input, div, span, a')]
                .map(element => {
                    const text = String(element.textContent || element.value || element.title || '').trim().toLowerCase();
                    const rect = element.getBoundingClientRect();
                    return { element, text, rect };
                })
                .filter(item =>
                    wantedTexts.includes(item.text) &&
                    item.rect.width > 0 &&
                    item.rect.height > 0 &&
                    item.rect.bottom > 0 &&
                    item.rect.right > 0
                )
                .sort((a, b) => {
                    const textPriority = wantedTexts.indexOf(a.text) - wantedTexts.indexOf(b.text);
                    if (textPriority !== 0) return textPriority;
                    return (a.rect.width * a.rect.height) - (b.rect.width * b.rect.height);
                });
            const element = visibleElements[0]?.element;

            if (element) {
                const clickable = element.closest('button, a, [role="button"], .button, .btn') || element;
                clickable.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                clickable.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
                clickable.click();
                return true;
            }

            return false;
        }
        getTeleportScroll() {
            const items = Object.values(window.g?.item || {});
            return items.find(item => {
                const name = String(item.name || '')
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .trim()
                    .toLowerCase();
                return name === 'zwoj teleportacji na kwieciste przejscie';
            });
        }
        useTeleportScroll() {
            const teleport = this.getTeleportScroll();
            if (!teleport) {
                showMissingTeleportMessage();
                return false;
            }
            window._g(`moveitem&id=${teleport.id}&st=1`);
            return true;
        }
        attackTarget() {
            const now = Date.now();
            if (now - this.lastAttackAt < this.attackInterval) return;
            this.lastAttackAt = now;
            this.attackedTargets.set(String(this.target.id), { sawBattle: false, attackedAt: now });
            window._g(`fight&a=attack&id=${this.target.id}`);
        }
        track() {
            if (!this.allInit || !this.map || !this.hero || !window.g?.other) return;

            const inBattle = !this.notInBattle;
            if (inBattle) this.wasInBattle = true;

            if (!inBattle && this.wasInBattle && this.settings.escapeQueued) {
                this.wasInBattle = false;
                this.escapeInProgress = true;
                this.settings.escapeQueued = false;
                document.getElementById('Auto-X-button-escape')?.classList.remove('Auto-X-ON');
                saveSettings();
                this.useTeleportScroll();
                setTimeout(() => {
                    this.escapeInProgress = false;
                }, 1000);
                return;
            }

            if (!inBattle) this.wasInBattle = false;

            if (this.settings.escapeQueued || this.escapeInProgress) {
                return;
            }

            if (inBattle) {
                const attackedTarget = this.attackedTargets.get(String(this.target?.id));
                if (attackedTarget) attackedTarget.sawBattle = true;
                if (this.settings.enabledAutoF && !this.quickFightTriggered) {
                    this.quickFightTriggered = this.setBattleMode(true);
                }
                return;
            }

            this.quickFightTriggered = false;

            if (!this.settings.enabled) {
                return;
            }

            if (this.map.pvp != 2 && this.map.pvp != 4) return;

            this.target = this.getClosestTarget(this.getTargets());

            if (!this.target) return;

            const distanceX = Math.abs(this.target.x - this.hero.x);
            const distanceY = Math.abs(this.target.y - this.hero.y);
            if (Math.max(distanceX, distanceY) <= this.killDistance) {
                this.attackTarget();
            }
        }
    }
    function main() {
        setInterval(() => Engine.track(), 50);

        if (!Engine.settings.autoCloseBattleConfigured) {
            const configureAutoCloseBattle = () => {
                const directOption = document.querySelector('#opt27.server-opt, .server-opt[opt="27"]');
                if (directOption) {
                    const enabled = directOption.classList.contains('active') ||
                        directOption.classList.contains('checked') ||
                        directOption.classList.contains('on') ||
                        directOption.classList.contains('selected') ||
                        directOption.getAttribute('aria-checked') === 'true';
                    if (!enabled) {
                        directOption.click();
                        return false;
                    }

                    Engine.settings.autoCloseBattleConfigured = true;
                    saveSettings();
                    document.querySelector('.close-but[onclick*="config_cancel"]')?.click();
                    return true;
                }

                const label = [...document.querySelectorAll('label, div, span, li, td')]
                    .find(element => element.textContent?.trim().toLowerCase().includes('automatyczne zamykanie okna walki'));
                if (!label) return false;

                let container = label;
                let checkbox = null;
                let checkElement = null;
                for (let depth = 0; depth < 5 && container; depth++) {
                    checkbox = container.querySelector?.('input[type="checkbox"]');
                    checkElement = container.querySelector?.('.checkbox, .check, [class*="checkbox"], [class*="check"]');
                    if (checkbox || checkElement) break;
                    container = container.parentElement;
                }

                if (checkbox) {
                    if (!checkbox.checked) {
                        checkbox.click();
                        return false;
                    }
                    if (!checkbox.checked) return false;
                } else {
                    if (!checkElement) return false;
                    const enabled = checkElement.classList.contains('checked') ||
                        checkElement.classList.contains('active') ||
                        checkElement.classList.contains('on') ||
                        checkElement.getAttribute('aria-checked') === 'true' ||
                        checkElement.style.backgroundPosition?.includes('-') === true;
                    if (!enabled) {
                        checkElement.click();
                        return false;
                    }
                }

                Engine.settings.autoCloseBattleConfigured = true;
                saveSettings();
                document.querySelector('.close-but[onclick*="config_cancel"]')?.click();
                return true;
            };

            const wasConfigVisible = Boolean(document.querySelector('#config, .config, #config_box'));
            if (typeof window.config_show === 'function') window.config_show();

            let configureAttempts = 0;
            const configureTimer = setInterval(() => {
                configureAttempts++;
                if (configureAutoCloseBattle() || configureAttempts >= 40) {
                    clearInterval(configureTimer);
                    if (!wasConfigVisible) {
                        document.querySelector('.close-but[onclick*="config_cancel"]')?.click();
                    }
                }
            }, 100);
        }

        const turn = () => {
            const button = document.getElementById('Auto-X-button');
            if (Engine.settings.enabled) {
                Engine.settings.enabled = false;
                button.classList.add('Auto-X-OFF');
                button.classList.remove('Auto-X-ON');
            } else {
                Engine.settings.enabled = true;
                button.classList.add('Auto-X-ON');
                button.classList.remove('Auto-X-OFF');
            }
            saveSettings();
        }
        const turnAutoF = () => {
            const button = document.getElementById('Auto-X-button-auto-f');
            if (Engine.settings.enabledAutoF) {
                Engine.settings.enabledAutoF = false;
                if (!Engine.notInBattle) {
                    Engine.quickFightTriggered = Engine.setBattleMode(false);
                } else {
                    Engine.quickFightTriggered = false;
                }
                button.classList.add('Auto-X-OFF');
                button.classList.remove('Auto-X-ON');
            } else {
                Engine.settings.enabledAutoF = true;
                if (!Engine.notInBattle) {
                    Engine.quickFightTriggered = Engine.setBattleMode(true);
                }
                button.classList.add('Auto-X-ON');
                button.classList.remove('Auto-X-OFF');
            }
            saveSettings();
        }

        const main = document.createElement('div');
        main.setAttribute('id', 'Auto-X');
        document.body.append(main);

        const launcher = document.createElement('button');
        launcher.id = 'Auto-X-launcher';
        launcher.type = 'button';
        launcher.title = 'Auto-X';
        launcher.setAttribute('aria-label', 'Otworz Auto-X');
        launcher.textContent = 'X';
        document.body.append(launcher);

        main.hidden = ls.panelHidden;
        launcher.classList.toggle('active', !main.hidden);
        launcher.setAttribute('aria-expanded', String(!main.hidden));

        const blockedEvents = [
            'pointerdown', 'pointerup', 'pointermove',
            'mousedown', 'mouseup', 'mousemove',
            'click', 'dblclick', 'contextmenu',
            'touchstart', 'touchmove', 'touchend',
            'wheel'
        ];
        for (const eventName of blockedEvents) {
            main.addEventListener(eventName, event => {
                event.stopPropagation();
            });
        }

        const title = document.createElement('div');
        title.setAttribute('id', 'Auto-X-title');
        title.textContent = 'AUTO-X';
        main.append(title);

        const lock = document.createElement('button');
        lock.setAttribute('id', 'Auto-X-lock');
        lock.title = 'Zablokuj lub odblokuj pozycjÄ™ panelu';
        lock.classList.toggle('unlocked', !ls.docked);
        main.append(lock);

        const collapse = document.createElement('button');
        collapse.setAttribute('id', 'Auto-X-collapse');
        collapse.title = 'ZwiĹ„ lub rozwiĹ„ panel';
        collapse.textContent = '';
        main.append(collapse);

        const button = document.createElement('button');
        button.setAttribute('id', 'Auto-X-button');
        button.title = 'WĹ‚Ä…cz/WyĹ‚Ä…cz Auto-X';
        if (Engine.settings.enabled) button.classList.add('Auto-X-ON');
        else button.classList.add('Auto-X-OFF');
        button.addEventListener('click', turn);
        main.append(button);

        const buttonAutoF = document.createElement('button');
        buttonAutoF.setAttribute('id', 'Auto-X-button-auto-f');
        buttonAutoF.textContent = 'S.WALKA';
        buttonAutoF.title = 'WĹ‚Ä…cz/WyĹ‚Ä…cz automatyczne uruchamianie szybkiej walki';
        if (Engine.settings.enabledAutoF) buttonAutoF.classList.add('Auto-X-ON');
        else buttonAutoF.classList.add('Auto-X-OFF');
        buttonAutoF.addEventListener('click', turnAutoF);
        main.append(buttonAutoF);

        const buttonEscape = document.createElement('button');
        buttonEscape.setAttribute('id', 'Auto-X-button-escape');
        buttonEscape.textContent = 'UCIECZKA';
        buttonEscape.title = 'UĹĽyj zwoju teleportacji';
        if (Engine.settings.escapeQueued) buttonEscape.classList.add('Auto-X-ON');
        buttonEscape.addEventListener('click', () => {
            if (!Engine.getTeleportScroll()) {
                Engine.settings.escapeQueued = false;
                Engine.escapeInProgress = false;
                buttonEscape.classList.add('Auto-X-ON');
                showMissingTeleportMessage();
                setTimeout(() => buttonEscape.classList.remove('Auto-X-ON'), 220);
                saveSettings();
                return;
            }
            if (Engine.settings.escapeQueued) {
                Engine.settings.escapeQueued = false;
                Engine.escapeInProgress = false;
                buttonEscape.classList.remove('Auto-X-ON');
            } else if (!Engine.notInBattle) {
                Engine.settings.escapeQueued = true;
                buttonEscape.classList.add('Auto-X-ON');
            } else if (Engine.useTeleportScroll()) {
                buttonEscape.classList.add('Auto-X-ON');
                setTimeout(() => buttonEscape.classList.remove('Auto-X-ON'), 200);
            }
            saveSettings();
        });
        main.append(buttonEscape);
        main.classList.toggle('Auto-X-collapsed', ls.collapsed);

        const input = document.createElement('input');
        input.setAttribute('id', 'Auto-X-lvl');
        input.setAttribute('type', 'text');
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('pattern', '[0-9]*-[0-9]*');
        input.setAttribute('value', `${Engine.settings.lvl.min}-${Engine.settings.lvl.max}`);
        input.addEventListener('keydown', event => {
            if (!['w', 'a', 's', 'd'].includes(event.key.toLowerCase())) return;
            event.preventDefault();
            input.blur();
            const movementEvent = new KeyboardEvent('keydown', {
                key: event.key,
                code: event.code,
                bubbles: true,
                cancelable: true
            });
            Object.defineProperty(movementEvent, 'keyCode', { get: () => event.keyCode });
            Object.defineProperty(movementEvent, 'which', { get: () => event.which });
            document.dispatchEvent(movementEvent);
        });
        input.addEventListener('input', () => {
            const digitsAndDash = input.value.replace(/[^0-9-]/g, '');
            const [min = '', ...rest] = digitsAndDash.split('-');
            const max = rest.join('');
            input.value = rest.length > 0 ? `${min}-${max}` : min;

            if (/^\d+-\d+$/.test(input.value)) {
                const [validMin, validMax] = input.value.split('-').map(Number);
                Engine.settings.lvl.min = validMin;
                Engine.settings.lvl.max = validMax;
                saveSettings();
            }
        });
        main.append(input);

        const style = document.createElement('style');
        style.innerHTML = `\n#Auto-X{\nposition:fixed;\nwidth:121px;\nheight:122px;\ntop:18px;\nright:auto;\nbottom:auto;\nleft:6px;\nbox-sizing:border-box;\nborder:2px solid #444;\nborder-radius:11px;\nbox-shadow:0 1px 4px #000,inset 0 0 0 1px #111;\nbackground:linear-gradient(#292929,#090909);\ncolor:#fff;\nfont:11px Arial,sans-serif;\nz-index:2147483600\n}\n#Auto-X.Auto-X-collapsed{\nheight:59px\n}\n#Auto-X-title{\nposition:absolute;\ntop:68px;\nleft:30px;\nwidth:56px;\nheight:14px;\ntext-align:center;\nfont-weight:bold;\nline-height:14px;\ncolor:#eee\n}\n#Auto-X-lock{\nposition:absolute;\ntop:66px;\nleft:7px;\nwidth:18px;\nheight:18px;\npadding:0;\nborder:0;\nbackground:transparent;\nz-index:10;\ncursor:pointer\n}\n#Auto-X-lock::before{\ncontent:'';\nposition:absolute;\ntop:2px;\nleft:5px;\nwidth:7px;\nheight:7px;\nborder:1px solid #ddd;\nborder-bottom:0;\nborder-radius:5px 5px 0 0\n}\n#Auto-X-lock::after{\ncontent:'';\nposition:absolute;\ntop:8px;\nleft:4px;\nwidth:9px;\nheight:7px;\nborder:1px solid #ddd;\nborder-radius:1px;\nbackground:#222\n}\n#Auto-X-lock.unlocked::before{\nleft:9px;\ntransform:rotate(25deg);\ntransform-origin:left bottom\n}\n#Auto-X-collapse{\nposition:absolute;\ntop:66px;\nright:6px;\nwidth:18px;\nheight:18px;\npadding:0;\nborder:0;\ncolor:#ddd;\nbackground:transparent;\nfont:bold 16px/16px Arial;\nz-index:10;\ncursor:pointer\n}\n#Auto-X-button{\nposition:absolute;\ntop:92px;\nleft:8px;\nheight:16px;\nwidth:16px;\npadding:0;\nbox-sizing:border-box;\nborder:1px solid #555;\nborder-radius:2px;\nfont-size:0\n}\n#Auto-X-button.Auto-X-ON::after{\ncontent:'âś“';\ncolor:#0f0;\nfont:bold 14px/14px Arial\n}\n#Auto-X-button-auto-f,\n#Auto-X-button-escape{\nposition:absolute;\nleft:7px;\nheight:27px;\nwidth:107px;\nbox-sizing:border-box;\nborder:1px solid #777;\nborder-radius:8px;\nbox-shadow:0 0 0 2px #222;\ncolor:#fff;\nbackground:#181818;\ntext-align:center;\nfont-weight:bold\n}\n#Auto-X-button-escape{\ntop:6px\n}\n#Auto-X-button-auto-f{\ntop:37px\n}\n#Auto-X-button-auto-f.Auto-X-ON{\nborder-color:#7cff85;\nbox-shadow:0 0 5px #4cff5a,inset 0 0 5px #173d1b\n}\n#Auto-X.Auto-X-collapsed #Auto-X-button-auto-f,\n#Auto-X.Auto-X-collapsed #Auto-X-button-escape{\ndisplay:none\n}\n#Auto-X.Auto-X-collapsed #Auto-X-title{\ntop:5px\n}\n#Auto-X.Auto-X-collapsed #Auto-X-lock,\n#Auto-X.Auto-X-collapsed #Auto-X-collapse{\ntop:3px\n}\n#Auto-X.Auto-X-collapsed #Auto-X-button{\ntop:29px\n}\n#Auto-X.Auto-X-collapsed #Auto-X-lvl{\ntop:28px\n}\n#Auto-X-lvl{\nposition:absolute;\ntop:91px;\nleft:31px;\nheight:19px;\nwidth:82px;\nbox-sizing:border-box;\nborder:1px solid #555;\nborder-radius:3px;\nbackground:#050505;\ncolor:#fff;\ntext-align:center;\nfont-weight:bold\n}\n.Auto-X-ON{\nbackground:#181818\n}\n.Auto-X-OFF{\nbackground:#181818\n}\n`;
        document.head.append(style);
        const escapeStyle = document.createElement('style');
        escapeStyle.innerHTML = `
#Auto-X,
#Auto-X *,
#Auto-X *::before,
#Auto-X *::after{
font-family:Arial,Helvetica,sans-serif!important;
font-style:normal!important;
font-variant:normal!important;
text-transform:none!important;
letter-spacing:normal!important;
word-spacing:normal!important;
text-shadow:none!important
}
#Auto-X button,
#Auto-X input{
font-size:11px!important;
line-height:normal!important;
margin:0!important;
outline:0!important
}
#Auto-X-title{
font-size:11px!important;
font-weight:700!important;
line-height:14px!important
}
#Auto-X-button-auto-f,
#Auto-X-button-escape{
font-size:11px!important;
font-weight:700!important;
line-height:25px!important;
padding:0!important
}
#Auto-X-lvl{
font-size:11px!important;
font-weight:700!important;
line-height:17px!important;
padding:0 2px!important
}
#Auto-X-button-escape.Auto-X-ON{
border-color:#7cff85;
box-shadow:0 0 5px #4cff5a,inset 0 0 5px #173d1b
}
#Auto-X-button{
appearance:none;
background:#181818!important
}
#Auto-X-button.Auto-X-ON::after{
content:'';
position:absolute;
left:4px;
top:2px;
width:5px;
height:8px;
border:solid #00ff24;
border-width:0 2px 2px 0;
transform:rotate(45deg)
}
#Auto-X-collapse::before,
#Auto-X-collapse::after{
content:'';
position:absolute;
left:5px;
width:0;
height:0;
border-left:4px solid transparent;
border-right:4px solid transparent
}
#Auto-X-collapse::before{
top:3px;
border-bottom:5px solid #ddd
}
#Auto-X-collapse::after{
bottom:3px;
border-top:5px solid #ddd
}`;
        document.head.append(escapeStyle);
        const launcherStyle = document.createElement('style');
        launcherStyle.textContent = `
#Auto-X-launcher {
position:fixed;
z-index:2147483601;
width:26px;
height:26px;
padding:0;
display:grid;
place-items:center;
color:#ff5252;
background-color:rgba(38,15,15,.94);
border:1px solid #d83b3b;
border-radius:3px;
box-shadow:0 0 6px rgba(216,59,59,.65),0 2px 7px #000;
cursor:pointer;
font:700 14px/1 Arial,Helvetica,sans-serif;
}
#Auto-X-launcher.active {
color:#63dc72;
background-color:rgba(12,38,18,.94);
border-color:#35b653;
box-shadow:0 0 7px rgba(53,182,83,.8),0 2px 7px #000;
}`;
        document.head.append(launcherStyle);

        const findGameElement = () => {
            const siGameWindow = document.querySelector('#base') || document.querySelector('#background');
            if (siGameWindow) return siGameWindow;
            const selectors = ['#base', '#background', '#centerbox2', '#game', '#ground', '#map', '.map-layer', 'canvas'];
            const candidates = [];
            for (const selector of selectors) {
                const visible = [...document.querySelectorAll(selector)]
                    .filter(element => {
                        const rect = element.getBoundingClientRect();
                        return rect.width >= 300 && rect.height >= 200 && rect.bottom > 0 && rect.right > 0;
                    });
                candidates.push(...visible);
            }
            const mapSized = candidates
                .filter(element => element.getBoundingClientRect().right < window.innerWidth - 80)
                .sort((a, b) => {
                    const aRect = a.getBoundingClientRect();
                    const bRect = b.getBoundingClientRect();
                    return (bRect.width * bRect.height) - (aRect.width * aRect.height);
                });
            if (mapSized[0]) return mapSized[0];
            candidates.sort((a, b) => {
                const aRect = a.getBoundingClientRect();
                const bRect = b.getBoundingClientRect();
                return (bRect.width * bRect.height) - (aRect.width * aRect.height);
            });
            if (candidates[0]) return candidates[0];
            return document.documentElement;
        };
        const gameElement = findGameElement();

        const positionLauncher = () => {
            const blessButton = document.getElementById('codex-auto-bless-button');
            const blessRect = blessButton?.getBoundingClientRect();
            if (blessRect?.width && blessRect?.height) {
                launcher.style.left = `${Math.round(blessRect.left)}px`;
                launcher.style.top = `${Math.round(blessRect.bottom + 4)}px`;
                return;
            }
            const gameRect = gameElement === document.documentElement
                ? { left: 0, bottom: window.innerHeight }
                : gameElement.getBoundingClientRect();
            launcher.style.left = `${Math.max(0, Math.round(gameRect.left))}px`;
            launcher.style.top = `${Math.max(0, Math.round(gameRect.bottom) - launcher.offsetHeight)}px`;
        };

        const keepVisible = () => {
            positionLauncher();
            if (ls.docked) {
                const gameRect = gameElement === document.documentElement
                    ? { left: 0, bottom: window.innerHeight }
                    : gameElement.getBoundingClientRect();
                main.style.top = `${Math.max(0, Math.round(gameRect.bottom) - main.offsetHeight)}px`;
                main.style.right = 'auto';
                main.style.left = `${Math.max(0, Math.round(gameRect.left))}px`;
                return;
            }
            const maxX = Math.max(0, window.innerWidth - main.offsetWidth);
            const maxY = Math.max(0, window.innerHeight - main.offsetHeight);
            ls.pos.x = Math.min(Math.max(0, parseInt(main.style.left) || 0), maxX);
            ls.pos.y = Math.min(Math.max(0, parseInt(main.style.top) || 0), maxY);
            main.style.left = `${ls.pos.x}px`;
            main.style.top = `${ls.pos.y}px`;
        };

        launcher.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            main.hidden = !main.hidden;
            ls.panelHidden = main.hidden;
            launcher.classList.toggle('active', !main.hidden);
            launcher.setAttribute('aria-expanded', String(!main.hidden));
            if (!main.hidden) {
                ls.docked = true;
                lock.classList.remove('unlocked');
                keepVisible();
            }
            saveSettings();
        });

        let dragState = null;
        let dragFrame = null;

        const renderDrag = () => {
            dragFrame = null;
            if (!dragState?.dragging) return;
            const maxX = Math.max(0, window.innerWidth - main.offsetWidth);
            const maxY = Math.max(0, window.innerHeight - main.offsetHeight);
            const x = Math.min(Math.max(0, dragState.latestX - dragState.offsetX), maxX);
            const y = Math.min(Math.max(0, dragState.latestY - dragState.offsetY), maxY);
            main.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
        };

        main.addEventListener('pointerdown', event => {
            if (ls.docked || event.button !== 0 || event.target.closest('button, input')) return;
            const rect = main.getBoundingClientRect();
            dragState = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                latestX: event.clientX,
                latestY: event.clientY,
                offsetX: event.clientX - rect.left,
                offsetY: event.clientY - rect.top,
                dragging: false
            };
        });

        window.addEventListener('pointermove', event => {
            if (!dragState || event.pointerId !== dragState.pointerId || (event.buttons & 1) === 0) return;
            dragState.latestX = event.clientX;
            dragState.latestY = event.clientY;
            if (!dragState.dragging && Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY) >= 8) {
                dragState.dragging = true;
                main.style.top = '0';
                main.style.left = '0';
                main.style.right = 'auto';
                main.style.bottom = 'auto';
                main.setPointerCapture?.(event.pointerId);
            }
            if (dragState.dragging) {
                event.preventDefault();
                if (!dragFrame) dragFrame = requestAnimationFrame(renderDrag);
            }
        }, true);

        const stopDrag = event => {
            if (!dragState || event.pointerId !== dragState.pointerId) return;
            if (dragState.dragging) {
                if (dragFrame) cancelAnimationFrame(dragFrame);
                renderDrag();
                const rect = main.getBoundingClientRect();
                ls.pos.x = Math.round(rect.left);
                ls.pos.y = Math.round(rect.top);
                main.style.transform = '';
                main.style.left = `${ls.pos.x}px`;
                main.style.top = `${ls.pos.y}px`;
                main.releasePointerCapture?.(event.pointerId);
                saveSettings();
            }
            dragState = null;
        };
        window.addEventListener('pointerup', stopDrag, true);
        window.addEventListener('pointercancel', stopDrag, true);

        if (!ls.docked) {
            main.style.right = 'auto';
            main.style.left = `${ls.pos.x}px`;
            main.style.top = `${ls.pos.y}px`;
            keepVisible();
        }
        window.addEventListener('resize', keepVisible);
        keepVisible();

        const updateNativeWindowsLayer = () => {
            const nativeButtons = new Set(document.querySelectorAll('#b_friends, #b_premium, #b_map, #b_world, #b_skills'));
            const nativePanels = [...document.querySelectorAll(
                '#friends, #friends-list, #friendsList, .friends, .friends-list, [class*="friends"], ' +
                '#premium, .premium, [class*="premium"], ' +
                '#minimap, #mini-map, .minimap, [class*="minimap"], ' +
                '#world-map, #worldMap, .world-map, [class*="world-map"], ' +
                '#skills, #skill-list, #skillList, .skills, .skill-list, [class*="skill"]'
            )].filter(element => !nativeButtons.has(element) && !main.contains(element));
            const nativeWindowOpen = nativePanels.some(element => {
                const rect = element.getBoundingClientRect();
                const style = getComputedStyle(element);
                return rect.width > 40 && rect.height > 40 &&
                    rect.bottom > 0 && rect.right > 0 &&
                    style.display !== 'none' && style.visibility !== 'hidden';
            });
            main.style.zIndex = nativeWindowOpen ? '10' : '2147483600';
        };
        let nativeWindowsUpdateTimer = null;
        const scheduleNativeWindowsLayerUpdate = () => {
            clearTimeout(nativeWindowsUpdateTimer);
            nativeWindowsUpdateTimer = setTimeout(() => {
                updateNativeWindowsLayer();
                positionLauncher();
            }, 100);
        };
        const nativeWindowsObserver = new MutationObserver(scheduleNativeWindowsLayerUpdate);
        nativeWindowsObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });
        updateNativeWindowsLayer();

        collapse.addEventListener('mousedown', event => event.stopPropagation());
        collapse.addEventListener('click', event => {
            event.stopPropagation();
            ls.collapsed = !ls.collapsed;
            main.classList.toggle('Auto-X-collapsed', ls.collapsed);
            keepVisible();
            saveSettings();
        });

        lock.addEventListener('mousedown', event => event.stopPropagation());
        lock.addEventListener('click', event => {
            event.stopPropagation();
            if (ls.docked) {
                const rect = main.getBoundingClientRect();
                ls.docked = false;
                ls.pos.x = Math.round(rect.left);
                ls.pos.y = Math.round(rect.top);
                main.style.right = 'auto';
                main.style.bottom = 'auto';
                main.style.left = `${ls.pos.x}px`;
                main.style.top = `${ls.pos.y}px`;
                lock.classList.add('unlocked');
            } else {
                ls.docked = true;
                lock.classList.remove('unlocked');
                keepVisible();
            }
            saveSettings();
        });
    }
    Engine.waitForGameInit().then(() => {
        main();
    })

})();
