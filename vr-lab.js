import * as THREE from './three.module.js';
// Grip manipulation is separate from trigger-based panel selection.
export function createVRLab({renderer, scene, system, controllers, resetStatus, enabled = () => true}) {
  let holder = null, pairDistance = 0, pairScale = 1;
  const ray = new THREE.Raycaster(), rotation = new THREE.Matrix4();
  const center = new THREE.Vector3(), origin = new THREE.Vector3(), other = new THREE.Vector3();
  const sphere = new THREE.Sphere();
  const grips = [];
  for (let i = 0; i < controllers.length; i++) {
    const controller = controllers[i];
    const grip = renderer.xr.getControllerGrip(i); scene.add(grip); grips.push(grip);
    controller.addEventListener('connected', event => controller.userData.inputSource = event.data);
    controller.addEventListener('disconnected', () => { controller.userData.inputSource = null; controller.userData.gripping = false; if (holder === controller) release(); });
    controller.addEventListener('squeezestart', () => {
      if (!renderer.xr.isPresenting || !enabled()) return;
      controller.updateWorldMatrix(true, false);
      rotation.extractRotation(controller.matrixWorld);
      ray.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      ray.ray.direction.set(0,0,-1).applyMatrix4(rotation);
      system.getWorldPosition(center);
      sphere.set(center, 2.7 * system.getWorldScale(other).x);
      if (!holder && ray.ray.intersectsSphere(sphere)) {
        grip.attach(system); holder = controller; controller.userData.gripping = true;
      } else if (holder) controller.userData.gripping = true;
    });
    controller.addEventListener('squeezeend', () => {
      controller.userData.gripping = false; pairDistance = 0;
      if (holder === controller) release();
    });
  }
  function release() {
    scene.attach(system); holder = null; pairDistance = 0;
    for (const c of controllers) c.userData.gripping = false;
    // Keep a released object in a comfortable inspection range.
    if (renderer.xr.isPresenting) {
      system.position.x = THREE.MathUtils.clamp(system.position.x, -5, 5);
      system.position.y = THREE.MathUtils.clamp(system.position.y, .7, 5);
      system.position.z = THREE.MathUtils.clamp(system.position.z, -14, -4);
    }
  }
  function reset() {
    release(); system.quaternion.identity(); system.scale.setScalar(1);
    system.position.set(0, renderer.xr.isPresenting ? 2 : 1.6, renderer.xr.isPresenting ? -9 : 0);
    resetStatus?.();
  }
  renderer.xr.addEventListener('sessionend', reset);
  return {reset, update(dt) {
    if (!holder || !enabled()) return;
    const hands = controllers.filter(c => c.userData.gripping);
    if (hands.length === 2) {
      grips[0].getWorldPosition(origin); grips[1].getWorldPosition(other);
      const distance = origin.distanceTo(other);
      if (!pairDistance) { pairDistance = Math.max(.08, distance); pairScale = system.scale.x; }
      system.scale.setScalar(THREE.MathUtils.clamp(pairScale * distance / pairDistance, .25, 2));
    } else {
      pairDistance = 0;
      const axes = holder.userData.inputSource?.gamepad?.axes || [];
      const axis = axes.length >= 4 ? axes[3] : axes[1] || 0;
      if (Math.abs(axis) > .15) system.scale.setScalar(THREE.MathUtils.clamp(system.scale.x * Math.exp(-axis * dt), .25, 2));
    }
  }};
}
