export const scripts={
  "nursery": "Our journey begins inside a nebula: a huge cloud of gas and dust. Gravity pulls some of this material together. This is where a new star can begin.",
  "protostar": "Gravity squeezes the gas into a growing ball called a protostar. As it shrinks, its centre gets hotter. It is not yet making steady energy by fusing hydrogen.",
  "sun-main": "A star like our Sun now shines steadily. Deep inside, hydrogen joins together to make helium and release energy. This stage can last about ten billion years.",
  "sun-giant": "The star is running low on hydrogen in its centre. Its outer layers swell into a red giant and become cooler. Inside, helium can join together to make heavier elements.",
  "sun-nebula": "The star gently sheds its outer layers into space. The hot core lights up the escaping gas, making a planetary nebula. Despite its name, this glowing cloud has nothing to do with planets.",
  "sun-remnant": "A white dwarf is left behind: a hot core about the size of Earth. It slowly cools for billions of years. A single star like our Sun will not explode as a supernova.",
  "massive-main": "This star starts with about fifteen times the mass of our Sun. It burns hotter and uses its fuel much faster. Its bright, blue life lasts millions of years, rather than billions.",
  "massive-giant": "The star grows into a red supergiant. Deep inside, fusion makes heavier elements in layers, eventually reaching iron. The core is approaching a dramatic change.",
  "massive-explosion": "The iron core can no longer support itself. It collapses, and an enormous shock can blast the outer layers into space. This is a supernova, spreading material that can help form future stars and planets.",
  "massive-remnant": "In this example, the core becomes a neutron star. It packs more mass than our Sun into an object roughly the size of a city. If its rotating magnetic beams sweep past Earth, we may see a pulsar.",
  "heavy-main": "This star starts with about thirty times the mass of our Sun. It shines intensely, burns through its fuel quickly, and loses gas through powerful stellar winds.",
  "heavy-giant": "As fuel runs low, the core makes heavier elements. The star's outer layers change as strong winds carry gas away. Its exact future depends on more than its starting mass.",
  "heavy-explosion": "The core collapses. Here we show an explosion before a black hole forms. In nature, some very massive stars can form black holes with little or no bright supernova.",
  "heavy-remnant": "In this example, the core becomes a black hole. Light cannot escape from inside its event horizon. The glowing disk is hot gas around it. This is one possible ending, not a guaranteed fate for every very massive star."
};
const keys={sun:['nursery','protostar','sun-main','sun-giant','sun-nebula','sun-remnant'],massive:['nursery','protostar','massive-main','massive-giant','massive-explosion','massive-remnant'],heavy:['nursery','protostar','heavy-main','heavy-giant','heavy-explosion','heavy-remnant']};
export function createNarrator({onProgress,onChange,onFinish,onError}){
  const audio=new Audio();audio.preload='auto';
  let active=false,paused=false,stage=0,track='massive',generation=0,caption='';
  function report(){onChange({active,paused,caption});}
  async function play(){const token=generation;try{await audio.play();}catch(e){if(token!==generation||!active||paused)return;paused=true;report();onError('Audio is waiting. Press Play to retry; subtitles remain available.');}}
  function load(){
    generation++;audio.pause();const key=keys[track][stage];caption=scripts[key];
    audio.src=new URL('./audio-'+key+'.mp3',import.meta.url).href;audio.load();report();if(!paused)play();
  }
  audio.onended=()=>{if(!active||paused)return;if(stage<5){stage++;onProgress(stage/5);load();}else{active=false;report();onFinish();}};
  audio.onerror=()=>{if(active){paused=true;report();onError('Narration could not load. Press Play to retry, or stop the guide to explore freely.');}};
  return {
    get active(){return active;},get paused(){return paused;},get caption(){return caption;},
    start(t){track=t;stage=0;active=true;paused=false;onProgress(0);load();},
    stop(){generation++;active=false;paused=false;audio.pause();caption='';report();},
    toggle(){if(!active)return;paused=!paused;report();if(paused)audio.pause();else{if(audio.error)load();else play();}},
    seek(t,s){if(!active)return;if(t===track&&s===stage)return;track=t;stage=s;load();},
    tick(){if(active&&!paused&&Number.isFinite(audio.duration)&&audio.duration>0)onProgress(stage===5?1:(stage+.92*Math.min(1,audio.currentTime/audio.duration))/5);}
  };
}

