import * as THREE from './three.module.js';
import {binaryOrbit, FusionExperiment, fusionSteps, interiorStops, onboardingSteps} from './immersive-data.js';
import {scaleObjects} from './learning-data.js';
import {immersiveMarkup, setupOffline} from './immersive-ui.js';

export function createImmersiveLabs({scene, camera, controls, renderer, controllers, onMode, quality}) {
  const $ = id => document.getElementById(id);
  document.body.insertAdjacentHTML('beforeend', immersiveMarkup);
  const root = new THREE.Group(); scene.add(root); root.visible=false;
  let mode='exhibit', step=0, paused=false, phase=0, angle=0, clock=0, linear=false, lowDetail=false;
  const fusion = new FusionExperiment();
  let tokens=[], product=null, target=null, binaryStars=[], orbitLines=[], core=null, shock=null, debris=null, energy=[];
  const held=new Map(); let mouseHeld=null, pointerId=null;
  const ray=new THREE.Raycaster(), pointer=new THREE.Vector2(), rotation=new THREE.Matrix4();
  const hitPoint=new THREE.Vector3(), dragPlane=new THREE.Plane(new THREE.Vector3(0,0,1),3);
  const saved={position:camera.position.clone(), target:controls.target.clone(), min:controls.minDistance,max:controls.maxDistance};
  const names={exhibit:'Stellar exhibit',onboarding:'Learn the VR controls',walk:'Inside the Sun',fusion:'Hands-on fusion',binary:'Binary-star lab',replay:'Supernova replay',room:'Comparison room'};
  function clear() {
    dropAll(); root.traverse(object=>{object.geometry?.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];for(const material of materials){material?.map?.dispose();material?.dispose();}});
    root.clear(); root.position.set(0,0,0); tokens=[];energy=[];binaryStars=[];orbitLines=[];product=null;target=null;
  }
  function ball(radius,color,parent=root) {
    const object=new THREE.Mesh(new THREE.SphereGeometry(radius,lowDetail?20:40,lowDetail?12:28),new THREE.MeshBasicMaterial({color}));parent.add(object);return object;
  }
  function label(text,x,y,z,width=2.8) {
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=160;
    const context=canvas.getContext('2d');context.fillStyle='#0c1b2ee8';context.fillRect(0,0,1024,160);context.fillStyle='#f8ddb3';context.font='bold 38px sans-serif';context.textAlign='center';context.fillText(text,512,93,990);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false}));sprite.scale.set(width,width*160/1024,1);sprite.position.set(x,y,z);root.add(sprite);return sprite;
  }
  function ring(radius,color) {
    const points=Array.from({length:129},(_,i)=>new THREE.Vector3(Math.cos(i/128*Math.PI*2)*radius,0,Math.sin(i/128*Math.PI*2)*radius));
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color}));root.add(line);return line;
  }
  function buildWalk() {
    interiorStops.forEach((stop,i)=>{
      const chamber=ball(4,stop.color);chamber.material.side=THREE.BackSide;chamber.material.transparent=true;chamber.material.opacity=.18;chamber.position.set(i*10,1.6,0);
      const grid=new THREE.GridHelper(7,14,stop.color,'#24344a');grid.position.set(i*10,0,0);root.add(grid);
      label(stop.name,i*10,3.4,-3,4);
      for(let j=0;j<(lowDetail?20:60);j++){const p=ball(.035,stop.color);p.userData={room:i,index:j};energy.push(p);}
    });
    root.position.x=-step*10;
  }
  function buildFusion() {
    target=new THREE.Mesh(new THREE.TorusGeometry(.55,.035,8,64),new THREE.MeshBasicMaterial({color:'#e7c087'}));target.position.set(0,2.3,-3);root.add(target);
    label('REACTION ZONE',0,3.12,-3,2);
    const data=fusionSteps[fusion.step];
    tokens=data.inputs.map((name,i)=>{
      const token=ball(.2,i?'#9fcaff':'#ffc375');token.position.set(i?1.1:-1.1,2.3,-3);token.userData.index=i;token.userData.home=token.position.clone();
      const caption=label(name,token.position.x,2.72,-3,.8);token.userData.caption=caption;return token;
    });
    product=ball(.29,'#ffeaa6');product.position.copy(target.position);product.visible=false;
  }
  function buildBinary() {
    binaryStars=[ball(.25,'#ffc375'),ball(.32,'#a9d6ff')];
    orbitLines=[ring(1,'#8b724c'),ring(1,'#506b8e')];
    const cross=new THREE.AxesHelper(.22);cross.position.set(0,1.7,-5);root.add(cross);
    label('Shared centre of mass',0,3.2,-5,3.5);updateBinary();
  }
  function binaryValues() {return {a:Number($('binaryMassA').value),b:Number($('binaryMassB').value),distance:Number($('binarySeparation').value)};}
  function updateBinary() {
    const {a,b,distance}=binaryValues(), orbit=binaryOrbit(a,b,distance,angle), units=.65;
    if(binaryStars.length){
      binaryStars[0].position.set(orbit.first[0]*units,1.7,orbit.first[1]*units-5);
      binaryStars[1].position.set(orbit.second[0]*units,1.7,orbit.second[1]*units-5);
      binaryStars[0].scale.setScalar(Math.pow(a,.3));binaryStars[1].scale.setScalar(Math.pow(b,.3));
      orbitLines.forEach((line,i)=>{line.scale.setScalar((i?orbit.r2:orbit.r1)*units);line.position.set(0,1.7,-5);});
    }
    $('binaryMassAValue').textContent=a+' M☉';$('binaryMassBValue').textContent=b+' M☉';$('binarySeparationValue').textContent=distance.toFixed(1)+' AU';
    return orbit;
  }
  function buildReplay() {
    core=ball(1.6,'#ff985a');core.position.set(0,2,-5);
    shock=new THREE.Mesh(new THREE.SphereGeometry(1,40,24),new THREE.MeshBasicMaterial({color:'#8ecaff',transparent:true,opacity:.3,wireframe:true}));shock.position.copy(core.position);root.add(shock);
    const points=[];for(let i=0;i<(lowDetail?600:2200);i++){const y=1-2*(i+.5)/(lowDetail?600:2200),a=i*2.399963,r=Math.sqrt(1-y*y);points.push(r*Math.cos(a),y,r*Math.sin(a));}
    debris=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(points,3)),new THREE.PointsMaterial({color:'#ffc080',size:.045,transparent:true,opacity:.8}));debris.position.copy(core.position);root.add(debris);
    label('Illustrative core-collapse replay',0,4.3,-5,4);
  }
  function buildRoom() {
    ['sun','dwarf','neutron','hole'].forEach((key,i)=>{
      const object=scaleObjects[key],x=(i-1.5)*2.5;
      const radius=linear?1.0*object.km/scaleObjects.sun.km:.72;
      const sphere=ball(radius,object.color);sphere.position.set(x,2.1,-5);
      const stand=new THREE.GridHelper(1.8,6,'#768faa','#263a50');stand.position.set(x,.1,-5);root.add(stand);
      label(object.name,x,3.5,-5,2.3);label(object.km.toLocaleString()+' km diameter',x,3.1,-5,2.2);
    });
  }
  function rebuild() {clear();if(mode==='walk')buildWalk();if(mode==='fusion')buildFusion();if(mode==='binary')buildBinary();if(mode==='replay')buildReplay();if(mode==='room')buildRoom();}
  function setMode(next) {
    if(!Object.hasOwn(names,next))return;
    if(mode==='exhibit'&&next!=='exhibit'){saved.position.copy(camera.position);saved.target.copy(controls.target);saved.min=controls.minDistance;saved.max=controls.maxDistance;}
    mode=next;step=0;phase=0;angle=0;paused=false;fusion.reset();
    clear();root.visible=mode!=='exhibit'&&mode!=='onboarding';
    $('immersiveMenu').close();$('immersiveHUD').hidden=mode==='exhibit';$('app').classList.toggle('immersive-active',mode!=='exhibit');$('openImmersive')?.setAttribute('aria-pressed',String(mode!=='exhibit'));if(mode!=='exhibit')$('openJunior')?.setAttribute('aria-pressed','false');
    onMode(mode);view();rebuild();sync();
  }
  function view() {
    if(renderer.xr.isPresenting)return;
    controls.enabled=true;
    if(mode==='exhibit'||mode==='onboarding') {camera.position.copy(saved.position);controls.target.copy(saved.target);controls.minDistance=saved.min;controls.maxDistance=saved.max;}
    else if(mode==='walk') {camera.position.set(0,1.6,.1);controls.target.set(0,1.6,-3);controls.minDistance=.1;controls.maxDistance=8;}
    else {const narrow=camera.aspect<.8;const distance=narrow?(mode==='room'?18:mode==='binary'?14:6):3;camera.position.set(0,2.8,distance);controls.target.set(0,2,-4);controls.minDistance=2;controls.maxDistance=30;}
    controls.update();
  }
  function getText() {
    if(mode==='onboarding')return {description:`Step ${step+1}/${onboardingSteps.length}: ${onboardingSteps[step]}`,detail:'Practise on the original star. You can also read these controls before entering a headset.',hint:'Use Next and Previous to revisit each instruction.'};
    if(mode==='walk')return {description:interiorStops[step].name,detail:interiorStops[step].text,hint:'Next / Previous teleport between enlarged chambers. Physical headset movement works within your play area. Layers are separated and enlarged for teaching.'};
    if(mode==='fusion')return {description:`Step ${fusion.step+1}/${fusionSteps.length}: ${fusionSteps[fusion.step].reaction}`,detail:fusion.complete?fusionSteps[fusion.step].product+'. '+fusionSteps[fusion.step].note:`Move both labelled nuclei into the ring (${fusion.inserted.size}/2 placed).`,hint:'Drag with mouse/touch. In VR, point and grip a nucleus; release it in the ring. “Place nucleus” provides the same action without dragging. No reaction rates or tunnelling are simulated.'};
    if(mode==='binary'){const orbit=updateBinary();return {description:`Orbital period: ${orbit.period.toFixed(2)} years`,detail:'Circular two-body orbit: P² = a³ / (M₁ + M₂), using years, AU and solar masses. The heavier star travels on the smaller orbit.',hint:'Motion is accelerated (one model year per 12 seconds). Stellar radii are illustrative. VR Previous / Next changes separation; the action button cycles mass pairs.'};}
    if(mode==='replay')return {description:phase<.35?'Core contracts':phase<.5?'Collapse and shock launch':'Shock and ejecta expand',detail:`Replay ${Math.round(phase*100)}% · ${paused?'Paused':'Playing'} · ${$('replaySpeed').value}× speed.`,hint:'An illustrative sequence, not a hydrodynamic calculation. Use Previous / Next to step 5%, Pause to inspect, or scrub the slider.'};
    if(mode==='room')return {description:linear?'Same linear diameter scale':'Compact objects enlarged independently',detail:(linear?'The Sun sets the scale; small remnants may be invisible. ':'Display sizes are not proportional. ')+'Diameters: Sun 1,392,700 km · white dwarf example 12,742 km · neutron star example 24 km · black-hole horizon example 59 km.',hint:'Switch scale with the action button. The black-hole size is its non-rotating event horizon, not a material surface.'};
    return {description:'',detail:'',hint:''};
  }
  function sync() {
    const text=getText();$('immersiveModeTitle').textContent=names[mode];$('immersiveDescription').textContent=text.description;$('immersiveDetail').textContent=text.detail;$('immersiveHint').textContent=text.hint;
    $('binaryControls').hidden=mode!=='binary';$('replayControls').hidden=mode!=='replay';
    $('replayPosition').value=Math.round(phase*1000);
    $('immersivePrevious').disabled=mode==='fusion'||mode==='room';
    $('immersiveNext').disabled=mode==='fusion'&&!fusion.complete||mode==='room';
    $('immersiveNext').textContent=mode==='fusion'?(fusion.finished?'Restart chain':'Next reaction'):mode==='onboarding'&&step===4?'Finish tutorial':'Next';
    $('immersiveAction').textContent=mode==='fusion'?'Place nucleus':mode==='room'?(linear?'Enlarge remnants':'Use linear scale'):mode==='binary'?'Cycle mass pair':mode==='onboarding'?'Reset exhibit':paused?'Play':'Pause';
  }
  function next(delta=1) {
    if(mode==='onboarding'){if(step===4&&delta>0){setMode('exhibit');return;}step=THREE.MathUtils.clamp(step+delta,0,4);}
    if(mode==='walk'){step=THREE.MathUtils.clamp(step+delta,0,2);root.position.x=-step*10;}
    if(mode==='fusion'){if(fusion.finished){fusion.reset();rebuild();}else if(fusion.next())rebuild();}
    if(mode==='binary'){$('binarySeparation').value=THREE.MathUtils.clamp(Number($('binarySeparation').value)+delta*.5,.5,10);}
    if(mode==='replay'){paused=true;phase=THREE.MathUtils.clamp(phase+delta*.05,0,1);}
    sync();
  }
  function deposit(index) {
    if(mode!=='fusion'||!fusion.insert(index))return;
    const token=tokens[index];if(token){root.attach(token);token.visible=false;token.userData.caption.visible=false;}
    if(fusion.complete){product.visible=true;target.material.color.set('#9cf1c4');}
    sync();
  }
  function action() {
    if(mode==='fusion'){const index=[0,1].find(i=>!fusion.inserted.has(i));if(index!==undefined)deposit(index);}
    else if(mode==='room'){linear=!linear;rebuild();}
    else if(mode==='binary'){const a=Number($('binaryMassA').value);const pair=a===1?[5,10]:a===5?[15,5]:[1,1];$('binaryMassA').value=pair[0];$('binaryMassB').value=pair[1];}
    else if(mode==='onboarding')onMode('onboarding');
    else paused=!paused;
    sync();
  }
  function reset() {step=0;phase=0;angle=0;paused=false;fusion.reset();rebuild();if(mode==='onboarding')onMode('onboarding');view();sync();}
  function aim(controller) {controller.updateWorldMatrix(true,false);rotation.extractRotation(controller.matrixWorld);ray.ray.origin.setFromMatrixPosition(controller.matrixWorld);ray.ray.direction.set(0,0,-1).applyMatrix4(rotation);}
  function drop(controller) {
    const token=held.get(controller);if(!token)return;
    root.attach(token);held.delete(controller);
    if(token.position.distanceTo(target.position)<.75)deposit(token.userData.index);else token.position.copy(token.userData.home);
    token.userData.caption.visible=!fusion.inserted.has(token.userData.index);
  }
  function dropAll(){
    // Leaving or rebuilding a lab cancels held objects without advancing a reaction.
    for(const token of held.values()){root.attach(token);token.position.copy(token.userData.home);}held.clear();
    if(mouseHeld){mouseHeld.position.copy(mouseHeld.userData.home);mouseHeld=null;}
    if(pointerId!==null&&renderer.domElement.hasPointerCapture(pointerId))renderer.domElement.releasePointerCapture(pointerId);pointerId=null;
    controls.enabled=!renderer.xr.isPresenting;
  }
  controllers.forEach((controller,i)=>{
    controller.addEventListener('squeezestart',()=>{
      if(mode!=='fusion')return;aim(controller);
      const token=ray.intersectObjects(tokens.filter(t=>t.visible&&!heldHas(t)),false)[0]?.object;
      if(token){renderer.xr.getControllerGrip(i).attach(token);held.set(controller,token);token.userData.caption.visible=false;}
    });
    controller.addEventListener('squeezeend',()=>drop(controller));
    controller.addEventListener('disconnected',()=>drop(controller));
  });
  function heldHas(token){return [...held.values()].includes(token);}
  function pointerRay(event){const bounds=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1);ray.setFromCamera(pointer,camera);}
  renderer.domElement.addEventListener('pointerdown',event=>{
    if(mode!=='fusion'||renderer.xr.isPresenting)return;pointerRay(event);const hit=ray.intersectObjects(tokens.filter(t=>t.visible),false)[0];if(!hit)return;
    event.stopImmediatePropagation();mouseHeld=hit.object;pointerId=event.pointerId;controls.enabled=false;renderer.domElement.setPointerCapture(pointerId);
  },true);
  renderer.domElement.addEventListener('pointermove',event=>{
    if(!mouseHeld)return;pointerRay(event);if(ray.ray.intersectPlane(dragPlane,hitPoint)){root.worldToLocal(hitPoint);mouseHeld.position.copy(hitPoint);mouseHeld.userData.caption.position.set(hitPoint.x,hitPoint.y+.42,hitPoint.z);}
  });
  function finishPointer(event) {
    if(!mouseHeld)return;const token=mouseHeld;mouseHeld=null;controls.enabled=true;
    if(event.type!=='pointercancel'&&token.position.distanceTo(target.position)<.75)deposit(token.userData.index);else{token.position.copy(token.userData.home);token.userData.caption.position.copy(token.position).y+=.42;}
    if(renderer.domElement.hasPointerCapture(pointerId))renderer.domElement.releasePointerCapture(pointerId);pointerId=null;
  }
  renderer.domElement.addEventListener('pointerup',finishPointer);renderer.domElement.addEventListener('pointercancel',finishPointer);
  renderer.xr.addEventListener('sessionstart',()=>{dropAll();if(mode!=='exhibit')sync();});
  renderer.xr.addEventListener('sessionend',()=>{dropAll();view();});
  $('openImmersive').onclick=()=>{$('immersiveMenu').showModal();};$('closeImmersiveMenu').onclick=()=>$('immersiveMenu').close();
  document.querySelectorAll('[data-enter-lab]').forEach(button=>button.onclick=()=>setMode(button.dataset.enterLab));
  $('leaveImmersive').onclick=()=>setMode('exhibit');$('immersivePrevious').onclick=()=>next(-1);$('immersiveNext').onclick=()=>next();$('immersiveAction').onclick=action;$('immersiveReset').onclick=reset;
  for(const id of ['binaryMassA','binaryMassB','binarySeparation'])$(id).oninput=()=>sync();
  $('replayPosition').oninput=()=>{phase=Number($('replayPosition').value)/1000;paused=true;sync();};$('replaySpeed').onchange=sync;
  function applyQuality(){const value=$('graphicsQuality').value;lowDetail=value==='low';quality(value);$('graphicsNote').textContent=value==='low'?'Reduced particle counts and render resolution.':value==='high'?'Full particles and higher render resolution.':'Moderate resolution with full teaching effects.';try{localStorage.setItem('stellar-quality',value);}catch{}if(mode!=='exhibit'&&mode!=='onboarding')rebuild();}
  $('graphicsQuality').onchange=applyQuality;try{const savedQuality=localStorage.getItem('stellar-quality');if(['low','balanced','high'].includes(savedQuality))$('graphicsQuality').value=savedQuality;}catch{}applyQuality();setupOffline();
  let lastSync=0;
  return {
    get mode(){return mode;},get active(){return mode!=='exhibit';},setMode,reframe:view,
    getState:()=>({mode,step,fusionStep:fusion.step,placed:fusion.inserted.size,fusionComplete:fusion.finished,phase,paused,linear,binary:binaryValues(),quality:$('graphicsQuality').value}),
    update(dt,motion) {
      if(!paused)clock+=dt*motion;
      if(mode==='walk'&&!paused)energy.forEach((p,i)=>{const room=p.userData.room,t=clock+i*.37;if(room===0){const r=(t*.5)%3;p.position.set(Math.cos(i*2.4)*r,1.6+Math.sin(i*1.6)*r*.5,Math.sin(i*2.4)*r);}if(room===1)p.position.set(Math.sin(t*.8+i)*2.6,1.6+Math.sin(t*1.3+i*2)*1.6,Math.cos(t*.9+i*.7)*2.6);if(room===2)p.position.set(Math.cos(t*.6+i)*2.4,1.6+Math.sin(t*.6+i)*1.5,Math.sin(i*3)*2);p.position.x+=room*10;p.visible=p.position.clone().add(root.position).distanceTo(camera.position)>.8;});
      if(mode==='binary'){const orbit=updateBinary();if(!paused)angle=(angle+dt*motion*Math.PI*2/(12*orbit.period))%(Math.PI*2);}
      if(mode==='replay'){
        if(!paused){phase=Math.min(1,phase+dt*Number($('replaySpeed').value)/20);if(phase===1)paused=true;}
        const collapse=THREE.MathUtils.smoothstep(phase,0,.35),expansion=THREE.MathUtils.smoothstep(phase,.35,1);
        core.scale.setScalar(1-collapse*.87);core.material.color.set(phase<.35?'#ff985a':'#b4dbff');shock.visible=phase>=.35;shock.scale.setScalar(.3+expansion*5);shock.material.opacity=.4*(1-expansion*.7);debris.visible=phase>=.35;debris.scale.setScalar(.3+expansion*5);
      }
      if(mode==='fusion'&&product?.visible)product.scale.setScalar(1+Math.sin(clock*3)*.05);
      lastSync+=dt;if(mode==='replay'&&lastSync>.15){sync();lastSync=0;}
    },
    drawPanel(context) {
      const text=getText();context.fillStyle='#0d1b2d';context.fillRect(0,0,1400,880);context.fillStyle='#edc38b';context.font='bold 40px sans-serif';context.fillText(names[mode],45,65);
      function wrap(value,y,size=29){context.font=size+'px sans-serif';let line='';for(const word of value.split(' ')){if(context.measureText(line+word).width>1300){context.fillText(line,45,y);line='';y+=size*1.4;}line+=word+' ';}context.fillText(line,45,y);return y+size*1.5;}
      context.fillStyle='#f7e2bf';let y=wrap(text.description,125,34);context.fillStyle='#c1d1e8';y=wrap(text.detail,y+10);wrap(text.hint,y+18,24);
      const primary=[['Previous',()=>next(-1)],['Next',()=>next()],[$('immersiveAction').textContent,action],['Reset',reset]];
      primary.forEach(([name],i)=>{context.fillStyle='#29405c';context.fillRect(30+i*343,580,325,78);context.fillStyle='#fff';context.font='26px sans-serif';context.fillText(name,45+i*343,628);});
      const modes=['onboarding','walk','fusion','binary','replay','room','exhibit'];
      modes.forEach((key,i)=>{context.fillStyle=key===mode?'#795e3b':'#22344e';context.fillRect(25+i*196,690,183,65);context.fillStyle='#fff';context.font='23px sans-serif';context.fillText(['Tutorial','Inside Sun','Fusion','Binary','Replay','Compare','Exit lab'][i],35+i*196,731);});
      if(mode==='replay') ['0.25','0.5','1'].forEach((speed,i)=>{context.fillStyle=$('replaySpeed').value===speed?'#795e3b':'#22344e';context.fillRect(30+i*450,775,420,50);context.fillStyle='#fff';context.font='23px sans-serif';context.fillText(speed+'× replay speed',50+i*450,808);});
      context.fillStyle='#94acc9';context.font='22px sans-serif';context.fillText('Use triggers for panel controls · Grip nuclei in the fusion lab',45,860);
    },
    panelClick(x,y,controller) {
      if(controller.userData.clicked)return;
      if(mode==='replay'&&y>=775&&y<=825){const i=Math.floor((x-30)/450);if(i>=0&&i<3){$('replaySpeed').value=['0.25','0.5','1'][i];sync();controller.userData.clicked=true;return;}}
      if(y>=580&&y<=658){const i=Math.floor((x-30)/343);if(i>=0&&i<4){[()=>next(-1),()=>next(),action,reset][i]();controller.userData.clicked=true;}}
      if(y>=690&&y<=755){const i=Math.floor((x-25)/196);if(i>=0&&i<7){setMode(['onboarding','walk','fusion','binary','replay','room','exhibit'][i]);controller.userData.clicked=true;}}
    }
  };
}
