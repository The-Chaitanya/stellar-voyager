import test from 'node:test';
import assert from 'node:assert/strict';
import {binaryOrbit,FusionExperiment,fusionSteps} from '../immersive-data.js';
import fs from 'node:fs';

test('binary orbits keep the barycentre fixed and obey Kepler’s period law',()=>{
  for(const angle of [0,.5,2,5]){
    const orbit=binaryOrbit(5,10,3,angle);
    assert.ok(Math.abs(5*orbit.first[0]+10*orbit.second[0])<1e-10);
    assert.ok(Math.abs(5*orbit.first[1]+10*orbit.second[1])<1e-10);
    assert.equal(orbit.r1+orbit.r2,3);
    assert.ok(Math.abs(orbit.period**2-27/15)<1e-10);
  }
  assert.ok(binaryOrbit(5,10,6).period>binaryOrbit(5,10,3).period);
});
test('fusion requires each distinct input before advancing and finishes five reactions',()=>{
  const fusion=new FusionExperiment();
  assert.equal(fusion.next(),false);
  for(let step=0;step<fusionSteps.length;step++){
    assert.equal(fusion.step,step);assert.equal(fusion.insert(0),true);assert.equal(fusion.insert(0),false);
    assert.equal(fusion.complete,false);assert.equal(fusion.insert(99),false);assert.equal(fusion.insert(1),true);
    assert.equal(fusion.complete,true);
    if(step<4)assert.equal(fusion.next(),true);
  }
  assert.equal(fusion.finished,true);assert.equal(fusion.next(),false);
  fusion.reset();assert.equal(fusion.step,0);assert.equal(fusion.complete,false);
});
test('offline list includes all runtime modules and both narration languages',()=>{
  const root=new URL('../',import.meta.url);
  const assets=JSON.parse(fs.readFileSync(new URL('offline-assets.json',root),'utf8'));
  const required=fs.readdirSync(root).filter(name=>/\.(html|css|js|mp3)$/.test(name)&&name!=='sw.js');
  for(const file of required)assert.ok(assets.includes('./'+file),file+' missing');
  assert.equal(assets.some(a=>a.includes('.git')),false);
  assert.ok(assets.includes('./audio-hi-sun-main.mp3'));assert.ok(assets.includes('./audio-sun-main.mp3'));
});
