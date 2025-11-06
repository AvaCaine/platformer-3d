# Platformer 3D — First Person

A minimal first-person 3D platformer built with Three.js.

Files:
- `index.html` — entry page (loads `src/main.js`).
- `src/main.js` — main game code.
- `src/style.css` — simple UI styles.

How to run locally:
1. Open `index.html` directly in a browser (some browsers block module imports via file://).
2. Recommended: run a simple static server from the project root:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Controls:
- Click the "Click to start" button to lock the pointer and play.
- WASD to move, Space to jump, Shift to sprint.

Notes & Next steps:
- Collision is a simple AABB-ish landing check (works for platform tops). Horizontal collision and complex physics can be added later.
- Consider adding sound, moving platforms, or level files.