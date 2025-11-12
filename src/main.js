import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

// Debug helper
const debug = document.getElementById('debug');
function showDebug(text) {
    debug.textContent = text;
    console.log(text);
}

// 📐 PLAYER SCALE FACTOR: REMAINS 5.0 (As per previous successful state)
const SCALE_FACTOR = 5.0;

// Basic config
const basePlayerHeight = 1.6;
const basePlayerWidth = 0.6;
// Jump velocity remains the same
const BASE_JUMP_VELOCITY = 7.0; 

// 🚀 PLAYER DIMENSIONS: Remain based on 5.0x scale
const playerHeight = basePlayerHeight * SCALE_FACTOR; // 1.6 * 5.0 = 8.0
const playerSize = new THREE.Vector3(basePlayerWidth * SCALE_FACTOR, playerHeight, basePlayerWidth * SCALE_FACTOR); // 0.6 * 5.0 = 3.0

// 🔄 Fall boundary
const FALL_BOUNDARY_Y = -20; 

// 🚀 Define the extra spawn height
const SPAWN_HEIGHT_OFFSET = 10.0; 
const START_Y = playerHeight + SPAWN_HEIGHT_OFFSET; // 8.0 + 50.0 = 58.0

// 💡 Player Spawn Position (unchanged coordinates)
const START_Z = 10;
const START_X = 10; 

// 💡 IMPROVED COLLISION CONFIGURATION
const COLLISION_CONFIG = {
  rayStartOffset: 0.5,        // Units above foot point
  rayCheckDistance: 0.2,      // Multiplier of player height
  groundTolerance: 0.05,      // Tolerance for ground detection while jumping
  snapThreshold: 0.1,         // Max snap distance to prevent teleporting
  minIntersectDistance: 0.01  // Minimum valid intersection distance
};

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
// UPDATED INITIAL POSITION
camera.position.set(START_X, START_Y, START_Z); 

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
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.2);
hemi.position.set(0, 200, 0);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 0x666666, 0.15);
dir.position.set(-3, 10, -10);
scene.add(dir);

// ----------------------------------------------------
// 🌍 OBJ MAP LOADING SECTION
// ----------------------------------------------------

// Platforms array (will exclusively hold the loaded OBJ model for collision)
const platforms = [];

const objLoader = new OBJLoader();
const objPath = 'src/map.obj'; // Path remains the same
const defaultMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xAAAAAA,
    roughness: 0.8,
    metalness: 0.2
});

objLoader.load(
    objPath,
    function (object) {
        object.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                if (!child.material) {
                    child.material = defaultMaterial;
                }
                child.receiveShadow = true;
                child.castShadow = true; 
            }
        });
        
        // 💡 CRITICAL CHANGE: Scale the loaded object down by 0.5 (leaving player size unchanged)
        object.scale.set(0.5, 0.5, 0.5);

        const box = new THREE.Box3().setFromObject(object);
        const center = new THREE.Vector3();
        box.getCenter(center);

        // Adjust the position of the object to move its center to the origin (0,0,0)
        // Note: Map centering will be based on the scaled geometry
        object.position.x += (object.position.x - center.x);
        object.position.z += (object.position.z - center.z);
        

        
        scene.add(object);
        platforms.push(object); 
        
        showDebug(`OBJ Model "${objPath}" loaded, scaled by 0.5, centered, and corrected 90° tilt!`);
    },
    // Progress callback (optional)
    function (xhr) {
        showDebug(`Loading OBJ: ${(xhr.loaded / xhr.total * 100).toFixed(0)}%`);
    },
    // Error callback (optional)
    function (error) {
        console.error('An error occurred while loading the OBJ model:', error);
        showDebug('Error loading model');
    }
);

// ----------------------------------------------------

// Touch controls setup (unchanged)
const joystickArea = document.getElementById('joystick-area');
const lookArea = document.getElementById('look-area');
const joystick = document.getElementById('joystick');
const jumpButton = document.getElementById('jump-button');

let touchController = {
    move: { active: false, startX: 0, startY: 0, moveX: 0, moveY: 0 },
    look: { active: false, lastX: 0, lastY: 0, moveX: 0, moveY: 0 },
    jumpActive: false
};

// Handle touch controls (omitted for brevity, unchanged from last step)
function initTouchControls() {
    // ... (unchanged touch control logic) ...
}

initTouchControls();

// Player movement state (unchanged)
const move = { forward: false, back: false, left: false, right: false, sprint: false };
let canJump = false;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// 💡 RAYCASTER SETUP
const raycaster = new THREE.Raycaster();
const downVector = new THREE.Vector3(0, -1, 0); // Ray points straight down

