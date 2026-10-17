# Stellar Voyager

An interactive 3D stellar life-cycle exhibit for a science fair, with immersive WebXR VR support.

Choose a Sun-like, massive, or very massive star. Scrub the stage-based timeline, play or pause the journey, and orbit the animated scene. The science notes explain approximate ages, compressed scales, and the possible stellar-remnant outcomes.

## GitHub Pages

This is a static site: no build or API keys are required. In the repository's **Settings → Pages**, choose **Deploy from a branch**, then **main** and **/(root)**. Save and wait for the Pages deployment to finish.

## Local preview

Run `python -m http.server 8000` in this folder, then open `http://localhost:8000`. ES modules need an HTTP server; opening index.html directly is not supported.

## VR

Open the HTTPS site in a compatible WebXR headset browser and select **Enter VR**. Point a controller at the floating panel and press the trigger to select a star, scrub time, or play/pause. Actual headset operation still needs device testing.

## Science and limitations

Illustrative single-star tracks, not predictions for individual observed stars. Time, size, brightness, nebula colour, and motion are simplified for teaching. A massive star's remnant depends on more than initial mass.

- [NASA: Stars](https://science.nasa.gov/universe/stars/)
- [NASA: Star lifecycle](https://science.nasa.gov/mission/webb/star-lifecycle/)

Uses Three.js 0.180.0 and OrbitControls, distributed under the MIT license. Google Fonts are optional; the interface falls back to system fonts.

## Local Learning Lab additions

Open **Learning Lab** in the header for:

- A 1–30 solar-mass explorer with a rough duration estimate and links into the three existing animated tracks. Intermediate masses do not create new simulated tracks or predict remnant outcomes.
- Side-by-side stellar comparisons, a four-hydrogen-to-helium counting activity, and a linear diameter comparison for cities, Earth, the Sun and compact remnants.
- Illustrated introductions to binary stars, brown dwarfs and stellar encounters. These are concept exhibits, not physical simulations.
- A six-question quiz with explanations and session-only scoring, plus three discovery missions checked against the scene’s selected chapter and interior layer.
- Teacher lesson starting points, playback controls and a discussion-question banner. Opening the lab pauses playback.
- Persistent text-size, caption, volume and ambient-motion preferences. VR captions remain available on the floating panel.

In VR, point at the exhibit and hold a controller **grip** to move and rotate it. Hold both grips and vary hand separation to scale, or move the holding controller’s thumbstick vertically. Scale is limited to 0.25–2×. Release to leave the object in place. The floating panel includes **Mission**, **Check discovery** and **Reset view** buttons. These controls require tracked controllers; hand-tracking gestures are not implemented.

New modules: `learning-data.js`, `learning-markup.js`, `learning-lab.js`, `learning-lab.css`, and `vr-lab.js`. All run locally without a build step or new service dependencies.

### Checks

Run `node --test tests/learning.test.mjs` with a recent Node.js version. Tests cover mass-estimate anchors, mission conditions, quiz data, and controller-event manipulation using Three.js objects. They do not emulate physical headset rendering or tracking.

Desktop Edge checks exercised startup, mass selection, comparisons, fusion, scale, all quiz questions, lesson/core selection, mission completion, saved accessibility settings, and a 390px mobile layout. No JavaScript exceptions were observed. Physical headset testing is still required for controller ergonomics, text legibility and frame rate.

Science references for the additions:
- [NASA: Star types](https://science.nasa.gov/universe/stars/types/)
- [NASA: Multiple star systems](https://science.nasa.gov/universe/stars/multiple-star-systems/)
- [NASA: Brown dwarfs](https://science.nasa.gov/mission/webb/science-overview/science-explainers/what-makes-brown-dwarfs-unique/)

## Immersive labs

Choose **Immersive labs** in the header. All six activities work in a desktop browser and use the floating panel in VR:

| Lab | Interaction |
| --- | --- |
| Learn the VR controls | Five instructions for trigger selection, gripping, scaling, reset and layer teleportation. Practise on the original star. |
| Inside the Sun | Three enlarged chambers for the core, radiative zone and convection zone, with animated energy illustrations. Next/Previous teleports between chambers; head movement supports room-scale inspection. |
| Hands-on fusion | Drag nuclei into a reaction ring with mouse/touch, or point and grip/release with tracked controllers. A button alternative is available. Five guided reactions show two proton–proton branches ending in helium-4 and two returned protons. |
| Binary-star lab | Change two masses and separation. Circular orbit positions preserve the barycentre; the period follows Kepler’s two-body law. VR buttons change separation and cycle mass pairs. |
| Supernova replay | Scrub, pause, step 5%, or play at ¼×, ½× or 1×. The core, shock and ejecta follow the selected replay position. VR includes speed buttons. |
| Comparison room | Inspect the Sun, a white dwarf, a neutron star and a black-hole horizon. Switch between independently enlarged objects and a shared linear diameter scale. |

The chambers, fusion reactions and supernova are teaching models, not reaction-rate, radiative-transfer or hydrodynamic simulations. Binary orbits assume circular motion and point masses; displayed stellar radii are illustrative. No continuous artificial VR locomotion is applied.

The lab menu also contains **Low**, **Balanced** and **High** graphics settings. These change resolution, particle counts and XR foveation/framebuffer settings. XR framebuffer changes take effect on the next headset session. Quality preferences are saved on the device.

### Offline preparation

With an internet connection, open the lab menu and select **Download exhibit for offline use**. Wait for **Ready offline** before disconnecting. The service worker saves the application, bundled Three.js and both narration languages (53 app assets). Reopen the same origin and path to use the saved exhibit. Offline audio supports byte-range requests. Browser site-data clearing or storage eviction removes the download; repeat preparation after changing application files. External NASA references and optional Google Fonts still require internet; system fonts are used when unavailable.

Service workers require HTTPS or localhost. A headset cannot access this computer using its own `localhost`; use a reachable HTTPS host for headset testing. Preparing offline content does not publish the project.

New runtime files: `immersive-data.js`, `immersive-ui.js`, `immersive-labs.js`, `immersive.css`, `sw.js`, and `offline-assets.json`. If adding/removing runtime files, update the offline asset list. No API keys, backend or build tools are required.

### Immersive verification

Run `node --test tests/learning.test.mjs tests/immersive.test.mjs`. Seven tests cover the original learning data and VR manipulation, barycentre/period calculations, fusion progression and offline-list completeness.

Desktop Edge checks covered all six labs, mouse dragging, a full five-step fusion chain, binary inputs, pause/scrub/speed controls, comparison scale switching, saved quality settings, offline reload and English/Hindi audio ranges, plus a 390px mobile viewport. A separate Three.js controller-event harness checked grip/release deposition into the fusion ring. The earlier Learning Lab flows also passed regression checks.

Actual headset rendering, controller tracking, comfort and performance remain unverified on hardware.

Additional science references:
- [NASA: Solar interior and the proton–proton chain](https://solarscience.msfc.nasa.gov/interior.shtml)
- [NASA: Kepler’s formula for binary stars](https://imagine.gsfc.nasa.gov/features/yba/CygX1_mass/binary/equation_derive.html)

## Little Star Explorer: ages 7–8

New visitors start in a screen-based children’s adventure. Four discoveries introduce a small set of ideas:

1. **Meet our Sun:** identify the Sun as a star that gives Earth light and warmth.
2. **Build a baby star:** gather three gas clouds and learn that gravity pulls gas together.
3. **Find the energy centre:** visit the enlarged core chamber and identify where the Sun releases energy.
4. **Tell a star’s story:** arrange a gas cloud, a shining Sun-like star, a giant and a white dwarf in order.

Each activity has one short instruction, large buttons, an optional hint and gentle retries. Discoveries earn four badges; there are no timers, lost lives or competitive scores. Progress stays in this browser’s local storage without names or accounts. **Parent / teacher** opens the advanced exhibit or restarts the adventure; **Kids adventure** returns to it. The selected experience is remembered.

English and Hindi text are available. **Read to me** uses browser speech synthesis and reads the instruction and answer choices; installed voices and offline voice support vary. The existing recorded narration belongs to the advanced exhibit. New files are `junior-data.js`, `junior.js` and `junior.css`, all included in offline preparation.

Design references: [NAEYC guidance for school-age children through age 8](https://www.naeyc.org/resources/topics/technology-and-media/school-age-children) and [NASA’s children’s Sun resources](https://spaceplace.nasa.gov/menu/kids/sun/). This is an age-targeted design, not a validated learning assessment. Try it with children and a parent or teacher to check comprehension, reading load and usability before classroom deployment.

Run all logic tests with `node --test tests/learning.test.mjs tests/immersive.test.mjs tests/junior.test.mjs`. Nine tests cover the combined learning data and interactions. Browser checks additionally completed every junior discovery, checked retry behaviour, progress restoration, Hindi text, mobile layout, and switching between child and advanced experiences. Read-aloud availability still depends on the target device.

### Hands-on junior activities

- **Gather gas:** drag three cloud buttons into the glowing gathering space. The cloud icon gradually warms into a star as the 3D scene advances. Tapping a cloud or pressing Enter performs the same action.
- **Build the story:** drag each illustrated card into the next numbered space. Accepted cards snap into place and update the 3D scene. The next space glows; hints explain a mismatched card or slot without removing earned progress. Tap cards in order as an alternative.
- **Find the core:** a large Sun diagram provides a centre target and an outer-layer hint. The existing answer buttons remain available.
- **Discovery map:** four illustrated stops show the current activity and completed discoveries. Children can revisit any stop; replaying a discovery does not duplicate badges.
- **Celebrations:** brief badge animation respects reduced-motion settings. Gentle synthesized sounds are off by default and can be enabled in the parent/teacher menu; the preference stays on this device.

Pointer-based dragging supports mouse, touch and pen, uses forgiving drop boundaries, and cancels without progress when interrupted. Controls remain real buttons for keyboard and tap play. New modules `junior-activities.js` and `junior-drag.js` are included in the offline asset list.

Browser checks covered mouse drops, wrong/missed drops, keyboard and tap alternatives, map revisits, the core target, touch dragging and cancellation, Hindi text, and mobile width. These are functional checks; actual learning and ease of use should still be observed with children.
