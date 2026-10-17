import {enableJuniorDrag} from './junior-drag.js';
import {juniorMissions,juniorHindi,storyCards,storyOrder} from './junior-data.js';

export function createJuniorActivities({visit,feedback}) {
  const $=id=>document.getElementById(id);
  $('juniorTask').insertAdjacentHTML('afterend','<div id="juniorBoard" hidden></div>');
  $('juniorListen').insertAdjacentHTML('afterend','<nav id="juniorMap" aria-label="Discovery map"></nav>');
  document.querySelector('.juniorGuide').insertAdjacentHTML('beforeend','<i aria-hidden="true">••</i>');
  $('juniorAdvanced').insertAdjacentHTML('beforebegin','<label class="juniorAdultOption"><input id="juniorSound" type="checkbox"> Play gentle celebration sounds</label>');
  let audio=null;
  try{$('juniorSound').checked=localStorage.getItem('stellar-junior-sound')==='true';}catch{}
  $('juniorSound').onchange=()=>{try{localStorage.setItem('stellar-junior-sound',String($('juniorSound').checked));}catch{}};
  function button(text,callback){const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=callback;return b;}
  function renderMap(mission,completed,language) {
    $('juniorMap').replaceChildren(...['☀','☁','✦','↗'].map((icon,i)=>{
      const title=(language==='hi'?juniorHindi:juniorMissions)[i].title;
      const b=button(icon,()=>visit(i));b.title=title;b.setAttribute('aria-label',`${i+1}. ${title}${completed.has(i)?' ✓':''}`);b.setAttribute('aria-current',i===mission?'step':'false');b.classList.toggle('earned',completed.has(i));
      const number=document.createElement('small');number.textContent=completed.has(i)?'✓':String(i+1);b.append(number);return b;
    }));
  }
  function celebrate(){
    const badge=$('juniorBadges');badge.classList.remove('junior-celebrate');requestAnimationFrame(()=>badge.classList.add('junior-celebrate'));
    if(!$('juniorSound').checked)return;
    try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;audio??=new Audio();audio.resume().catch(()=>{});
      [523.25,659.25,783.99].forEach((note,i)=>{const oscillator=audio.createOscillator(),gain=audio.createGain(),start=audio.currentTime+i*.13;oscillator.frequency.value=note;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.045,start+.02);gain.gain.exponentialRampToValueAtTime(.001,start+.22);oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(start);oscillator.stop(start+.23);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};});
    }catch{}
  }
  function renderBoard({mission,language,clouds,story,done,gather,place,core}) {
    const board=$('juniorBoard'),area=$('juniorChoices');board.replaceChildren();board.hidden=mission===0;
    const t=(en,hi)=>language==='hi'?hi:en;
    const miss=()=>feedback(t('Almost! Move it into the glowing space, or tap the card.','बस थोड़ा और! चमकती जगह में रखो, या कार्ड पर टैप करो।'));
    if(mission===1){
      const target=document.createElement('div');target.id='juniorCloudTarget';target.className='junior-drop-zone';target.dataset.filled=String(clouds.size);target.setAttribute('role','img');target.setAttribute('aria-label',t('Gathering place for the gas clouds','गैस के बादल इकट्ठे करने की जगह'));
      const seed=document.createElement('span');seed.className='junior-star-seed';seed.setAttribute('aria-hidden','true');seed.textContent=clouds.size===3?'✦':'☁';
      const label=document.createElement('strong');label.textContent=clouds.size===3?t('A young star begins!','एक नया तारा बन रहा है!'):t('Bring the clouds here','बादलों को यहाँ लाओ');
      const count=document.createElement('span');count.textContent=`${clouds.size} / 3`;target.append(seed,label,count);board.append(target);
      for(let i=0;i<3;i++){
        const b=button(clouds.has(i)?'✓ '+t('Gathered','मिल गया'):`☁ ${t('Cloud','बादल')} ${i+1}`,()=>gather(i));b.dataset.cloud=String(i);b.disabled=clouds.has(i);area.append(b);
        enableJuniorDrag(b,{targets:()=>[$('juniorCloudTarget')],onDrop:()=>gather(i),onMiss:miss});
      }
    }
    if(mission===2){
      const diagram=document.createElement('div');diagram.className='junior-core-diagram';
      const outside=button(t('Outer layer','बाहरी परत'),()=>{if(!done)feedback(t('Go deeper. The core is at the centre!','और अंदर देखो। Core बीच में है!'));});outside.className='junior-outer-layer';outside.disabled=done;
      const centre=button(t('Core','Core · केंद्र'),core);centre.className='junior-core-target';centre.disabled=done;centre.setAttribute('aria-label',t('Core — tap the centre','Core — बीच में टैप करो'));
      diagram.append(outside,centre);const caption=document.createElement('p');caption.className='junior-board-caption';caption.textContent=t('Touch the hot centre.','गर्म केंद्र को छुओ।');board.append(diagram,caption);
    }
    if(mission===3){
      const slots=document.createElement('div');slots.className='junior-story-slots';
      storyOrder.forEach((key,i)=>{const card=storyCards.find(c=>c.key===key),slot=document.createElement('div');slot.dataset.slot=String(i);slot.className='junior-drop-zone junior-story-slot';slot.classList.toggle('next-slot',i===story&&!done);slot.classList.toggle('filled',i<story);slot.setAttribute('role','img');slot.setAttribute('aria-label',i<story?`${i+1}: ${card[language]}`:t(`Story space ${i+1}`,`कहानी की जगह ${i+1}`));
        const symbol=document.createElement('span');symbol.setAttribute('aria-hidden','true');symbol.textContent=i<story?card.icon:String(i+1);const label=document.createElement('strong');label.textContent=i<story?card[language]:i===story?t('Drop here','यहाँ रखो'):t('Next','अगला');slot.append(symbol,label);slots.append(slot);
      });board.append(slots);
      storyCards.forEach(card=>{const b=button(card.icon+' '+card[language],()=>place(card,story));b.dataset.story=card.key;b.disabled=storyOrder.slice(0,story).includes(card.key);area.append(b);enableJuniorDrag(b,{targets:()=>[...board.querySelectorAll('[data-slot]')],onDrop:slot=>place(card,Number(slot.dataset.slot)),onMiss:miss});});
    }
  }
  return {renderBoard,renderMap,celebrate};
}
