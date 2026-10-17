export function binaryOrbit(m1, m2, separation, angle = 0) {
  m1 = Math.max(.1, Number(m1) || 1); m2 = Math.max(.1, Number(m2) || 1);
  const a = Math.max(.1, Number(separation) || 1), total = m1 + m2;
  const r1 = a * m2 / total, r2 = a * m1 / total;
  return {r1, r2, period: Math.sqrt(a ** 3 / total),
    first: [r1 * Math.cos(angle), r1 * Math.sin(angle)],
    second: [-r2 * Math.cos(angle), -r2 * Math.sin(angle)]};
}
export const fusionSteps = [
  {inputs:['p','p'], product:'Deuterium', reaction:'p + p → ²H + positron + neutrino', note:'One proton changes into a neutron. The positron later annihilates with an electron.'},
  {inputs:['²H','p'], product:'Helium-3', reaction:'²H + p → ³He + gamma ray', note:'A proton joins deuterium. Keep this helium-3 nucleus for the final step.'},
  {inputs:['p','p'], product:'Second deuterium', reaction:'p + p → ²H + positron + neutrino', note:'Repeat the first branch to prepare a second helium-3 nucleus.'},
  {inputs:['²H','p'], product:'Second helium-3', reaction:'²H + p → ³He + gamma ray', note:'Two helium-3 nuclei are now available.'},
  {inputs:['³He','³He'], product:'Helium-4 + two protons', reaction:'³He + ³He → ⁴He + p + p', note:'Two protons return to the fuel supply. Net result: four protons become helium-4, with energy and other particles released.'}
];
export class FusionExperiment {
  constructor() { this.reset(); }
  reset() { this.step = 0; this.inserted = new Set(); }
  insert(index) { if (![0,1].includes(index) || this.inserted.has(index)) return false; this.inserted.add(index); return true; }
  get complete() { return this.inserted.size === 2; }
  get finished() { return this.complete && this.step === fusionSteps.length - 1; }
  next() { if (!this.complete || this.finished) return false; this.step++; this.inserted.clear(); return true; }
}
export const interiorStops = [
  {name:'Hydrogen-fusing core', color:'#ffe6a0', text:'Hydrogen fusion releases energy in the core. These enlarged particles illustrate energy leaving the centre.'},
  {name:'Radiative zone', color:'#ffb35c', text:'Radiation transports energy through repeated absorption and re-emission. Photon paths here are accelerated illustrations.'},
  {name:'Convection zone', color:'#e36c40', text:'Hot gas rises and cooler gas sinks, carrying energy toward the visible surface.'}
];
export const onboardingSteps = [
  'Point a controller at the panel and press its trigger. Select Next to continue.',
  'Point at the star and hold a grip. Move and rotate your hand; release to place the exhibit.',
  'Hold both grips and move your hands apart to resize. One grip plus the vertical thumbstick also works.',
  'Use Reset to restore the exhibit. In the interior lab, Next teleports between layers without animated travel.',
  'Ready to explore. Choose a lab from the menu. Stay within your headset’s configured play area.'
];
