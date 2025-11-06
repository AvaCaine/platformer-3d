import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// Debug helper
const debug = document.getElementById('debug');
function showDebug(text) {
    debug.textContent = text;
    console.log(text);
}

// Basic config
const playerHeight = 1.6;
const playerSize = new THREE.Vector3(0.6, playerHeight, 0.6);

showDebug('Loading game...');

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, playerHeight, 5);

// Controls
const controls = new PointerLockControls(camera, document.body);

// Click anywhere to start
document.addEventListener('click', () => {
    controls.lock();
    showDebug('Click detected - requesting pointer lock');
});

controls.addEventListener('lock', () => {
    showDebug('Pointer locked - game active');
});

controls.addEventListener('unlock', () => {
    showDebug('Pointer unlocked - click to play');
});

scene.add(controls.getObject());

// Lights
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
hemi.position.set(0, 200, 0);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 0.6);
dir.position.set(-3, 10, -10);
scene.add(dir);

// Floor
const floorGeo = new THREE.BoxGeometry(50, 1, 50);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.position.y = -0.5;
floor.receiveShadow = true;
scene.add(floor);

// Platforms array
const platforms = [];
function createPlatform(x, y, z, w = 2, h = 0.5, d = 2, color = 0x8B4513) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.receiveShadow = true;
  m.userData.box = new THREE.Box3().setFromObject(m);
  scene.add(m);
  platforms.push(m);
}

// Create some platforms
createPlatform(0, 0.5, -5, 6, 1, 6, 0x777777); // starting platform slightly below player
createPlatform(4, 2, -8, 3, 0.5, 3, 0xff4444);
createPlatform(-4, 3.5, -12, 3, 0.5, 3, 0x44ff44);
createPlatform(2, 5.5, -16, 4, 0.5, 4, 0x4444ff);
createPlatform(0, 9, -20, 6, 0.5, 6, 0xffff44);

// Touch controls setup
const joystickArea = document.getElementById('joystick-area');
const lookArea = document.getElementById('look-area');
const joystick = document.getElementById('joystick');
const jumpButton = document.getElementById('jump-button');

let touchController = {
    move: {
        active: false,
        startX: 0,
        startY: 0,
        moveX: 0,
        moveY: 0
    },
    look: {
        active: false,
        lastX: 0,
        lastY: 0,
        moveX: 0,
        moveY: 0
    },
    jumpActive: false
};

// Handle touch controls
function initTouchControls() {
    showDebug('Initializing touch controls...');
    
    if (!joystickArea || !joystick || !jumpButton || !lookArea) {
        console.error('Touch control elements not found:', {
            joystickArea: !!joystickArea,
            lookArea: !!lookArea,
            joystick: !!joystick,
            jumpButton: !!jumpButton
        });
        return;
    }

    showDebug('Touch controls initialized');
    
    // Movement joystick handling
    joystickArea.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const rect = joystickArea.getBoundingClientRect();
        touchController.move.active = true;
        touchController.move.startX = touch.clientX - rect.left;
        touchController.move.startY = touch.clientY - rect.top;
        e.preventDefault();
    });

    joystickArea.addEventListener('touchmove', (e) => {
        if (!touchController.move.active) return;
        const touch = e.touches[0];
        const rect = joystickArea.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // Calculate move vector (normalized -1 to 1)
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        touchController.move.moveX = Math.max(-1, Math.min(1, (x - centerX) / (rect.width / 3)));
        touchController.move.moveY = Math.max(-1, Math.min(1, (y - centerY) / (rect.height / 3)));
        
        // Move joystick visual (clamped to area)
        const maxMove = Math.min(rect.width, rect.height) / 4;
        const visualX = touchController.move.moveX * maxMove;
        const visualY = touchController.move.moveY * maxMove;
        joystick.style.transform = `translate(${visualX}px, ${visualY}px)`;
        e.preventDefault();
    });

    const endMoveTouch = () => {
        touchController.move.active = false;
        touchController.move.moveX = 0;
        touchController.move.moveY = 0;
        joystick.style.transform = 'translate(0px, 0px)';
    };

    joystickArea.addEventListener('touchend', endMoveTouch);
    joystickArea.addEventListener('touchcancel', endMoveTouch);

    // Look area handling
    lookArea.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        touchController.look.active = true;
        touchController.look.lastX = touch.clientX;
        touchController.look.lastY = touch.clientY;
        e.preventDefault();
    });

    lookArea.addEventListener('touchmove', (e) => {
        if (!touchController.look.active) return;
        const touch = e.touches[0];
        const movementX = touch.clientX - touchController.look.lastX;
        const movementY = touch.clientY - touchController.look.lastY;
        
        // Update camera rotation (similar to mouse movement)
        controls.rotateLeft(-movementX * 0.002);
        controls.rotateUp(-movementY * 0.002);
        
        touchController.look.lastX = touch.clientX;
        touchController.look.lastY = touch.clientY;
        e.preventDefault();
    });

    lookArea.addEventListener('touchend', () => {
        touchController.look.active = false;
    });

    lookArea.addEventListener('touchcancel', () => {
        touchController.look.active = false;
    });

    // Jump button handling
    jumpButton.addEventListener('touchstart', (e) => {
        touchController.jumpActive = true;
        jumpButton.classList.add('active');
        if (canJump) {
            velocity.y = 12.0;
            canJump = false;
        }
        e.preventDefault();
    });

    jumpButton.addEventListener('touchend', (e) => {
        touchController.jumpActive = false;
        jumpButton.classList.remove('active');
        e.preventDefault();
    });
}

