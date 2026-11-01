/* HAPPY BUBBLES · Psych SIG | Static, responsive HTML5 game (no libraries).
   All dialogues and scores come from data/dialogues.js, generated from the v2 workbook.
*/
(()=>{'use strict';
const $=id=>document.getElementById(id);
const C=['Gentle Reframe','Small Steps','Grounding','Validation'];
const image={'Gentle Reframe':'card-gentle-reframe.webp','Small Steps':'card-small-steps.webp','Grounding':'card-grounding.webp','Validation':'card-validation.webp'};
const D=window.HB_DATA?.bubbles||[];
if(D.length!==30){alert('Could not load the 30 Happy Bubbles stories. Please check data/dialogues.js');return;}
const ui={canvas:$('world'),intro:$('intro'),battle:$('battle'),finished:$('finished'),mapHud:$('mapHud'),toast:$('toast'),mapPrompt:$('mapPrompt'),pause:$('pauseOverlay'),help:$('helpOverlay'),action:$('actionBtn'),actionWord:$('actionWord'),actionHint:$('actionHint'),score:$('score'),hand:$('hand'),thought:$('thought'),speaker:$('speaker'),green:$('greenLine'),distress:$('distressText'),fill:$('distressFill'),title:$('battleTitle'),bid:$('battleId'),duel:$('bubbleDuel'),joystick:$('joystick'),knob:$('joystickKnob'),playedRow:$('playedRow'),fit:$('fitLabel'),relief:$('reliefLabel'),foot:$('battleFootnote'),countGentle:$('countGentle'),countValidation:$('countValidation'),countGrounding:$('countGrounding'),countSteps:$('countSteps')};
const canvas=ui.canvas,ctx=canvas.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=false;
const world={w:2304,h:1920,riverWidth:96,bridges:[690,1430]};
let screen='intro',score=0,healed=0,paused=false,current=null,activeBubble=null,selected=null,pendingWin=false,lastRow=null;
let last=0,now=0,spawnCardTimer=0,spawnBubbleTimer=0,toastTimeout=null,exitCooldown=0;
let viewport={w:360,h:520},cam={x:0,y:0},player={x:990,y:830,r:13,dir:1,step:0};
let inv=Object.fromEntries(C.map(x=>[x,0]));
let cards=[],bubbles=[],decor=[],deck=[],idCounter=1;
const keyDown=new Set();const stick={x:0,y:0,active:false,pid:null};
let rngSeed=182734;function rand(){rngSeed=(1664525*rngSeed+1013904223)>>>0;return rngSeed/4294967296;}
const between=(a,b)=>a+(b-a)*rand();const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function hash(x,y,s=11){let v=Math.imul(x+13,374761393)^Math.imul(y+17,668265263)^Math.imul(s,1442695041);v=(v^(v>>>13))*1274126177;return ((v^(v>>>16))>>>0)/4294967295;}
function save(){try{localStorage.setItem('hbBest',String(Math.max(healed,+(localStorage.getItem('hbBest')||0))));}catch(e){}}
function toast(s){ui.toast.textContent=s;ui.toast.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>ui.toast.classList.remove('show'),2100);}
function riverX(y){return 1270+Math.sin(y*.0051)*117+Math.sin(y*.0127)*24;}
function onBridge(y){return world.bridges.some(by=>Math.abs(y-by)<38);}
function inWater(x,y){return Math.abs(x-riverX(y))<world.riverWidth/2+6 && !onBridge(y);}
const house={x:755,y:555,w:230,h:178},shrine={x:1760,y:940,w:135,h:130};
function circleRect(x,y,r,o){let xx=clamp(x,o.x,o.x+o.w),yy=clamp(y,o.y,o.y+o.h);return Math.hypot(x-xx,y-yy)<r;}
function blocked(x,y,r=12){if(x<26||y<26||x>world.w-26||y>world.h-26||inWater(x,y))return true;
 if(circleRect(x,y,r,{x:house.x+14,y:house.y+65,w:house.w-25,h:house.h-84}))return true;
 if(circleRect(x,y,r,{x:shrine.x+25,y:shrine.y+20,w:shrine.w-50,h:shrine.h-36}))return true;
 return decor.some(o=>o.block&&Math.hypot(x-o.x,y-o.y)<r+o.r);
}
function drawRect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function poly(a,c){ctx.fillStyle=c;ctx.beginPath();a.forEach(([x,y],i)=>i?ctx.lineTo(Math.round(x),Math.round(y)):ctx.moveTo(Math.round(x),Math.round(y)));ctx.closePath();ctx.fill();}
function line(points,color,w=1){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
function initDecor(){decor=[];
 for(let iy=1;iy<60;iy++)for(let ix=1;ix<72;ix++){
   let x=ix*32+between(-13,13),y=iy*32+between(-13,13),r=between(13,26);
   if(Math.abs(x-riverX(y))<114||Math.hypot(x-player.x,y-player.y)<65)continue;
   if(x>house.x-65&&x<house.x+house.w+70&&y>house.y-65&&y<house.y+house.h+65)continue;
   if(x>shrine.x-90&&x<shrine.x+shrine.w+90&&y>shrine.y-70&&y<shrine.y+shrine.h+70)continue;
   const p=rand();if(p<.103)decor.push({type:rand()<.76?'tree':'goldtree',x,y,r,block:true});
   else if(p<.15)decor.push({type:'rock',x,y,r:r*.58,block:false});
   else if(p<.49)decor.push({type:rand()<.71?'flower':'shrub',x,y,r:r*.4,block:false});
 }
}
function safeSpot(preferX,preferY){for(let i=0;i<120;i++){let local=i>0&&i<65&&Number.isFinite(preferX)&&Number.isFinite(preferY);let x=i===0?preferX:local?clamp(preferX+between(-135,135),75,world.w-75):between(75,world.w-75),y=i===0?preferY:local?clamp(preferY+between(-135,135),75,world.h-75):between(75,world.h-75);if(!blocked(x,y,26)&&Math.hypot(x-player.x,y-player.y)>55)return {x,y};}return{x:690,y:890};}
function weightedCardType(){const r=rand();return r<.34?'Validation':r<.63?'Gentle Reframe':r<.82?'Grounding':'Small Steps';}
function makeCard(x,y,type){const p=safeSpot(x,y);return{id:idCounter++,x:p.x,y:p.y,type:type||weightedCardType(),phase:rand()*6.28};}
function makeBubble(x,y,which){const p=safeSpot(x,y);let scenario=which||deck.shift()||D[Math.floor(rand()*D.length)];return{id:idCounter++,x:p.x,y:p.y,vx:between(-21,21),vy:between(-21,21),r:18,happy:false,age:0,phase:rand()*6.28,scenario,distress:100,state:scenario.id+'-S1',used:new Set(),complete:false};}
function prepareDeck(){deck=[...D];for(let i=deck.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}}
function initWorld(){rngSeed=182734;player={x:990,y:830,r:13,dir:1,step:0};score=0;healed=0;cards=[];bubbles=[];inv=Object.fromEntries(C.map(x=>[x,0]));idCounter=1;lastRow=null;initDecor();rngSeed=(Date.now() ^ Math.floor(Math.random()*0xffffffff))>>>0;prepareDeck();
 cards.push(makeCard(1032,868,'Validation'),makeCard(882,968,'Gentle Reframe'),makeCard(1076,740,'Grounding'),makeCard(780,1060,'Small Steps'),makeCard(1180,920,'Validation'),makeCard(950,1160,'Gentle Reframe'),makeCard(650,910,'Validation'),makeCard(1410,760,'Gentle Reframe'));
 bubbles.push(makeBubble(883,987),makeBubble(708,820),makeBubble(1090,1180),makeBubble(1490,670),makeBubble(1680,1280));
 updateHUD();}
function updateHUD(){score=healed;ui.score.textContent=String(healed);ui.countGentle.textContent=inv['Gentle Reframe'];ui.countValidation.textContent=inv['Validation'];ui.countGrounding.textContent=inv['Grounding'];ui.countSteps.textContent=inv['Small Steps'];ui.actionWord.textContent=screen==='intro'?'PLAY':screen==='battle'?(pendingWin?'BRIGHTEN':'USE CARD'):screen==='finished'?'RETURN':'PICK UP';ui.actionHint.textContent=screen==='intro'?'BEGIN YOUR JOURNEY':screen==='battle'?(pendingWin?'FINISH HELPING':'PLAY SELECTED CARD'):screen==='finished'?'BACK TO THE WORLD':'PICK UP';}
function setScreen(s){screen=s;ui.intro.hidden=s!=='intro';ui.battle.hidden=s!=='battle';ui.finished.hidden=s!=='finished';ui.mapHud.hidden=s!=='world';ui.mapPrompt.hidden=s!=='world';ui.pause.hidden=true;ui.help.hidden=true;ui.battle.classList.remove('done');updateHUD();}
function resize(){let r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;const d=Math.min(window.devicePixelRatio||1,1.4);let scale=d*.78;canvas.width=Math.round(r.width*scale);canvas.height=Math.round(r.height*scale);viewport={w:canvas.width,h:canvas.height};ctx.imageSmoothingEnabled=false;}
function start(){initWorld();setScreen('world');resize();toast('Explore the dreamy meadow and collect glowing cards.');canvas.focus({preventScroll:true});}
function activeInput(){let x=stick.x,y=stick.y;if(keyDown.has('ArrowLeft')||keyDown.has('a'))x-=1;if(keyDown.has('ArrowRight')||keyDown.has('d'))x+=1;if(keyDown.has('ArrowUp')||keyDown.has('w'))y-=1;if(keyDown.has('ArrowDown')||keyDown.has('s'))y+=1;let mag=Math.hypot(x,y);return mag>1?{x:x/mag,y:y/mag}:{x,y};}
function updateWorld(dt){exitCooldown=Math.max(0,exitCooldown-dt);const d=activeInput();let speed=155*dt;
 if(d.x||d.y){player.step+=dt*12;player.dir=d.x<-.1?-1:d.x>.1?1:player.dir;const nx=player.x+d.x*speed,ny=player.y+d.y*speed;if(!blocked(nx,player.y,player.r))player.x=nx;if(!blocked(player.x,ny,player.r))player.y=ny;}
 spawnCardTimer+=dt;spawnBubbleTimer+=dt;
 if(spawnCardTimer>=4.4){spawnCardTimer=0;if(cards.length<12){cards.push(makeCard());if(rand()<.25&&cards.length<12)cards.push(makeCard());}}
 if(spawnBubbleTimer>=19){spawnBubbleTimer=0;if(bubbles.filter(b=>!b.happy).length<8)bubbles.push(makeBubble());}
 for(const b of bubbles){b.age+=dt;if(b.happy)continue;
   if(rand()<dt*.55){b.vx=between(-27,27);b.vy=between(-27,27);}const nx=b.x+b.vx*dt,ny=b.y+b.vy*dt;if(blocked(nx,b.y,b.r)){b.vx*=-1;}else b.x=nx;if(blocked(b.x,ny,b.r))b.vy*=-1;else b.y=ny;
   if(exitCooldown===0&&Math.hypot(player.x-b.x,player.y-b.y)<player.r+b.r+3){enterBattle(b);break;}
 }
 bubbles=bubbles.filter(b=>!b.happy||b.age<55);
 const near=nearestCard();ui.mapPrompt.textContent=near?'✦ Card nearby — tap PICK UP':'Touch a sad bubble to talk';
}
function nearestCard(){let best=null,d=100;for(const c of cards){const dist=Math.hypot(c.x-player.x,c.y-player.y);if(dist<d){d=dist;best=c;}}return d<62?best:null;}
function pickup(){const c=nearestCard();if(!c){toast('Move closer to a glowing card.');return;}inv[c.type]++;cards=cards.filter(x=>x.id!==c.id);updateHUD();toast('Collected '+c.type+'! ✨');}
function enterBattle(b){current=b;activeBubble=b;pendingWin=false;selected=null;lastRow=null;ui.playedRow.hidden=true;ui.duel.classList.remove('smiling');ui.fit.textContent='Choose a card';ui.relief.textContent='−0 distress';ui.foot.textContent='Select a card, then tap ✦ to play it.';setScreen('battle');refreshBattle(true);}
function refreshBattle(fresh=false){if(!current)return;const st=current.scenario.states[current.state];ui.bid.textContent=current.scenario.id+' · '+current.scenario.theme;ui.title.textContent=current.scenario.title;ui.distress.textContent=current.distress+' / 100';ui.fill.style.width=current.distress+'%';ui.thought.textContent=st?st.thought:current.scenario.ending;ui.speaker.textContent="BUBBLE'S THOUGHT";if(current.distress<=30)ui.duel.style.filter='saturate(.8) brightness(1.08)';else ui.duel.style.filter='';renderHand();}
function renderHand(){ui.hand.innerHTML='';for(const card of C){const count=inv[card];const btn=document.createElement('button');btn.type='button';btn.className='hand-card'+(selected===card?' selected':'');btn.setAttribute('aria-label',card+', '+count+' available');btn.title=card+' ('+count+')';btn.disabled=count<1||pendingWin;
 const im=document.createElement('img');im.src=image[card];im.alt=card;btn.appendChild(im);const q=document.createElement('span');q.className='quantity';q.textContent='×'+count;btn.append(q);if(!count){let m=document.createElement('span');m.className='missing';m.textContent='EMPTY';btn.append(m);}const ch=document.createElement('span');ch.className='card-check';ch.textContent='✓';btn.append(ch);btn.onclick=()=>{selected=card;renderHand();ui.foot.textContent=card+' selected · tap ✦ to play';};ui.hand.append(btn);}}
function useCard(){if(pendingWin){showWin();return;}if(!selected){toast('Select a card from your hand first.');return;}if(!inv[selected]){toast('No '+selected+' cards left.');return;}
 const sid=current.state,k=sid+'|'+selected;if(current.used.has(k)){toast('You already tried this card for this thought.');return;}
 const row=current.scenario.states[sid]?.cards[selected];if(!row){toast('Dialogue unavailable for this interaction.');return;}
 inv[selected]--;current.used.add(k);current.distress=Math.max(0,current.distress-row.relief);lastRow=row;
 ui.green.textContent=row.green;ui.playedRow.hidden=false;ui.thought.textContent=row.red;ui.speaker.textContent="BUBBLE'S THOUGHT";ui.fit.textContent=['No immediate relief','Limited match','Helpful match','Strong match'][row.effect];ui.relief.textContent='−'+row.relief+' distress';
 current.state=row.next;
 selected=null;
 if(row.next.endsWith('-HAPPY')){pendingWin=true;ui.battle.classList.add('done');ui.duel.classList.add('smiling');ui.foot.textContent='Press ✦ again to brighten this bubble!';}
 else{ui.foot.textContent='Choose your next card.';}
 ui.distress.textContent=current.distress+' / 100';ui.fill.style.width=current.distress+'%';renderHand();updateHUD();}
function showWin(){if(!current)return;current.happy=true;current.age=0;current.complete=true;healed++;save();$('happyThought').textContent='“'+current.scenario.ending+'”';$('finishInsight').textContent=current.scenario.goal;setScreen('finished');}
function exitBattle(){if(screen!=='battle')return;current=null;activeBubble=null;selected=null;pendingWin=false;lastRow=null;exitCooldown=2.6;setScreen('world');toast('You can come back when you have more cards.');}
function returnWorld(){current=null;activeBubble=null;selected=null;pendingWin=false;lastRow=null;exitCooldown=2.5;setScreen('world');toast('Well done! '+healed+' bubble'+(healed!==1?'s':'')+' treated.');}
function act(){if(paused)return;if(screen==='intro'){start();return;}if(screen==='world'){pickup();return;}if(screen==='battle'){useCard();return;}if(screen==='finished'){returnWorld();}}
function doPause(){if(screen!=='world')return;paused=true;ui.pause.hidden=false;stick.x=stick.y=0;resetKnob();}
function resume(){paused=false;ui.pause.hidden=true;last=performance.now();}
function drawTile(x,y,ix,iy){const h=hash(ix,iy);const c=h<.14?'#658f67':h<.49?'#709d65':h<.83?'#7ca66b':'#6e996a';drawRect(x,y,32,32,c);
 if(h<.13){drawRect(x+3,y+5,8,2,'#8ab47a');drawRect(x+13,y+20,9,2,'#4c785c');}else if(h>.86){drawRect(x+18,y+9,3,8,'#61945e');drawRect(x+8,y+19,5,3,'#94bb78');}
 if(hash(ix,iy,41)>.89){drawRect(x+9,y+13,2,2,'#ffe9bd');drawRect(x+12,y+15,2,2,'#e5c4d9');}
}
function drawBase(){ctx.fillStyle='#6f996b';ctx.fillRect(0,0,viewport.w,viewport.h);
 const startX=Math.floor(cam.x/32),endX=Math.ceil((cam.x+viewport.w)/32),startY=Math.floor(cam.y/32),endY=Math.ceil((cam.y+viewport.h)/32);
 for(let iy=startY;iy<=endY;iy++)for(let ix=startX;ix<=endX;ix++){if(ix<0||iy<0)continue;drawTile(ix*32-cam.x,iy*32-cam.y,ix,iy);}
 // Winding flagstone path along the western meadow
 for(let y=Math.floor(cam.y/26)*26;y<cam.y+viewport.h+36;y+=26){const x=690+Math.sin(y*.003)*175;if(x<world.w){let sx=x-cam.x,sy=y-cam.y;if(sx>-40&&sx<viewport.w+40){drawRect(sx-29,sy,61,17,'#9e987f');drawRect(sx-24,sy-2,50,12,'#b8af90');drawRect(sx-12,sy+10,15,3,'#8d8976');}}}
 // river banks and flowing river: bridge gaps are drawn by bridge art below
 for(let y=Math.floor(cam.y/8)*8-12;y<cam.y+viewport.h+12;y+=8){let cx=riverX(y)-cam.x,sy=y-cam.y;if(cx<-150||cx>viewport.w+150)continue;drawRect(cx-58,sy,116,9,'#4a866f');drawRect(cx-51,sy,103,9,'#4eb1be');drawRect(cx-39,sy,82,9,'#55c6cd');
 if(hash(Math.floor(y/8),33)>.36){drawRect(cx+betweenDet(y,17)-22,sy+2,19,2,'#a0e7dc');}}
 // bridge / stepping over the water
 for(const by of world.bridges){const sx=riverX(by)-cam.x,sy=by-cam.y;if(sy<-60||sy>viewport.h+60)continue;drawRect(sx-83,sy-25,166,52,'#684d63');drawRect(sx-83,sy-29,166,13,'#d1ab81');drawRect(sx-84,sy+18,168,10,'#cf9e78');for(let x=-76;x<77;x+=18){drawRect(sx+x,sy-15,15,28,'#ad805e');drawRect(sx+x+2,sy-11,10,18,'#c39871');}for(let x of [-85,81]){drawRect(sx+x,sy-33,6,60,'#674b62');drawRect(sx+x-2,sy-38,10,9,'#ffe39c');}}
}
function betweenDet(i,seed){return (hash(Math.floor(i),seed)-.5)*30;}
function decorAt(o){const x=o.x-cam.x,y=o.y-cam.y;if(x<-75||x>viewport.w+75||y<-95||y>viewport.h+95)return;
 if(o.type==='rock'){drawRect(x-o.r,y-o.r*.5,o.r*2,o.r,'#5f6b7b');drawRect(x-o.r+3,y-o.r*.5,o.r*1.6,o.r*.65,'#9797a1');drawRect(x+1,y+o.r*.18,o.r*.6,3,'#555a6e');return;}
 if(o.type==='flower'){drawRect(x-1,y,2,9,'#4d7b4c');drawRect(x-5,y-2,4,4,'#f9cde2');drawRect(x,y-5,5,4,'#ffebd2');drawRect(x+1,y+1,4,4,'#e6aad6');drawRect(x,y-1,2,2,'#e7ad45');return;}
 if(o.type==='shrub'){drawRect(x-8,y-3,16,8,'#376e56');drawRect(x-11,y-10,19,8,'#5c9e6a');drawRect(x,y-13,12,9,'#71b56f');return;}
 const r=o.r;drawRect(x-5,y-7,10,r*1.2,'#6d4767');drawRect(x-2,y-7,3,17,'#a36b6e');const greens=o.type==='goldtree'?['#ba816e','#e8b36f','#e9cf80']:['#365e68','#537f6b','#88a56d'];
 drawRect(x-r,y-r*1.6,r*2,r*.9,greens[0]);drawRect(x-r*.8,y-r*1.9,r*1.6,r,greens[1]);drawRect(x-r*.45,y-r*2.12,r*.98,r*.65,greens[2]);drawRect(x-r*.72,y-r*1.7,r*.4,r*.2,'#bdd494');}
function drawHouse(){let x=house.x-cam.x,y=house.y-cam.y;if(x<-250||x>viewport.w+30||y<-280||y>viewport.h+60)return;
 drawRect(x+23,y+62,house.w-49,111,'#b9a27b');drawRect(x+38,y+73,house.w-78,91,'#e7c7a1');poly([[x+4,y+72],[x+112,y+4],[x+226,y+72]],'#593c6f');poly([[x+18,y+70],[x+112,y+14],[x+210,y+70]],'#a9607e');for(let i=0;i<10;i++)drawRect(x+25+i*18,y+52-Math.sin(i*Math.PI/10)*17,13,4,'#cb7d81');
 drawRect(x+96,y+108,40,64,'#684e65');drawRect(x+103,y+112,27,55,'#ab735e');drawRect(x+114,y+139,4,4,'#ffe097');for(const xx of [x+53,x+157]){drawRect(xx,y+95,24,24,'#594966');drawRect(xx+4,y+99,16,16,'#ffe0a1');drawRect(xx+11,y+99,3,16,'#b7796e');}
 drawRect(x+50,y+8,22,41,'#9b8791');drawRect(x+54,y+5,14,8,'#b9a1a6');}
function drawShrine(){let x=shrine.x-cam.x,y=shrine.y-cam.y;if(x<-200||x>viewport.w+40||y<-170||y>viewport.h+40)return;
 drawRect(x+23,y+46,90,72,'#82798d');drawRect(x+14,y+40,108,13,'#c9aca5');drawRect(x+30,y+10,72,45,'#997b99');drawRect(x+46,y+22,42,48,'#4b426b');drawRect(x+55,y+34,25,20,'#f5d08b');drawRect(x+37,y+115,70,12,'#b19c9d');}
function drawCard(c,t){let x=c.x-cam.x,y=c.y-cam.y+Math.sin(t*2+c.phase)*4;if(x<-35||x>viewport.w+35||y<-40||y>viewport.h+40)return;
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(Math.sin(t+c.phase)*.07);ctx.shadowColor='#ffe1a2';ctx.shadowBlur=13;drawRect(-11,-16,22,31,'#ffe9b7');ctx.shadowBlur=0;drawRect(-8,-13,16,25,{'Gentle Reframe':'#7077b7','Grounding':'#277b6f','Validation':'#a3548a','Small Steps':'#90618e'}[c.type]);drawRect(-5,-9,10,14,'#fff3c3');drawRect(-6,10,12,2,'#efad90');ctx.restore();}
function drawBubble(b,t){let x=b.x-cam.x,y=b.y-cam.y+Math.sin(t*2.5+b.phase)*3;if(x<-55||x>viewport.w+55||y<-55||y>viewport.h+55)return;
 let r=b.r+2;ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.shadowColor=b.happy?'#fff1a9':'#c8a6ff';ctx.shadowBlur=b.happy?12:8;
 ctx.fillStyle='#2d2449';ctx.beginPath();ctx.arc(0,2,r+3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 ctx.fillStyle=b.happy?'#f7bfd7':'#8e95e6';ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=b.happy?'#fff6ea':'#d4e4ff';ctx.beginPath();ctx.ellipse(-7,-9,8,4,-.6,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#f7d584';poly([[-8,-r-3],[-2,-r-12],[2,-r-3],[8,-r-12],[14,-r-3],[14,-r+1],[-8,-r+1]],'#f7d584');
 if(!b.happy){drawRect(7,-r+2,10,6,'#edbd90');drawRect(10,-r,3,10,'#eec7a3');}
 drawRect(-12,6,4,3,b.happy?'#f09dbc':'#a7acf0');drawRect(9,6,4,3,b.happy?'#f09dbc':'#a7acf0');
 if(b.happy){line([[-10,-2],[-6,1],[-2,-2]],'#7c4b76',2.3);line([[2,-2],[6,1],[10,-2]],'#7c4b76',2.3);line([[-8,8],[0,12],[8,8]],'#7c4b76',2.8);}
 else{line([[-11,-6],[-5,-2]],'#50457c',2.5);line([[5,-2],[11,-6]],'#50457c',2.5);drawRect(-8,-1,3,4,'#50457c');drawRect(5,-1,3,4,'#50457c');line([[-6,10],[0,6],[6,10]],'#50457c',2.5);drawRect(9,4,3,6,'#89dafa');}
 ctx.restore();}
function drawPlayer(t){const x=player.x-cam.x,y=player.y-cam.y;ctx.save();ctx.translate(Math.round(x),Math.round(y+(screen==='world'&&player.step?Math.sin(player.step)*1.5:0)));if(player.dir<0)ctx.scale(-1,1);drawRect(-10,8,8,9,'#3d354d');drawRect(3,8,8,9,'#3d354d');drawRect(-13,-7,27,19,'#765080');drawRect(-10,-4,22,12,'#b66487');drawRect(-11,-23,23,22,'#423450');drawRect(-12,-21,23,15,'#71536b');drawRect(-10,-16,20,19,'#f2cda4');drawRect(-9,-27,19,12,'#6d4f63');drawRect(8,-16,7,6,'#70566b');drawRect(-3,-11,2,3,'#46394d');drawRect(7,-11,2,3,'#46394d');drawRect(-17,-2,6,12,'#d8b78d');drawRect(13,-2,6,12,'#d8b78d');drawRect(-9,0,6,4,'#ffdf9e');ctx.restore();}
function render(t){if(!viewport.w||!viewport.h)return;
 cam.x=clamp(player.x-viewport.w*.50,0,world.w-viewport.w);cam.y=clamp(player.y-viewport.h*.55,0,world.h-viewport.h);
 drawBase();
 drawHouse();drawShrine();
 let objs=[];for(const d of decor)if(d.x>cam.x-100&&d.x<cam.x+viewport.w+100&&d.y>cam.y-130&&d.y<cam.y+viewport.h+90)objs.push({y:d.y,draw:()=>decorAt(d)});
 for(const c of cards)objs.push({y:c.y,draw:()=>drawCard(c,t)});
 for(const b of bubbles)objs.push({y:b.y,draw:()=>drawBubble(b,t)});
 objs.push({y:player.y,draw:()=>drawPlayer(t)});objs.sort((a,b)=>a.y-b.y);for(const o of objs)o.draw();
 // soft ambient light and glowing stars, just a few on screen
 for(let i=0;i<9;i++){const sx=hash(i,9)*viewport.w,sy=hash(i,19)*viewport.h;const a=.18+.23*Math.sin(t*1.3+i);ctx.fillStyle=`rgba(255,235,174,${clamp(a,0,.4)})`;ctx.fillRect(sx,sy,2,2);}
}
function frame(ts){let dt=Math.min(.047,Math.max(0,(ts-last)/1000||0));last=ts;now=ts/1000;if(screen==='world'&&!paused)updateWorld(dt);render(now);requestAnimationFrame(frame);}
function resetKnob(){ui.knob.style.transform='translate(0px,0px)';}
function stickMove(e){const r=ui.joystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;let distance=Math.hypot(dx,dy);let max=r.width*.31;if(distance>max){dx=dx/distance*max;dy=dy/distance*max;}stick.x=dx/max;stick.y=dy/max;ui.knob.style.transform=`translate(${dx}px,${dy}px)`;}
ui.joystick.addEventListener('pointerdown',e=>{if(screen!=='world'||paused)return;e.preventDefault();stick.active=true;stick.pid=e.pointerId;ui.joystick.setPointerCapture(e.pointerId);stickMove(e);});
ui.joystick.addEventListener('pointermove',e=>{if(stick.active&&e.pointerId===stick.pid)stickMove(e);});
function releaseStick(e){if(stick.pid===e.pointerId){stick.x=stick.y=0;stick.active=false;resetKnob();}}
ui.joystick.addEventListener('pointerup',releaseStick);ui.joystick.addEventListener('pointercancel',releaseStick);ui.joystick.addEventListener('lostpointercapture',()=>{stick.x=stick.y=0;stick.active=false;resetKnob();});
ui.action.addEventListener('click',act);$('playBtn').addEventListener('click',start);$('exitBattle').addEventListener('click',exitBattle);$('returnWorld').addEventListener('click',returnWorld);
$('pauseBtn').addEventListener('click',doPause);$('resumeBtn').addEventListener('click',resume);$('restartBtn').addEventListener('click',()=>{paused=false;start();});
$('helpBtn').addEventListener('click',()=>{if(screen==='world'){paused=true;ui.help.hidden=false;}});$('closeHelp').addEventListener('click',()=>{ui.help.hidden=true;paused=false;last=performance.now();});
window.addEventListener('keydown',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(k))e.preventDefault();keyDown.add(k);
 if(k===' '||k==='Enter'){if(!e.repeat)act();}
 else if(k==='Escape'){if(!ui.help.hidden){ui.help.hidden=true;paused=false;}else if(!ui.pause.hidden)resume();else if(screen==='battle')exitBattle();else if(screen==='world')doPause();}
 else if(screen==='battle'&&['ArrowLeft','ArrowRight','a','d'].includes(k)){let avail=C.filter(c=>inv[c]>0);if(avail.length){const n=avail.indexOf(selected);selected=avail[(n+(k==='ArrowLeft'||k==='a'?-1:1)+avail.length)%avail.length];renderHand();}}
});window.addEventListener('keyup',e=>keyDown.delete(e.key.length===1?e.key.toLowerCase():e.key));window.addEventListener('blur',()=>{keyDown.clear();stick.x=stick.y=0;resetKnob();});
window.addEventListener('resize',resize);if('ResizeObserver' in window)new ResizeObserver(resize).observe(ui.canvas);
// Disable gestures within the game, but leave actual page scaling to the browser outside game.
canvas.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
resize();initWorld();setScreen('intro');requestAnimationFrame(frame);
})();
