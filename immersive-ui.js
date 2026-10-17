export const immersiveMarkup = `
<dialog id="immersiveMenu" aria-labelledby="immersiveTitle"><button id="closeImmersiveMenu" class="close" aria-label="Close immersive labs">×</button><div class="eyebrow">STEP INTO THE SCIENCE</div><h2 id="immersiveTitle">Immersive labs</h2><p>Explore on screen or enter VR. Every lab has button controls alongside spatial interactions.</p><div class="immersiveCards">
${[['onboarding','Learn the VR controls','Practise pointing, gripping, scaling and resetting.'],['walk','Inside the Sun','Visit enlarged core, radiation and convection chambers.'],['fusion','Hands-on fusion','Move nuclei into a reaction zone through the proton–proton chain.'],['binary','Binary-star lab','Change masses and separation; explore orbits around a shared centre.'],['replay','Supernova replay','Pause, slow down and scrub an illustrative core collapse.'],['room','Comparison room','Inspect the Sun and three compact-remnant examples.']].map(([key,name,description])=>`<button data-enter-lab="${key}"><strong>${name}</strong><span>${description}</span></button>`).join('')}
</div><h3>Graphics and offline use</h3><label for="graphicsQuality">Graphics quality</label><select id="graphicsQuality"><option value="low">Low · fewer particles, lower resolution</option><option value="balanced" selected>Balanced</option><option value="high">High · more detail</option></select><p id="graphicsNote"></p><button id="prepareOffline">Download exhibit for offline use</button><p id="offlineStatus" role="status">Offline preparation includes both narration languages.</p><p class="labNote">Open the hosted exhibit once, then prepare offline access. Localhost works on this computer; a headset needs an HTTPS address it can reach.</p></dialog>
<section id="immersiveHUD" hidden aria-label="Immersive lab controls"><div class="immersiveTop"><div><div class="eyebrow">IMMERSIVE LAB</div><h2 id="immersiveModeTitle"></h2></div><button id="leaveImmersive">Return to exhibit</button></div><p id="immersiveDescription" aria-live="polite"></p><p id="immersiveDetail"></p>
<div id="binaryControls" hidden><label>First mass: <output id="binaryMassAValue"></output><input id="binaryMassA" type="range" min="1" max="30" value="5"></label><label>Second mass: <output id="binaryMassBValue"></output><input id="binaryMassB" type="range" min="1" max="30" value="10"></label><label>Separation: <output id="binarySeparationValue"></output><input id="binarySeparation" type="range" min="0.5" max="10" step="0.1" value="3"></label></div>
<div id="replayControls" hidden><label for="replayPosition">Collapse → shock → expanding ejecta</label><input id="replayPosition" type="range" min="0" max="1000" value="0"><label>Replay speed<select id="replaySpeed"><option value="0.25">¼×</option><option value="0.5">½×</option><option value="1" selected>1×</option></select></label></div>
<div class="immersiveActions"><button id="immersivePrevious">Previous</button><button id="immersiveNext">Next</button><button id="immersiveAction">Pause</button><button id="immersiveReset">Reset lab</button></div><p class="labNote" id="immersiveHint"></p></section>`;

export async function setupOffline() {
  const button = document.getElementById('prepareOffline'), status = document.getElementById('offlineStatus');
  if (!('serviceWorker' in navigator) || !window.isSecureContext) {button.disabled=true;status.textContent='Offline access requires HTTPS or localhost and service-worker support.';return;}
  try {
    const registration = await navigator.serviceWorker.register('./sw.js');
    button.onclick = async () => {
      button.disabled=true;status.textContent='Downloading all exhibit files and narration…';
      try {
        const ready = await navigator.serviceWorker.ready;
        const channel = new MessageChannel();
        const reply = new Promise((resolve,reject) => {
          const timer=setTimeout(()=>reject(new Error('Download timed out. Reconnect and retry.')),120000);
          channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();e.data.ok?resolve(e.data):reject(new Error(e.data.error));};
        });
        ready.active.postMessage({type:'PREPARE_OFFLINE'},[channel.port2]);
        const result=await reply;status.textContent=`Ready offline: ${result.count} local assets saved, including narration. Reload this same address to use them.`;
      } catch(error) {status.textContent='Offline download failed: '+error.message;}
      finally {button.disabled=false;}
    };
    if(registration.active) status.textContent='Ready to download the exhibit and narration for offline use.';
  } catch(error) {button.disabled=true;status.textContent='Offline setup unavailable: '+error.message;}
}