initTouchControls();

// Player movement state
const move = { forward: false, back: false, left: false, right: false, sprint: false };
let canJump = false;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// Player bounding box helper
function playerBoxFromPosition(pos) {
  const half = playerSize.clone().multiplyScalar(0.5);
  const min = new THREE.Vector3(pos.x - half.x, pos.y - playerSize.y, pos.z - half.z);
  const max = new THREE.Vector3(pos.x + half.x, pos.y, pos.z + half.z);
  return new THREE.Box3(min, max);
}

// Controls
function onKeyDown(event) {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW': move.forward = true; break;
    case 'ArrowLeft':
    case 'KeyA': move.left = true; break;
    case 'ArrowDown':
    case 'KeyS': move.back = true; break;
    case 'ArrowRight':
    case 'KeyD': move.right = true; break;
    case 'ShiftLeft':
    case 'ShiftRight': move.sprint = true; break;
    case 'Space':
      if (canJump) {
        velocity.y = 12.0; // Increased jump power
        canJump = false;
      }
      break;
  }
}
function onKeyUp(event) {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW': move.forward = false; break;
    case 'ArrowLeft':
    case 'KeyA': move.left = false; break;
    case 'ArrowDown':
    case 'KeyS': move.back = false; break;
    case 'ArrowRight':
    case 'KeyD': move.right = false; break;
    case 'ShiftLeft':
    case 'ShiftRight': move.sprint = false; break;
  }
}

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// Resize
window.addEventListener('resize', onWindowResize);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
const clock = new THREE.Clock();

function animate() {
  const delta = Math.min(0.05, clock.getDelta());

  // friction
  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;

  // gravity
  velocity.y -= 9.8 * 5.0 * delta;

  // movement
  direction.set(0, 0, 0);
  
  // Keyboard input
  if (move.forward) direction.z -= 1;
  if (move.back) direction.z += 1;
  if (move.left) direction.x -= 1;
  if (move.right) direction.x += 1;
  
  // Touch input
  if (touchController.move.active) {
    direction.z = touchController.move.moveY;
    direction.x = -touchController.move.moveX;
  }
  
  direction.normalize();

  const speed = move.sprint ? 20.0 : 8.0;
  if (direction.lengthSq() > 0) {
    // translate camera local direction
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0; forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(camera.up, forward).normalize();

    velocity.x += (forward.x * -direction.z + right.x * -direction.x) * speed * delta * 10;
    velocity.z += (forward.z * -direction.z + right.z * -direction.x) * speed * delta * 10;
  }

  // move camera
  controls.getObject().position.x += velocity.x * delta;
  controls.getObject().position.y += velocity.y * delta;
  controls.getObject().position.z += velocity.z * delta;

  // Simple collision with platforms and floor: create player box
  const playerPos = controls.getObject().position;
  const pBox = playerBoxFromPosition(playerPos);

  // Ground collision (floor at y = 0)
  if (playerPos.y < playerHeight) {
    velocity.y = 0;
    playerPos.y = playerHeight;
    canJump = true;
  } else {
    canJump = false;
  }

  // Check platforms (landing on top)
  for (const plat of platforms) {
    // update platform box in case
    const b = plat.userData.box;
    // compute top y
    const topY = b.max.y;
    // If player's feet are above platform top and intersects horizontally, snap to top
    const feetY = playerPos.y - playerHeight;

    // horizontal overlap test using XZ projection
    const horizOverlap = (playerPos.x + playerSize.x/2) > b.min.x && (playerPos.x - playerSize.x/2) < b.max.x && (playerPos.z + playerSize.z/2) > b.min.z && (playerPos.z - playerSize.z/2) < b.max.z;

    if (horizOverlap && feetY <= topY + 0.1 && feetY >= topY - 1.0 && velocity.y <= 0) {
      // land on platform
      playerPos.y = topY + playerHeight;
      velocity.y = 0;
      canJump = true;
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

// Basic scene items to help orientation
const axes = new THREE.AxesHelper(2);
scene.add(axes);

// small debug camera placement
camera.position.set(0, playerHeight, 6);

console.info('Platformer 3D initialized. Drop-in mode: play immediately; click to lock pointer for mouse look.');
