// Teaching activities use approximate values, not stellar evolution predictions.
export function massExample(mass) {
  const m = Math.min(30, Math.max(1, Number(mass) || 1));
  const anchors = [[1, 10000], [15, 11], [30, 5]];
  const [a, b] = m <= 15 ? anchors.slice(0, 2) : anchors.slice(1);
  const fraction = (m - a[0]) / (b[0] - a[0]);
  const lifetime = Math.exp(Math.log(a[1]) + fraction * Math.log(b[1] / a[1]));
  const track = m < 8 ? 'sun' : m < 23 ? 'massive' : 'heavy';
  return { mass: m, lifetime, track };
}
export const questions = [
  { q: 'What powers a main-sequence star?', options: ['Hydrogen fusion in its core', 'Burning gas like a fire', 'Reflected light'], answer: 0, why: 'Hydrogen nuclei fuse into helium, releasing energy in the core.' },
  { q: 'Which remnant does the Sun-like track leave?', options: ['Black hole', 'White dwarf', 'Neutron star'], answer: 1, why: 'A single Sun-like star sheds its outer layers and leaves a cooling white dwarf.' },
  { q: 'Why can a massive star have a shorter life?', options: ['It has no fuel', 'It is always cooler', 'It uses its fuel much faster'], answer: 2, why: 'Massive stars consume their larger fuel supplies much more rapidly.' },
  { q: 'Does initial mass guarantee a black-hole ending?', options: ['Yes, always', 'No, other factors matter'], answer: 1, why: 'Composition, mass loss and companions also affect the final remnant.' },
  { q: 'Where can hydrogen fusion continue in a giant?', options: ['A shell around the core', 'Only outside the star', 'Inside an orbiting planet'], answer: 0, why: 'Hydrogen can fuse in a shell after central hydrogen is depleted.' },
  { q: 'How large is a typical neutron star?', options: ['About the size of the Sun', 'Roughly city-sized', 'Larger than a galaxy'], answer: 1, why: 'A neutron star packs stellar mass into an object only tens of kilometres across.' }
];
export const missions = [
  { title: 'Find the hydrogen engine', hint: 'Choose Sun-like → Main sequence → Look inside → Hydrogen-fusing core.', check: s => s.star === 'sun' && s.stageIndex === 2 && s.inside && s.layer === 2 },
  { title: 'Find the iron core', hint: 'Choose Massive → Red supergiant → Look inside → Iron core.', check: s => s.star === 'massive' && s.stageIndex === 3 && s.inside && s.layer === 4 },
  { title: 'Meet a stellar remnant', hint: 'Choose Very massive and travel to the final chapter.', check: s => s.star === 'heavy' && s.stageIndex === 5 }
];
export const scaleObjects = {
  city: { name: 'City reference', km: 20, color: '#91acc4' },
  neutron: { name: 'Neutron star example', km: 24, color: '#accfff' },
  hole: { name: '10-solar-mass black hole horizon', km: 59, color: '#e5ac6c' },
  earth: { name: 'Earth', km: 12742, color: '#60b4e7' },
  dwarf: { name: 'White dwarf example', km: 12742, color: '#ecf3ff' },
  sun: { name: 'Sun', km: 1392700, color: '#ffc375' }
};
