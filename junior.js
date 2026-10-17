import {createJuniorActivities} from './junior-activities.js';
import {juniorMissions,juniorHindi,storyOrder,restoredJuniorProgress} from './junior-data.js';
export function createJuniorAdventure(api) {
  document.body.insertAdjacentHTML('beforeend',`<section id="juniorExperience" hidden aria-label="Young explorer adventure">
  <div id="juniorTop"><strong>✦ Little Star Explorer</strong><div><label class="juniorLanguage">Language <select id="juniorLanguage"><option value="en">English</option><option value="hi">हिन्दी</option></select></label><button id="juniorGrownup">Parent / teacher</button></div></div>
  <div id="juniorCoach"><span class="juniorGuide" aria-hidden="true">✦</span><p id="juniorStep"></p><h1 id="juniorTitle" tabindex="-1"></h1><p id="juniorSay"></p><button id="juniorListen">🔊 Read to me</button></div>
  <div id="juniorTaskCard"><p id="juniorTask"></p><div id="juniorChoices"></div><p id="juniorFeedback" role="status"></p><div class="juniorFooter"><span id="juniorBadges" aria-label="Discoveries earned"></span><button id="juniorHint">Give me a hint</button><button id="juniorNext" disabled>Next adventure →</button></div></div></section>
  <dialog id="juniorAdults" aria-labelledby="juniorAdultsTitle"><button class="close" id="juniorCloseAdults" aria-label="Close parent and teacher menu">×</button><h2 id="juniorAdultsTitle">For parents and teachers</h2><p>Four short missions introduce the Sun as a star, gas gathering under gravity, energy from the core, and a Sun-like star’s life story.</p><p>Drag clouds to the gathering circle, put story cards in the glowing spaces, or use the same buttons with taps or a keyboard. Revisit discoveries on the four-stop map.</p><p>Ask: “What did you notice?” Let the child explain or point. There are no timers, lost lives, accounts or public scores.</p><p>Read-aloud uses the browser’s available voices. English and Hindi text work without speech support. This children’s adventure is designed for a screen; the advanced exhibit contains the separate VR features.</p><button id="juniorAdvanced">Open advanced exhibit</button><button id="juniorRestart">Start the adventure again</button></dialog>`);
  const $=id=>document.getElementById(id);let language='en',active=false,mission=0,done=false,clouds=new Set(),story=0;
  let completed=new Set();try{const restored=restoredJuniorProgress(JSON.parse(localStorage.getItem('stellar-junior-progress')));completed=new Set(restored.completed);mission=restored.next;}catch{}
  const extra=createJuniorActivities({visit(index){mission=index;startMission();},feedback});
  function copy(){return {...juniorMissions[mission],...(language==='hi'?juniorHindi[mission]:{})};}
  function save(){try{localStorage.setItem('stellar-junior-progress',JSON.stringify([...completed]));}catch{}}
  function feedback(value){$('juniorFeedback').textContent=value;}
  function success(){if(done)return;done=true;completed.add(mission);save();feedback(copy().success);$('juniorNext').disabled=false;badges();extra.celebrate();}
  function badges(){$('juniorBadges').textContent='★'.repeat(completed.size)+'☆'.repeat(4-completed.size);$('juniorBadges').setAttribute('aria-label',`${completed.size} of 4 discoveries earned`);extra.renderMap(mission,completed,language);}
  function setScene(){if(mission===2)api.inside();else api.sun(mission===1?0:mission===3?0:.4);}
  function button(text,callback){const b=document.createElement('button');b.textContent=text;b.onclick=callback;return b;}
  function renderChoices(){
    const area=$('juniorChoices'),restoreFocus=area.contains(document.activeElement);area.replaceChildren();const data=copy();
    if(data.choices)data.choices.forEach((text,i)=>{
      const b=button(text,()=>{if(done)return;if(i===data.answer){success();renderChoices();}else feedback(language==='hi'?'फिर कोशिश करो। '+data.hint:'Have another go. '+data.hint);});
      b.disabled=done;b.classList.toggle('junior-correct',done&&i===data.answer);area.append(b);
    });
    extra.renderBoard({mission,language,clouds,story,done,
      gather(index){if(clouds.has(index))return;clouds.add(index);api.progress(clouds.size===3?.2:clouds.size*.045);feedback(language==='hi'?'3 में से '+clouds.size+' बादल मिले।':clouds.size+' of 3 clouds gathered.');if(clouds.size===3)success();renderChoices();},
      place(card,slot){if(done)return;if(slot!==story||card.key!==storyOrder[story]){feedback(copy().hint);return;}story++;api.progress(card.progress);feedback(language==='hi'?'4 में से '+story+' भाग मिले।':story+' of 4 story pieces found.');if(story===4)success();renderChoices();},
      core(){if(done)return;success();renderChoices();}
    });
    if(restoreFocus)(area.querySelector('button:not(:disabled)')||$('juniorNext')).focus({preventScroll:true});
  }
  function render(moveFocus=false){const data=copy();$('juniorStep').textContent=(language==='hi'?'खोज':'Discovery')+` ${mission+1} / 4`;$('juniorTitle').textContent=data.title;$('juniorSay').textContent=data.say;$('juniorTask').textContent=data.task;$('juniorNext').disabled=!done;$('juniorNext').textContent=language==='hi'?(mission===3?'मेरा बैज दिखाओ ★':'अगली खोज →'):(mission===3?'Show my explorer badge ★':'Next adventure →');$('juniorHint').textContent=language==='hi'?'मुझे इशारा दो':'Give me a hint';$('juniorListen').textContent=language==='hi'?'🔊 मुझे सुनाओ':'🔊 Read to me';$('juniorExperience').lang=language;renderChoices();badges();if(moveFocus)$('juniorTitle').focus();}
  function startMission(){document.body.classList.toggle('junior-board-mission',mission!==0);done=false;clouds.clear();story=0;feedback('');setScene();render(true);}
  function enter(){active=true;document.body.classList.add('junior-mode');$('juniorExperience').hidden=false;try{localStorage.setItem('stellar-experience','junior');}catch{}startMission();}
  function leave(){active=false;window.speechSynthesis?.cancel();document.body.classList.remove('junior-mode','junior-board-mission');$('juniorExperience').hidden=true;api.sun(.4);try{localStorage.setItem('stellar-experience','advanced');}catch{}}
  $('juniorLanguage').onchange=e=>{window.speechSynthesis?.cancel();language=e.target.value;feedback(done?copy().success:'');render();};
  $('juniorHint').onclick=()=>feedback(copy().hint);
  $('juniorListen').onclick=()=>{
    if(!('speechSynthesis' in window)){feedback(language==='hi'?'किसी बड़े के साथ पढ़ो।':'Read this together with a grown-up.');return;}
    speechSynthesis.cancel();const data=copy();const utterance=new SpeechSynthesisUtterance(data.say+' '+data.task+' '+(data.choices||[]).join(language==='hi'?' या ':' or '));utterance.lang=language==='hi'?'hi-IN':'en-US';utterance.rate=.85;
    const voice=speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith(language));if(voice)utterance.voice=voice;
    utterance.onerror=()=>feedback(language==='hi'?'आवाज़ नहीं चली। किसी बड़े के साथ पढ़ो।':'The voice could not play. Read together with a grown-up.');speechSynthesis.speak(utterance);
  };
  $('juniorNext').onclick=()=>{if(!done)return;window.speechSynthesis?.cancel();if(mission<3){mission++;startMission();}else{
    $('juniorTitle').textContent=completed.size===4?(language==='hi'?'तुम Little Star Explorer हो!':'You are a Little Star Explorer!'):(language==='hi'?'तुमने तारे की कहानी पूरी की!':'You finished a star story!');
    $('juniorSay').textContent=language==='hi'?'सूरज एक तारा है। उसकी ऊर्जा अंदर बनती है। तारे बहुत लंबे समय में बदलते हैं।':'The Sun is a star. Its energy comes from inside. Stars change over a very long time.';
    $('juniorTask').textContent=language==='hi'?'किसी बड़े को अपनी पसंदीदा खोज बताओ।':'Tell a grown-up your favourite discovery.';$('juniorBoard').hidden=true;$('juniorChoices').replaceChildren(button(language==='hi'?'फिर खेलो ↻':'Play again ↻',()=>{mission=0;startMission();}));$('juniorNext').disabled=true;feedback('★ '.repeat(completed.size)+'☆ '.repeat(4-completed.size));$('juniorTitle').focus();
  }};
  $('juniorGrownup').onclick=()=>$('juniorAdults').showModal();$('juniorCloseAdults').onclick=()=>$('juniorAdults').close();
  $('juniorAdvanced').onclick=()=>{$('juniorAdults').close();leave();};$('juniorRestart').onclick=()=>{completed.clear();save();mission=0;$('juniorAdults').close();startMission();};
  $('openJunior').onclick=enter;
  let preference;try{preference=localStorage.getItem('stellar-experience');}catch{}if(preference!=='advanced')enter();
  return {getState:()=>({active,mission,completed:[...completed],language,clouds:clouds.size,story}),enter};
}
