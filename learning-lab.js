import {massExample, questions, missions, scaleObjects} from './learning-data.js';

export function createLearningLab(api) {
  const $ = id => document.getElementById(id);
  const dialog = $('learningLab');
  let quizIndex = 0, score = 0, answered = false, missionIndex = 0;
  const completed = new Set();
  const tabNames = ['explore', 'compare', 'fusion', 'scale', 'quiz', 'missions', 'teacher', 'access'];
  function tab(name) {
    for (const key of tabNames) {
      $(`lab-${key}`).hidden = key !== name;
      $(`tab-${key}`).setAttribute('aria-selected', String(key === name));
      $(`tab-${key}`).tabIndex = key === name ? 0 : -1;
    }
    if (name === 'scale') drawScale();
  }
  $('openLab').onclick = () => { api.pause(); dialog.showModal(); drawScale(); };
  $('closeLab').onclick = () => dialog.close();
  for (const name of tabNames) {
    const button = $(`tab-${name}`);
    button.onclick = () => tab(name);
    button.onkeydown = e => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const i = tabNames.indexOf(name);
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabNames.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabNames.length) % tabNames.length;
      tab(tabNames[next]); $(`tab-${tabNames[next]}`).focus();
    };
  }
  function mass() {
    const result = massExample($('labMass').value);
    $('massValue').textContent = `${result.mass} solar masses`;
    $('massResult').textContent = `Illustrative main-sequence duration: ${result.lifetime >= 1000 ? (result.lifetime / 1000).toFixed(1) + ' billion' : result.lifetime.toFixed(1) + ' million'} years. Explore the ${result.track === 'sun' ? 'Sun-like' : result.track === 'massive' ? '15-solar-mass' : '30-solar-mass'} example next.`;
  }
  $('labMass').oninput = mass; mass();
  $('applyMass').onclick = () => { api.choose(massExample($('labMass').value).track); api.seek(.4); dialog.close(); };
  const objectNotes = {
    binary: 'Two stars orbit a shared centre of mass. Close companions can exchange material and change each other’s evolution.',
    brown: 'Brown dwarfs form from collapsing gas, but lack enough mass to sustain ordinary hydrogen fusion like main-sequence stars.',
    collision: 'Dense stellar environments can bring stars into close encounters. Some encounters merge objects; the outcome depends on their properties and orbit.'
  };
  $('extraObject').onchange = () => {
    const value = $('extraObject').value;
    $('objectNote').textContent = objectNotes[value];
    $('objectSketch').dataset.object = value;
    $('objectSketch').setAttribute('aria-label', $('extraObject').selectedOptions[0].textContent + ' illustrative diagram');
  }; $('extraObject').onchange();
  const comparison = {
    sun: { name: 'Sun-like', mass: '1', temperature: '≈ 5,800 K', life: '≈ 10 billion years', end: 'White dwarf', color: '#ffc375', diameter: 90 },
    massive: { name: 'Massive', mass: '15', temperature: '≈ 30,000 K', life: '≈ 11 million years', end: 'Neutron star example', color: '#b6d9ff', diameter: 145 },
    heavy: { name: 'Very massive', mass: '30', temperature: '≈ 40,000 K', life: '≈ 5 million years', end: 'Black hole example', color: '#91bdff', diameter: 170 }
  };
  function compare() {
    $('comparisonCards').replaceChildren(...['compareA', 'compareB'].map(id => {
      const item = comparison[$(id).value];
      const card = document.createElement('article');
      const ball = document.createElement('div'); ball.className = 'comparisonStar'; ball.style.setProperty('--star-color', item.color); ball.style.width = ball.style.height = item.diameter + 'px'; ball.setAttribute('aria-hidden', 'true');
      const title = document.createElement('h3'); title.textContent = item.name;
      const text = document.createElement('p'); text.textContent = `${item.mass} solar masses · ${item.temperature}\nMain sequence: ${item.life}\nDestination: ${item.end}`;
      card.append(ball, title, text); return card;
    }));
  }
  $('compareA').onchange = $('compareB').onchange = compare; compare();
  let fuel = 0;
  $('addHydrogen').onclick = () => {
    if (fuel === 4) fuel = 0;
    fuel++;
    $('fusionParticles').replaceChildren(...Array.from({length: fuel === 4 ? 1 : fuel}, () => {
      const particle = document.createElement('span'); particle.textContent = fuel === 4 ? 'He' : 'H'; return particle;
    }));
    $('fusionParticles').classList.toggle('released', fuel === 4);
    $('fusionResult').textContent = fuel === 4 ? 'Helium formed! Energy is released as light, particle motion and neutrinos. This is a net reaction; real fusion takes several steps.' : `${fuel} of 4 hydrogen nuclei collected. Add another nucleus.`;
    $('addHydrogen').textContent = fuel === 4 ? 'Start another reaction' : 'Add hydrogen nucleus';
  };
  function drawScale() {
    const a = scaleObjects[$('scaleA').value], b = scaleObjects[$('scaleB').value];
    const svg = $('scaleDrawing'); svg.replaceChildren();
    const max = Math.max(a.km, b.km);
    [a, b].forEach((item, i) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', String(150 + i * 300)); circle.setAttribute('cy', '115'); circle.setAttribute('r', String(95 * item.km / max)); circle.setAttribute('fill', item.color); svg.append(circle);
    });
    $('scaleResult').textContent = `${a.name}: ${a.km.toLocaleString()} km across. ${b.name}: ${b.km.toLocaleString()} km across. Diameter ratio ${Math.max(a.km, b.km) / Math.min(a.km, b.km) < 10 ? (Math.max(a.km, b.km) / Math.min(a.km, b.km)).toFixed(2) : Math.round(Math.max(a.km, b.km) / Math.min(a.km, b.km)).toLocaleString()}:1. Both circles use the same linear scale; the smaller may be too small to see.`;
  }
  $('scaleA').onchange = $('scaleB').onchange = drawScale; drawScale();
  function quiz() {
    answered = false; const item = questions[quizIndex];
    $('quizQuestion').textContent = `${quizIndex + 1}/${questions.length} · ${item.q}`;
    $('quizFeedback').textContent = ''; $('quizNext').disabled = true;
    $('quizScore').textContent = `Score: ${score}/${questions.length}`;
    $('quizOptions').replaceChildren(...item.options.map((option, i) => {
      const button = document.createElement('button'); button.textContent = option;
      button.onclick = () => {
        if (answered) return; answered = true;
        const correct = i === item.answer; if (correct) score++;
        $('quizFeedback').textContent = `${correct ? 'Correct.' : 'Try this explanation:'} ${item.why}`;
        for (const child of $('quizOptions').children) child.disabled = true;
        $('quizOptions').children[item.answer].classList.add('correct');
        $('quizScore').textContent = `Score: ${score}/${questions.length}`; $('quizNext').disabled = false;
        $('quizNext').textContent = quizIndex === questions.length - 1 ? 'Restart quiz' : 'Next question';
      }; return button;
    }));
  }
  $('quizNext').onclick = () => { quizIndex++; if (quizIndex === questions.length) { quizIndex = 0; score = 0; } quiz(); }; quiz();
  function mission() {
    $('missionTitle').textContent = missions[missionIndex].title;
    $('missionHint').textContent = missions[missionIndex].hint;
    $('missionProgress').textContent = `${completed.size}/${missions.length} missions complete`;
    $('missionFeedback').textContent = completed.has(missionIndex) ? 'Completed.' : 'Explore the scene, then check your discovery.';
  }
  $('missionSelect').onchange = () => { missionIndex = Number($('missionSelect').value); mission(); };
  $('missionExplore').onclick = () => { dialog.close(); api.status(missions[missionIndex].hint); };
  $('missionCheck').onclick = () => { if (missions[missionIndex].check(api.state())) { completed.add(missionIndex); mission(); } else $('missionFeedback').textContent = 'Keep exploring. ' + missions[missionIndex].hint; };
  mission();
  $('lessonStart').onclick = () => {
    const lesson = $('lesson').value;
    api.pause(); api.choose(lesson === 'remnants' ? 'heavy' : 'sun'); api.seek(lesson === 'remnants' ? 1 : .4);
    if (lesson === 'fusion') api.openCore();
    dialog.close(); api.status(lesson === 'fusion' ? 'Discuss: how does energy travel from the core to the surface?' : lesson === 'remnants' ? 'Discuss: how do the three stellar remnants differ?' : 'Discuss: why do massive stars have shorter lives?');
  };
  $('teacherPause').onclick = api.pause;
  $('teacherPlay').onclick = () => { dialog.close(); api.play(); };
  $('teacherQuestion').onchange = () => $('classPrompt').textContent = $('teacherQuestion').value;
  $('teacherQuestion').onchange();
  $('showPrompt').onclick = () => { const banner = $('classBanner'); banner.textContent = $('teacherQuestion').value; banner.hidden = false; dialog.close(); };
  $('hidePrompt').onclick = () => $('classBanner').hidden = true;
  const defaults = { text: 'normal', captions: true, motion: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 100, volume: 80 };
  let settings = {...defaults};
  try { const saved = JSON.parse(localStorage.getItem('stellar-accessibility')); if (saved) settings = {...defaults, ...saved}; } catch {}
  function applySettings(save = true) {
    settings = { text: $('textSize').value, captions: $('showCaptions').checked, motion: Number($('motionLevel').value), volume: Number($('volume').value) };
    document.body.classList.toggle('large-text', settings.text === 'large');
    document.body.classList.toggle('hide-captions', !settings.captions);
    document.body.classList.toggle('still-lab', settings.motion === 0);
    api.settings(settings); $('motionValue').textContent = `${settings.motion}%`; $('volumeValue').textContent = `${settings.volume}%`;
    if (save) try { localStorage.setItem('stellar-accessibility', JSON.stringify(settings)); } catch {}
  }
  $('textSize').value = settings.text === 'large' ? 'large' : 'normal'; $('showCaptions').checked = !!settings.captions;
  $('motionLevel').value = Math.max(0, Math.min(100, Number(settings.motion) || 0)); $('volume').value = Math.max(0, Math.min(100, Number(settings.volume) || 0));
  for (const id of ['textSize', 'showCaptions', 'motionLevel', 'volume']) $(id).oninput = () => applySettings();
  applySettings(false); tab('explore');
}
