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
