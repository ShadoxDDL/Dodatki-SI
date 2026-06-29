// ==UserScript==
// @name         Margonem - Ulepszarka SI
// @namespace    local.codex.margonem.ulepszarka
// @version      0.3.5
// @description  Niezalezny modul Ulepszarki do Panelu dodatkow.
// @updateURL    https://raw.githubusercontent.com/ShadoxDDL/Dodatki-SI/main/ulepszarka.user.js
// @downloadURL  https://raw.githubusercontent.com/ShadoxDDL/Dodatki-SI/main/ulepszarka.user.js
// @match        *://*.margonem.pl/*
// @exclude      *://new.margonem.pl/*
// @exclude      *://www.margonem.pl/*
// @grant        none
// ==/UserScript==

(() => {
'use strict';

const GM_setValue = (key, value) => localStorage.setItem('codex_ulepszarka_' + key, JSON.stringify(value));
const GM_getValue = key => {
    try {
        const value = localStorage.getItem('codex_ulepszarka_' + key);
        return value === null ? undefined : JSON.parse(value);
    } catch {
        return undefined;
    }
};
//Edited by Adrianosky

// Wait for the 'g' object to be available
function waitForGame() {
    if (typeof g !== 'undefined' && g.loadQueue) {
        // Game is ready, add to load queue
        g.loadQueue.push({
            fun: () => {
                function CanTry(){
                    if(hero.id != undefined)siUlepszarka();
                    else setTimeout(CanTry,100);
                }CanTry();
            }
        });
    } else {
        // Game not ready yet, wait 100ms and try again
        setTimeout(waitForGame, 100);
    }
}

// Start waiting for the game
waitForGame();

//
let intervalUlepszarka;
//

function siUlepszarka(){
    // Dane w tamperze
    let posXY = '100px,100px';
    let item_ulepszarka = undefined,work = false;
    let helmy = false,pierscienie = false,naszyjniki = false,rekawice = false,zbroje = false,buty = false;
    let jednoreczne = false,dwureczne = false,poltoreczne = false;
    let rozdzki = false,dystansowe = false;
    let pomocnicze = false,orby = false,strzaly = false,tarcze = false;
    let limit = 0,automatic = false, uni = false;

    let dataWordl = {
        pos: posXY,
        limit: limit,
    };
    let dataHero = {
        helmy: helmy,
        pierscienie: pierscienie,
        naszyjniki: naszyjniki,
        rekawice: rekawice,
        zbroje: zbroje,
        buty: buty,
        jednoreczne: jednoreczne,
        dwureczne: dwureczne,
        poltoreczne: poltoreczne,
        rozdzki: rozdzki,
        dystansowe: dystansowe,
        pomocnicze: pomocnicze,
        orby: orby,
        item_ulepszarka: item_ulepszarka,
        work: work,
        automatic: automatic,
        uni:uni,
        strzaly:strzaly,
        tarcze:tarcze,


    }
    function updateGM(){
        dataWordl.pos = posXY;
        dataWordl.limit = limit;
        dataHero.helmy = helmy;
        dataHero.pierscienie = pierscienie;
        dataHero.naszyjniki = naszyjniki;
        dataHero.rekawice = rekawice;
        dataHero.zbroje = zbroje;
        dataHero.buty = buty;
        dataHero.jednoreczne = jednoreczne;
        dataHero.dwureczne = dwureczne;
        dataHero.poltoreczne = poltoreczne;
        dataHero.rozdzki = rozdzki;
        dataHero.dystansowe = dystansowe;
        dataHero.pomocnicze = pomocnicze;
        dataHero.orby = orby;
        dataHero.item_ulepszarka = item_ulepszarka;
        dataHero.work = work;
        dataHero.automatic = automatic;
        dataHero.uni = uni;
        dataHero.strzaly = strzaly;
        dataHero.tarcze = tarcze;
        GM_setValue('UlepszarkaSiDyna' + g.worldConfig.getWorldName(),dataWordl);
        GM_setValue('UlepszarkaSiDynaH' + hero.id,dataHero);
    }
    let GM = GM_getValue('UlepszarkaSiDyna' + g.worldConfig.getWorldName());
    let GMhero = GM_getValue('UlepszarkaSiDynaH' + hero.id);
    if(!GM || !GMhero){
        updateGM();
    }else{
        posXY = GM.pos;
        limit = GM.limit;
        helmy = GMhero.helmy;
        pierscienie = GMhero.pierscienie;
        naszyjniki = GMhero.naszyjniki;
        rekawice = GMhero.rekawice;
        zbroje = GMhero.zbroje;
        buty = GMhero.buty;
        jednoreczne = GMhero.jednoreczne;
        dwureczne = GMhero.dwureczne;
        poltoreczne = GMhero.poltoreczne;
        rozdzki = GMhero.rozdzki;
        dystansowe = GMhero.dystansowe;
        pomocnicze = GMhero.pomocnicze;
        orby = GMhero.orby;
        item_ulepszarka = GMhero.item_ulepszarka;
        work = GMhero.work;
        automatic = GMhero.automatic;
        uni = GMhero.uni;
        strzaly = GMhero.strzaly;
        tarcze = GMhero.tarcze;
        if(automatic == true && work == true){
            intervalUlepszarka = setInterval(checkSlot,500);
        }
    }
    // Element style
    var style = document.createElement('style');
    style.innerText = `
    .global-box-d{
        position: fixed;
        width: 100px;
        height: 100px;
        background: #232323;
        left: 100px;
        top: 200px;
        box-shadow: 0 0 0 1px #010101, 0 0 0 2px #888, 0 0 0 3px #0c0d0d, 2px 2px 3px 3px rgba(12, 13, 13, .4);
        user-select: none;
        font-family: sans-serif;
        font-size: 13px;
        z-index: 333;
    }
    .item-square-d{
        width: 32px;
        height: 32px;
        border: 1px solid blue;
        margin-left: 35px;
        margin-top: 10px;
    }
    .buttonUlepsz-d{
        width: 80px;
        height: 15px;
        box-shadow: 0px 0px 3px 0px #000000;
        margin-left: 12px;
        margin-top: 10px;
        color: black;
        /* font-size: 10px; */
        text-align-last: center;
        background: #898989;
        font-weight: bold;
    }

    .buttonUlepsz-d:active{
        background: #CDCDCD;
    }
    .lineLimit-d{
        width: 80px;
        height: 10px;
        background: red;
        margin-left: 10px;
        margin-top: 8px;
        border: 1px solid black;
    }
    .in-line-d{
        height: 10px;
        background: green;
    }
    .activ-d{
        width: 11px;
        height: 11px;
        border-radius: 50%;
        background: red;
        margin-left: 82px;
        margin-top: -13px;
        border: 1px solid black;
        cursor: pointer;
    }
    .settingsBox-d{
        width: 100px;
        height: 460px;
        background: #232323;
        margin-top: -10px;
        display: none;
        box-shadow: 0 0 0 1px #010101, 0 0 0 2px #888, 0 0 0 3px #0c0d0d, 2px 2px 3px 3px rgba(12, 13, 13, .4);

    }
    .item-list-d{
        display: flex;
        margin-left: 10px;
        margin-bottom: 10px;
        width: 80px;
        height: 17px;
        box-shadow: 0 0 0 1px #010101, 0 0 0 2px #888, 0 0 0 3px #0c0d0d, 2px 2px 3px 3px rgba(12, 13, 13, .4);
        justify-content: center;
        align-items: center;
    }
    .small-ulepsz-d{
        position: fixed;
        background: #071d5f;
        color: #ff0;
        font: 12px Georgia, serif;
        width: 79px;
        height: 30px;
        border: 1px solid #37a8a4;
        padding: 2px 0;
        margin: 0;
        z-index: 999;
        text-align: center;
        display:none;
    }
    .p-d{
        width: 79px;
        background: #37a8a4;
        margin-top: 1px;
        margin-bottom: 2px;
        height: 1px;
    }
    `;
    document.body.appendChild(style);

    const globalBox = document.createElement('div');
    globalBox.style.left = posXY.split(',')[0];
    globalBox.style.top = posXY.split(',')[1];
    globalBox.id = 'codex-ulepszarka-panel';
    globalBox.classList.add('global-box-d');
    globalBox.style.display = 'none';
    document.body.appendChild(globalBox);

    const ulepszarkaLauncher = document.createElement('button');
    ulepszarkaLauncher.id = 'codex-ulepszarka-launcher';
    ulepszarkaLauncher.type = 'button';
    ulepszarkaLauncher.title = 'Ulepszarka';
    ulepszarkaLauncher.setAttribute('aria-label', 'Otworz Ulepszarke');
    ulepszarkaLauncher.textContent = 'U';
    Object.assign(ulepszarkaLauncher.style, {
        position: 'fixed', zIndex: '999999', width: '26px', height: '26px', padding: '0',
        display: 'grid', placeItems: 'center', cursor: 'pointer',
        font: '700 14px/1 Arial, sans-serif'
    });
    const updateUlepszarkaLauncher = () => {
        const visible = globalBox.style.display !== 'none';
        ulepszarkaLauncher.classList.toggle('active', visible);
        Object.assign(ulepszarkaLauncher.style, visible ? {
        color: '#63dc72', backgroundColor: 'rgba(12,38,18,.94)', border: '1px solid #35b653',
        boxShadow: '0 0 7px rgba(53,182,83,.8)'
    } : {
        color: '#ff5252', backgroundColor: 'rgba(38,15,15,.94)', border: '1px solid #d83b3b',
        boxShadow: '0 0 6px rgba(216,59,59,.65)'
        });
    };
    updateUlepszarkaLauncher();
    document.body.appendChild(ulepszarkaLauncher);
    ulepszarkaLauncher.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        globalBox.style.display = globalBox.style.display === 'none' ? 'block' : 'none';
        updateUlepszarkaLauncher();
    });

    let currentX,currentY,isDragging = false;
    globalBox.addEventListener('mousedown',(e)=>{
        isDragging = true;
        currentX = e.clientX - globalBox.getBoundingClientRect().left;
        currentY = e.clientY - globalBox.getBoundingClientRect().top;
    })
    document.addEventListener('mousemove', (e) =>{
        if(isDragging){
          const x = e.clientX - currentX;
          const y = e.clientY - currentY;
          globalBox.style.left = `${x}px`;
          globalBox.style.top = `${y}px`;
        }
    });
    document.addEventListener('mouseup',() =>{
        if(isDragging){
          isDragging = false;
          posXY = globalBox.style.left + ',' + globalBox.style.top;
          updateGM();
        }
    })

    // Funkcja do tworzenia itemu
    function generateItem(item) {
        let tip = itemTip(item);
        let html = "";
        html += `<div class="item" ctip="t_item" tip="${tip.replace(/"/g, '&quot;')}">`;
        if(item.stat.indexOf("legendary") > -1) html += `<div class="itemHighlighter t_leg"></div>`;
        if(item.stat.indexOf("heroic") > -1) html += `<div class="itemHighlighter t_her"></div>`;
        if(item.stat.indexOf("unique") > -1) html += `<div class="itemHighlighter t_uni"></div>`;
        if(item.stat.indexOf("upgraded") > -1) html += `<div class="itemHighlighter t_upg"></div>`;
        html += '<img src="https://micc.garmory-cdn.cloud/obrazki/itemy/'+item.icon+'" tip="'+tip.replace(/"/g, '&quot;')+'" ctip="item">';

        html += `</div>`;
        return html;
      }
    const itemSquare = document.createElement('div');
    itemSquare.classList.add('item-square-d');
    globalBox.appendChild(itemSquare);
    if(item_ulepszarka != undefined){
        itemSquare.innerHTML = generateItem(item_ulepszarka);
        itemSquare.style.border = 'none';
    }

    const buttonUlepsz = document.createElement('div');
    buttonUlepsz.classList.add('buttonUlepsz-d');
    buttonUlepsz.innerHTML = 'Ulepsz';
    globalBox.appendChild(buttonUlepsz);
    buttonUlepsz.addEventListener('click',()=>{checkItem()})

    const lineLimit = document.createElement('div');
    lineLimit.classList.add('lineLimit-d');
    lineLimit.setAttribute('tip','Ulepszono '+limit +'/2000')
    globalBox.appendChild(lineLimit);
    lineLimit.addEventListener('contextmenu',()=>{
        limit = 0;
        lineLimit.setAttribute('tip','Ulepszono '+limit +'/2000')
        inLine.style.width = s(limit) + 'px';
        updateGM();
    })

    const inLine = document.createElement('div');
    inLine.classList.add('in-line-d');
    lineLimit.appendChild(inLine);
    inLine.style.width = s(limit) +'px';
    // Wzor na ustawienie ile lini zielonej ma być
    function s(x){
        let sume = x * 0.04
        return sume
    }


    // Otworzone menu settings
    let isSettingsOpen = false;
    const settings = document.createElement('div');
    settings.innerHTML = '⚙️';
    settings.style.marginLeft = '4px';
    settings.style.marginTop = '-86px';
    settings.style.width = '20px';
    globalBox.appendChild(settings);
    settings.addEventListener('mousedown',()=>{
        settings.style.cursor = 'pointer';
    })
    settings.addEventListener('click',()=>{
        isSettingsOpen = !isSettingsOpen;
        if(isSettingsOpen)settingsBox.style.display = 'block';
        else settingsBox.style.display = 'none';
    })

    const activ = document.createElement('div');
    activ.classList.add('activ-d');
    if(work == true) activ.style.background = 'green';
    else activ.style.background = 'red';
    globalBox.appendChild(activ);
    activ.addEventListener('click',()=>{
        work=!work;
        updateUlepszarkaLauncher();
        if(work == true) activ.style.background = 'green';
        else activ.style.background = 'red';
        message('Stan Ulepszarki ' + work)
        updateGM();
        if(automatic == true && work == true){
            clearInterval(intervalUlepszarka);
            intervalUlepszarka = setInterval(checkSlot,500);
        }
    })

    const ath = document.createElement('div');
    ath.innerHTML = 'Autor: Dyna';
    ath.style.marginTop = '75px';ath.style.fontSize = '10px';ath.style.marginLeft = '20px';
    globalBox.appendChild(ath);

    const settingsBox = document.createElement('div');
    settingsBox.classList.add('settingsBox-d');
    globalBox.appendChild(settingsBox);


    // Elementy do settings
    for(let i = 0; i < 17; i++){
        let type_item = ['Hełmy','Pierścienie','Naszyjniki','Rękawice','Zbroje','Buty','Jednoręczne','Dwuręczne','Poltoręczne','Różdżki','Dystansowe','Pomocnicze','Orby','Strzaly','Tarcze','Unikaty','Automat'];
        let items = [helmy,pierscienie,naszyjniki,rekawice,zbroje,buty,jednoreczne,dwureczne,poltoreczne,rozdzki,dystansowe,pomocnicze,orby,strzaly,tarcze,uni,automatic];
        let color = '';
        //console.log(items[i])
        const item = document.createElement('div');
        item.innerHTML = type_item[i];
        item.classList.add('item-list-d')
        if(i == 0) item.style.marginTop = '15px';
        if(items[i] == true) color = '#0af10a1c'; // green
        else color = '#ff000047'; // red
        item.style.background = color;

        settingsBox.appendChild(item);
        item.addEventListener('click',()=>{
            if(i == 0){
                helmy = !helmy;
                if(helmy == true) item.style.background = '#0af10a1c';
                else item.style.background = '#ff000047';
            }else if(i == 1){
                pierscienie = !pierscienie;
                if(pierscienie == true) item.style.background = '#0af10a1c';
                else item.style.background = '#ff000047';
            }else if(i == 2){
                naszyjniki = !naszyjniki;
                if(naszyjniki == true) item.style.background = '#0af10a1c';
                else item.style.background = '#ff000047';
            }else if(i == 3){
                rekawice = !rekawice;
                if(rekawice == true) item.style.background = '#0af10a1c';
                else item.style.background = '#ff000047';
            }else if(i == 4){
                zbroje = !zbroje;
                if(zbroje == true) item.style.background = '#0af10a1c';
                else item.style.background = '#ff000047';
            }else if(i == 5){
                buty = !buty;
                if(buty == true) item.style.background = '#0af10a1c';
                else item.style.background = '#ff000047';
            }else if(i == 6){
                jednoreczne = !jednoreczne;
                if(jednoreczne == true) item.style.background = '#0af10a1c';
                else item.style.background = '#ff000047';
            }else if(i == 7){
                dwureczne = !dwureczne;
                if(dwureczne == true) item.style.background = '#0af10a1c';
                else item.style.background = '#ff000047';
            }else if(i == 8){
                poltoreczne = !poltoreczne;
                if(poltoreczne == true) item.style.background = '#0af10a1c';
                else item.style.background = '#ff000047';
            }else if(i == 9){
                rozdzki = !rozdzki;
                if(rozdzki == true) item.style.background = '#0af10a1c';
                else item.style.background = '#ff000047';
            }else if(i == 10){
                dystansowe = !dystansowe;
                if(dystansowe == true) item.style.background = '#0af10a1c';
                else item.style.background = '#ff000047';
            }else if(i == 11){
                pomocnicze = !pomocnicze;
                if(pomocnicze == true) item.style.background = '#0af10a1c';
                else item.style.background = '#ff000047';
            }else if(i == 12){
                orby = !orby;
                if(orby == true) item.style.background = '#0af10a1c';
                else item.style.background = '#ff000047';
            }
            else if(i == 13){
                strzaly = !strzaly;
                if(strzaly == true) item.style.background = '#0af10a1c';
                else item.style.background = '#ff000047';
            }
            else if(i == 14){
                tarcze = !tarcze;
                if(tarcze == true) item.style.background = '#0af10a1c';
                else item.style.background = '#ff000047';
            }
            else if(i == 15){
                uni = !uni;
                if(uni == true) item.style.background = '#0af10a1c';
                else item.style.background = '#ff000047';
            }
            else if(i == 16){
                automatic = !automatic;
                if(automatic == true){
                    item.style.background = '#0af10a1c';
                    if(automatic == true && work == true){
                        clearInterval(intervalUlepszarka);
                        intervalUlepszarka = setInterval(checkSlot,500);
                    }
                }
                else item.style.background = '#ff000047';
            }
            updateGM();
        })
    }
    // Tablica z typami itemków możliwymi do ulepszenia
    const typItem = ['Typ:  Jednoręczne','Typ:  Półtoraręczne','Typ:  Dwuręczne','Typ:  Różdżki','Typ:  Dystansowe','Typ:  Orby magiczne','Typ:  Pomocnicze','Typ:  Tarcze','Typ:  Hełmy','Typ:  Pierścienie','Typ:  Naszyjniki','Typ:  Rękawice','Typ:  Zbroje','Typ:  Buty','Typ:  Strzały'];

    // Dodawanie itemku do ulepszarki
    const buttonUlepszItem = document.createElement('div');
    buttonUlepszItem.classList.add('small-ulepsz-d');
    document.body.appendChild(buttonUlepszItem);
    const txtUlepszItem = document.createElement('div');
    txtUlepszItem.innerHTML = 'Ulepsz';
    buttonUlepszItem.appendChild(txtUlepszItem);
    txtUlepszItem.addEventListener('mouseover',()=>{txtUlepszItem.style.background = '#267aa3'});
    txtUlepszItem.addEventListener('mouseleave',()=>{txtUlepszItem.style.background = '#071d5f'});
    const p = document.createElement('div');
    p.classList.add('p-d')
    buttonUlepszItem.appendChild(p);
    const txtUlepszItem2 = document.createElement('div');
    txtUlepszItem2.innerHTML = 'Zamknij';
    buttonUlepszItem.appendChild(txtUlepszItem2);
    txtUlepszItem2.addEventListener('mouseover',()=>{txtUlepszItem2.style.background = '#267aa3'});
    txtUlepszItem2.addEventListener('mouseleave',()=>{txtUlepszItem2.style.background = '#071d5f'});
    txtUlepszItem2.addEventListener('click',()=>{buttonUlepszItem.style.display = 'none';})

    document.addEventListener('contextmenu',(e)=>{
        const targetItem = e.target.closest('.item');
        if(!targetItem){
          if(buttonUlepszItem.style.display == 'block'){
            buttonUlepszItem.style.display = 'none';
          }
          return;
        }
        e.preventDefault();

        const itemId = targetItem.id.replace("item", "");
        for(let i = 0; i<typItem.length; i ++){
            if(g.item[itemId].tip.includes(typItem[i])){
                const mouse_x = e.clientX - 31;
                const mouse_y = e.clientY - 6;
                buttonUlepszItem.style.left = mouse_x + 'px';
                buttonUlepszItem.style.top = mouse_y + 'px';
               console.log(g.item[itemId])
                buttonUlepszItem.style.display = 'block'

            }
        }
        txtUlepszItem.addEventListener('click',()=>{
            itemSquare.innerHTML = generateItem(g.item[itemId]);
            itemSquare.style.border = 'none';
            buttonUlepszItem.style.display = 'none';

            item_ulepszarka = g.item[itemId];
console.log("item_ulepszarka", item_ulepszarka);
            updateGM();
        })


    })

    // Wszystko do ulepszania itemku niżej

    // Sprawdza czy mamy 2 lub mniej miejsca w torbach i nie mamy walki jeśli tak odpala  checkItem
    function checkSlot(){
        if(work == false) clearInterval(intervalUlepszarka)
        if(g.freeSlots <= 2 && !g.battle) checkItem();
    }
    var rzem = document.querySelector("#crafting");
    let myEq = []; // Tablica, ktora przechowuje nasze eq aby nam nie dodało itemku z eq w razie ewentualnej jakiejś zmiany z strony garmory
    let itemForUpgrade = [];
    function checkItem(){
        if(limit >= 1999){
            message('Osiągnięto limit')
            return;
        }
        clearInterval(intervalUlepszarka);
        console.log("item_ulepszarka", item_ulepszarka);
        if(item_ulepszarka == undefined){
            message('Brak itemku do ulepszania');
            return;
        }
        for(let i in g.eqItems)myEq.push(g.eqItems[i].id)
        for(let i in g.item){
            let item = g.item[i];
            if((uni == true || !item.tip.includes('unikatowy')) &&
        !myEq.includes(item.id)
        && g.crafting.window.opened == false
        && item.loc === 'g'
        && item.id != item_ulepszarka.id
        && item.enhancementPoints != undefined
        && item.itemTypeName !== "heroic"
        && item.itemTypeName !== "upgraded"
        && item.itemTypeName !== "legendary"
        && (item.tip.includes('Związany z właścicielem na stałe') || item.tip.includes('Wiąże po założeniu'))
        && !item.tip.includes('Związany z właścicielem<br>')
        && (jednoreczne == true  || !item.tip.includes('Typ:  Jednoręczne'))
        && (poltoreczne == true  || !item.tip.includes('Typ:  Półtoraręczne'))
        && (dwureczne == true  || !item.tip.includes('Typ:  Dwuręczne'))
        && (rozdzki== true  || !item.tip.includes('Typ:  Różdżki'))
        && (dystansowe == true  || !item.tip.includes('Typ:  Dystansowe'))
        && (orby == true  || !item.tip.includes('Typ:  Orby magiczne'))
        && (pomocnicze == true  || !item.tip.includes('Typ:  Pomocnicze'))
        && (tarcze == true  || !item.tip.includes('Typ:  Tarcze'))
        && (helmy == true  || !item.tip.includes('Typ:  Hełmy'))
        && (pierscienie == true  || !item.tip.includes('Typ:  Pierścienie'))
        && (naszyjniki == true  || !item.tip.includes('Typ:  Naszyjniki'))
        && (rekawice == true  || !item.tip.includes('Typ:  Rękawice'))
        && (zbroje == true  || !item.tip.includes('Typ:  Zbroje'))
        && (strzaly == true  || !item.tip.includes('Typ:  Strzały'))
        && (buty == true  || !item.tip.includes('Typ:  Buty')))
        {
            if(!itemForUpgrade.includes(item.id))itemForUpgrade.push(item.id);

        }
        }
        console.log("itemForUpgrade", itemForUpgrade)
        if(itemForUpgrade == 0){
            message('Brak itemków do ulepszania');
            return;
        }
        openCrafting();
    }

    function openCrafting(){
        if(g.crafting.window.opened == false){
            rzem.style.visibility = 'hidden';
            _g("artisanship&action=open");
        }
        setTimeout(() => { // Trzeba dodać setTimeout ponieważ bez wykrywa że okno jest zamknięte nawet jeśli jest otwarte
            if(g.crafting.window.opened == true){
                addSlotItem();
            }else{
                openCrafting();
            }
        }, 250);

    }

function addSlotItem(){
    for(let i in g.item){
        const item = g.item[i];
        if(item.id == item_ulepszarka.id && item.loc == 'g'){
            g.crafting.enhancement.onClickInventoryItem(g.item[item_ulepszarka.id]);
            //console.log(g.crafting.enhancement.selectedEnhanceItem)
        }
    }

    // Dzielenie tablicy na chunki po 10 elementów
    const chunkSize = 10;
    const chunks = [];
    for (let i = 0; i < itemForUpgrade.length; i += chunkSize) {
        chunks.push(itemForUpgrade.slice(i, i + chunkSize));
    }

    // Funkcja do przetwarzania kolejnych chunków
    function processChunks(chunkIndex = 0) {
        if (chunkIndex >= chunks.length) {
            // Wszystkie chunki przetworzone, wykonaj finalizację
            limit = g.enhanceUsages.count;
            setTimeout(() => {
                limit = g.enhanceUsages.count;
                lineLimit.setAttribute('tip','Ulepszono '+limit +'/2000')
                //console.log('Limit dwa: ' + limit)
                itemForUpgrade = [];
                canClose();
            }, 500);
            return;
        }

        const currentChunk = chunks[chunkIndex];

        // Wywołanie g() dla aktualnego chunka
        _g(`enhancement&action=progress&item=${item_ulepszarka.id}&ingredients=` + currentChunk.join(","))

        // Przejście do następnego chunka po opóźnieniu
        setTimeout(() => {
            processChunks(chunkIndex + 1);
        }, 1000); // Opóźnienie 1 sekunda między chunkamy
    }

    // Rozpoczęcie przetwarzania chunków
    processChunks();
}

    function canClose(){
        if(g.crafting.window.opened == true){
            g.crafting.window.windowClose();
            g.crafting.window.closeAll();
            inLine.style.width = s(limit) + 'px';
            lineLimit.setAttribute('tip','Ulepszono '+limit +'/2000')
            updateGM();
            setTimeout(() => {
                intervalUlepszarka = setInterval(checkSlot,500);
            }, 5000);

            rzem.style.visibility = 'visible';
        }else{
            setTimeout(canClose,100);
        }
    }
};
})();