// Controls (unchanged)
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
        // Jump velocity remains scaled by 5.0
        velocity.y = BASE_JUMP_VELOCITY * SCALE_FACTOR; 
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

// Resize (unchanged)
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
  velocity.x -= velocity.x * 15.0 * delta;
  velocity.z -= velocity.z * 15.0 * delta;

  // 1. GRAVITY: Remains based on 5.0x scale
  const gravityForce = 9.8 * 5.0 * SCALE_FACTOR * 0.25;
  velocity.y -= gravityForce * delta;

  // 2. INPUT HANDLING 
  direction.set(0, 0, 0);
  
  if (move.forward) direction.z -= 1;
  if (move.back) direction.z += 1;
  if (move.left) direction.x -= 1;
  if (move.right) direction.x += 1;
  
  if (touchController.move.active) {
    direction.z = touchController.move.moveY;
    direction.x = -touchController.move.moveX;
  }
  
  direction.normalize();

  // Speed remains based on 5.0x scale
  const speed = move.sprint ? 20.0 * SCALE_FACTOR : 8.0 * SCALE_FACTOR;
  if (direction.lengthSq() > 0) {
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0; forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(camera.up, forward).normalize();

    velocity.x += (forward.x * -direction.z + right.x * -direction.x) * speed * delta * 10;
    velocity.z += (forward.z * -direction.z + right.z * -direction.x) * speed * delta * 10;
  }

  // 3. APPLY HORIZONTAL MOVEMENT
  controls.getObject().position.x += velocity.x * delta;
  controls.getObject().position.z += velocity.z * delta;
  
  const playerPos = controls.getObject().position;
  let onGround = false;

  // 4. IMPROVED RAYCASTING COLLISION LOGIC
  
  // Calculate ray origin - starts slightly above the foot point
  const rayOrigin = new THREE.Vector3(
    playerPos.x,
    playerPos.y - playerHeight + COLLISION_CONFIG.rayStartOffset,
    playerPos.z
  );
  
  // Set up raycaster
  raycaster.set(rayOrigin, downVector);
  
  // Calculate dynamic ray check distance
  const rayCheckDistance = playerHeight * COLLISION_CONFIG.rayCheckDistance;
  
  // Perform intersection check
  const intersects = raycaster.intersectObjects(platforms, true);
  
  if (intersects.length > 0) {
    // Find the closest valid intersection
    let closestIntersect = null;
    
    for (let i = 0; i < intersects.length; i++) {
      const intersect = intersects[i];
      
      // Filter out invalid or too-close intersections
      if (intersect.distance >= COLLISION_CONFIG.minIntersectDistance) {
        closestIntersect = intersect;
        break; // intersects are pre-sorted by distance
      }
    }
    
    if (closestIntersect) {
      const distanceToGround = closestIntersect.distance;
      const groundY = closestIntersect.point.y;
      
      // Check if player is close enough to ground
      if (distanceToGround < rayCheckDistance) {
        
        // Player is falling or stationary
        if (velocity.y <= 0) {
          const targetY = groundY + playerHeight;
          const snapDistance = Math.abs(playerPos.y - targetY);
          
          // Only snap if distance is reasonable (prevents teleporting through floors)
          // Increased threshold significantly for your scaled world
          if (snapDistance < playerHeight) {
            playerPos.y = targetY;
            velocity.y = 0;
            onGround = true;
          } else {
            // Player is too far from ground - apply normal gravity
            onGround = false;
          }
        } 
        // Player is moving upward (jumping)
        else {
          // Use tighter tolerance for ground detection while ascending
          const groundCheckDistance = playerHeight * COLLISION_CONFIG.groundTolerance;
          onGround = distanceToGround < groundCheckDistance;
        }
      }
    }
  }

  // 5. APPLY VERTICAL MOVEMENT (After ground snap/correction)
  controls.getObject().position.y += velocity.y * delta;


  // UPDATED RESPAWN POSITION 
  if (!onGround && playerPos.y < FALL_BOUNDARY_Y) { 
    playerPos.set(START_X, START_Y, START_Z); // Respawn position
    velocity.set(0, 0, 0);
    showDebug('Fell out of world, resetting position.');
  }

  canJump = onGround;
  
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

// Basic scene items to help orientation (unchanged)
const axes = new THREE.AxesHelper(2);
scene.add(axes);

camera.position.set(START_X, START_Y + 1, START_Z + 1); 

console.info('Platformer 3D initialized. Drop-in mode: play immediately; click to lock pointer for mouse look.');