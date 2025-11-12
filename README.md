# Platformer 3D — First Person

A minimal first-person 3D platformer built with Three.js.

Files:
- `index.html` — entry page (loads `src/main.js`).
- `src/main.js` — main game code.
- `src/style.css` — simple UI styles.

How to run locally:
1. Open `index.html` directly in a browser (some browsers block module imports via file://).
2. Optional: run a simple static server from the project root:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```



What makes this platformer unique?
You are able to walk through objects, but collide with the top surfaces if you stand on them, be warned, slopes or angles may not be safe to stand on, when in doubt, jump it out. Phasing can be useful for some jumps, but if you don't land perfectly over an object, say hello to the void.