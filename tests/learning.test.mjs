import test from 'node:test';
import assert from 'node:assert/strict';
import {massExample, missions, questions, scaleObjects} from '../learning-data.js';
import * as THREE from '../three.module.js';
import {createVRLab} from '../vr-lab.js';

test('mass estimates preserve teaching anchors and decrease with mass', () => {
  assert.ok(Math.abs(massExample(1).lifetime - 10000) < 1e-8);
  assert.ok(Math.abs(massExample(15).lifetime - 11) < 1e-8);
  assert.ok(Math.abs(massExample(30).lifetime - 5) < 1e-8);
  for (let m = 2; m <= 30; m++) assert.ok(massExample(m).lifetime < massExample(m - 1).lifetime);
  assert.equal(massExample(-50).mass, 1); assert.equal(massExample(99).mass, 30);
});
test('missions require the intended layer and stellar chapter', () => {
  const core = {star:'sun', stageIndex:2, inside:true, layer:2};
  assert.equal(missions[0].check(core), true);
  assert.equal(missions[0].check({...core, inside:false}), false);
  assert.equal(missions[0].check({...core, layer:0}), false);
  assert.equal(missions[1].check({star:'massive', stageIndex:3, inside:true, layer:4}), true);
  assert.equal(missions[2].check({star:'heavy', stageIndex:5}), true);
});
test('quiz answers and scale references remain valid', () => {
  for(const item of questions) assert.ok(item.options[item.answer]);
  assert.equal(scaleObjects.earth.km, scaleObjects.dwarf.km);
  assert.ok(scaleObjects.neutron.km < scaleObjects.earth.km);
});
test('VR grips preserve world placement, resize within bounds and reset cleanly', () => {
  const xr = new THREE.EventDispatcher(); xr.isPresenting = true;
  const scene = new THREE.Scene(), system = new THREE.Group();
  const controllers = [new THREE.Group(), new THREE.Group()];
  const grips = [new THREE.Group(), new THREE.Group()];
  xr.getControllerGrip = i => grips[i];
  controllers.forEach(c => scene.add(c)); scene.add(system); system.position.set(0,2,-9);
  controllers.forEach(c => c.position.y = 2); grips.forEach(g => g.position.y = 2);
  const lab = createVRLab({renderer:{xr},scene,system,controllers});
  scene.updateMatrixWorld(true); const before = system.getWorldPosition(new THREE.Vector3());
  controllers[0].dispatchEvent({type:'squeezestart'});
  assert.equal(system.parent, grips[0]);
  assert.ok(system.getWorldPosition(new THREE.Vector3()).distanceTo(before) < 1e-6);
  controllers[0].dispatchEvent({type:'connected',data:{gamepad:{axes:[0,0,0,-1]}}});
  lab.update(1); assert.equal(system.scale.x, 2);
  controllers[0].dispatchEvent({type:'squeezeend'}); assert.equal(system.parent, scene);
  lab.reset(); assert.equal(system.scale.x, 1); assert.deepEqual(system.position.toArray(), [0,2,-9]);
  grips[0].position.x = -.2; grips[1].position.x = .2;
  scene.updateMatrixWorld(true);
  controllers[0].dispatchEvent({type:'squeezestart'}); controllers[1].dispatchEvent({type:'squeezestart'});
  lab.update(.01); grips[0].position.x = -.4; grips[1].position.x = .4;
  scene.updateMatrixWorld(true); lab.update(.01); assert.equal(system.scale.x, 2);
  controllers[0].dispatchEvent({type:'disconnected'}); assert.equal(system.parent, scene);
  xr.isPresenting = false; xr.dispatchEvent({type:'sessionend'});
  assert.deepEqual(system.position.toArray(), [0,1.6,0]); assert.equal(system.scale.x, 1);
});
