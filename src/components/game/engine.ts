import * as THREE from 'three';

export interface Portal {
  mesh: THREE.Mesh;
  ring: THREE.Mesh;
  normal: THREE.Vector3;
  position: THREE.Vector3;
  color: 'blue' | 'orange';
  linked: Portal | null;
}

export interface Wall {
  mesh: THREE.Mesh;
  normal: THREE.Vector3;
  canPortal: boolean;
}

export class GameEngine {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  clock: THREE.Clock;

  // Physics
  velocity: THREE.Vector3 = new THREE.Vector3();
  onGround = false;
  gravity = -18;
  speed = 7;
  jumpForce = 8;

  // Player
  playerHeight = 1.75;
  playerRadius = 0.4;
  playerPos: THREE.Vector3 = new THREE.Vector3(0, 1.75, 8);

  // Mouse look
  yaw = 0;
  pitch = 0;
  isPointerLocked = false;

  // Keys
  keys: Record<string, boolean> = {};

  // Portals
  bluePortal: Portal | null = null;
  orangePortal: Portal | null = null;
  portalCooldown = 0;

  // Level geometry
  walls: Wall[] = [];
  collidables: THREE.Mesh[] = [];

  // Raycaster
  raycaster = new THREE.Raycaster();

  // Crosshair dot
  crosshairEl: HTMLDivElement | null = null;

  // HUD
  hudEl: HTMLDivElement | null = null;

  animId = 0;
  isRunning = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0e1a, 0.035);

    this.camera = new THREE.PerspectiveCamera(75, 1, 0.05, 200);
    this.clock = new THREE.Clock();
  }

  resize(w: number, h: number) {
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  buildLevel() {
    // Ambient
    const ambient = new THREE.AmbientLight(0x1a2040, 1.2);
    this.scene.add(ambient);

    // Main directional light (simulated lab ceiling)
    const dir = new THREE.DirectionalLight(0xb0c8ff, 0.6);
    dir.position.set(5, 20, 5);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.far = 80;
    dir.shadow.camera.left = -40;
    dir.shadow.camera.right = 40;
    dir.shadow.camera.top = 40;
    dir.shadow.camera.bottom = -40;
    this.scene.add(dir);

    this._buildRoom(
      new THREE.Vector3(0, 0, 0),
      30, 6, 30,
      true, true
    );

    this._addCeilingLights(new THREE.Vector3(0, 5.8, 0), 6, 3);

    // Platforms
    this._addBox(new THREE.Vector3(-6, 1, -4), new THREE.Vector3(4, 0.3, 4), 0x2a3050, false);
    this._addBox(new THREE.Vector3(6, 2.5, -8), new THREE.Vector3(4, 0.3, 4), 0x2a3050, false);
    this._addBox(new THREE.Vector3(0, 4, -12), new THREE.Vector3(5, 0.3, 3), 0x1e2840, false);

    // Central pillar
    this._addBox(new THREE.Vector3(0, 3, 0), new THREE.Vector3(1.5, 6, 1.5), 0x1e2840, false);

    // Portal-able walls (bright white panels)
    this._addPortalWall(new THREE.Vector3(-14.9, 3, 0), new THREE.Vector3(0.2, 5, 12), new THREE.Vector3(1, 0, 0), 0xd0ddf0);
    this._addPortalWall(new THREE.Vector3(14.9, 3, 0), new THREE.Vector3(0.2, 5, 12), new THREE.Vector3(-1, 0, 0), 0xd0ddf0);
    this._addPortalWall(new THREE.Vector3(0, 3, -14.9), new THREE.Vector3(12, 5, 0.2), new THREE.Vector3(0, 0, 1), 0xd0ddf0);
    this._addPortalWall(new THREE.Vector3(0, 3, 14.9), new THREE.Vector3(12, 5, 0.2), new THREE.Vector3(0, 0, -1), 0xd0ddf0);

    // Grating floor accent
    this._addBox(new THREE.Vector3(0, 0.01, 0), new THREE.Vector3(29.5, 0.02, 29.5), 0x0d1020, false);

    // Exit door
    this._addGlowDoor(new THREE.Vector3(0, 1.5, -14.5));

    // Decorative pipes
    for (let i = -10; i <= 10; i += 5) {
      this._addPipe(new THREE.Vector3(i, 5.5, -14), 0.12, 6, 0x334060);
    }
  }

  private _buildRoom(
    center: THREE.Vector3,
    w: number, h: number, d: number,
    hasFloor: boolean, hasCeiling: boolean
  ) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x1a2035, roughness: 0.85, metalness: 0.1 });
    const brightMat = new THREE.MeshStandardMaterial({ color: 0xc8d8f0, roughness: 0.7, metalness: 0.05 });

    const add = (geo: THREE.BoxGeometry, pos: THREE.Vector3, m: THREE.Material) => {
      const mesh = new THREE.Mesh(geo, m);
      mesh.position.copy(pos);
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.collidables.push(mesh);
    };

    // Floor
    if (hasFloor) {
      add(new THREE.BoxGeometry(w, 0.4, d), new THREE.Vector3(center.x, center.y - 0.2, center.z), mat);
    }
    // Ceiling
    if (hasCeiling) {
      add(new THREE.BoxGeometry(w, 0.4, d), new THREE.Vector3(center.x, center.y + h + 0.2, center.z), mat);
    }
    // Walls
    add(new THREE.BoxGeometry(0.4, h, d), new THREE.Vector3(center.x - w / 2, center.y + h / 2, center.z), mat);
    add(new THREE.BoxGeometry(0.4, h, d), new THREE.Vector3(center.x + w / 2, center.y + h / 2, center.z), mat);
    add(new THREE.BoxGeometry(w, h, 0.4), new THREE.Vector3(center.x, center.y + h / 2, center.z - d / 2), brightMat);
    add(new THREE.BoxGeometry(w, h, 0.4), new THREE.Vector3(center.x, center.y + h / 2, center.z + d / 2), mat);
  }

  private _addPortalWall(pos: THREE.Vector3, size: THREE.Vector3, normal: THREE.Vector3, color: number) {
    const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.walls.push({ mesh, normal: normal.clone(), canPortal: true });
    this.collidables.push(mesh);
  }

  private _addBox(pos: THREE.Vector3, size: THREE.Vector3, color: number, canPortal: boolean) {
    const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.15 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.collidables.push(mesh);
    if (canPortal) {
      this.walls.push({ mesh, normal: new THREE.Vector3(0, 1, 0), canPortal: true });
    }
  }

  private _addCeilingLights(center: THREE.Vector3, rows: number, cols: number) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = center.x + (c - (cols - 1) / 2) * 9;
        const z = center.z + (r - (rows - 1) / 2) * 9;

        const light = new THREE.PointLight(0x8ab4ff, 1.5, 14);
        light.position.set(x, center.y, z);
        this.scene.add(light);

        const panelGeo = new THREE.BoxGeometry(1.8, 0.05, 0.6);
        const panelMat = new THREE.MeshStandardMaterial({
          color: 0x9bbfff, emissive: 0x4488cc, emissiveIntensity: 1.2, roughness: 1
        });
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.set(x, center.y, z);
        this.scene.add(panel);
      }
    }
  }

  private _addGlowDoor(pos: THREE.Vector3) {
    const frameGeo = new THREE.BoxGeometry(2.4, 3.2, 0.15);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x334060, roughness: 0.5, metalness: 0.7 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.copy(pos);
    this.scene.add(frame);

    const innerGeo = new THREE.BoxGeometry(1.8, 2.8, 0.05);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88, emissive: 0x00ff44, emissiveIntensity: 0.8,
      transparent: true, opacity: 0.6
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.position.copy(pos);
    inner.position.z += 0.05;
    this.scene.add(inner);

    const glow = new THREE.PointLight(0x00ff88, 2, 5);
    glow.position.copy(pos);
    this.scene.add(glow);
  }

  private _addPipe(pos: THREE.Vector3, radius: number, length: number, color: number) {
    const geo = new THREE.CylinderGeometry(radius, radius, length, 8);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.rotation.z = Math.PI / 2;
    this.scene.add(mesh);
  }

  // Portal creation
  shootPortal(color: 'blue' | 'orange') {
    if (this.portalCooldown > 0) return;
    this.portalCooldown = 0.3;

    const center = new THREE.Vector2(0, 0);
    this.raycaster.setFromCamera(center, this.camera);

    const portalSurfaces = this.walls.filter(w => w.canPortal).map(w => w.mesh);
    const hits = this.raycaster.intersectObjects(portalSurfaces);

    if (hits.length === 0) return;

    const hit = hits[0];
    const wall = this.walls.find(w => w.mesh === hit.object);
    if (!wall) return;

    const pos = hit.point.clone().addScaledVector(wall.normal, 0.05);

    // Remove old portal
    if (color === 'blue' && this.bluePortal) {
      this.scene.remove(this.bluePortal.mesh);
      this.scene.remove(this.bluePortal.ring);
    }
    if (color === 'orange' && this.orangePortal) {
      this.scene.remove(this.orangePortal.mesh);
      this.scene.remove(this.orangePortal.ring);
    }

    const portal = this._createPortalMesh(pos, wall.normal, color);

    if (color === 'blue') {
      this.bluePortal = portal;
      if (this.orangePortal) {
        this.bluePortal.linked = this.orangePortal;
        this.orangePortal.linked = this.bluePortal;
      }
    } else {
      this.orangePortal = portal;
      if (this.bluePortal) {
        this.orangePortal.linked = this.bluePortal;
        this.bluePortal.linked = this.orangePortal;
      }
    }
  }

  private _createPortalMesh(pos: THREE.Vector3, normal: THREE.Vector3, color: 'blue' | 'orange'): Portal {
    const col = color === 'blue' ? 0x00aaff : 0xff6600;
    const emissive = color === 'blue' ? 0x0055ff : 0xff3300;

    // Portal oval
    const geo = new THREE.CircleGeometry(0.85, 32);
    const mat = new THREE.MeshStandardMaterial({
      color: col, emissive, emissiveIntensity: 2,
      transparent: true, opacity: 0.55, side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.lookAt(pos.clone().add(normal));
    this.scene.add(mesh);

    // Ring
    const ringGeo = new THREE.TorusGeometry(0.88, 0.06, 8, 48);
    const ringMat = new THREE.MeshStandardMaterial({
      color: col, emissive, emissiveIntensity: 3, roughness: 0.1, metalness: 0.3
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(pos).addScaledVector(normal, 0.02);
    ring.lookAt(pos.clone().add(normal));
    this.scene.add(ring);

    // Glow light
    const light = new THREE.PointLight(col, 3, 4);
    light.position.copy(pos);
    this.scene.add(light);

    return { mesh, ring, normal: normal.clone(), position: pos.clone(), color, linked: null };
  }

  checkPortalTeleport() {
    if (!this.bluePortal || !this.orangePortal) return;

    const portals = [this.bluePortal, this.orangePortal];
    for (const portal of portals) {
      if (!portal.linked) continue;
      const dist = this.playerPos.distanceTo(portal.position);
      if (dist < 1.1) {
        const dst = portal.linked;

        // Teleport player
        const offset = dst.normal.clone().multiplyScalar(1.5);
        this.playerPos.copy(dst.position).add(offset);
        this.velocity.set(0, 0, 0);

        // Reorient camera to face out of destination portal
        const fwd = dst.normal.clone();
        this.yaw = Math.atan2(fwd.x, fwd.z);
        this.pitch = 0;
        break;
      }
    }
  }

  setupControls(container: HTMLElement) {
    container.addEventListener('click', () => container.requestPointerLock());

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === container;
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked) return;
      const sens = 0.002;
      this.yaw -= e.movementX * sens;
      this.pitch -= e.movementY * sens;
      this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));
    });

    document.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    document.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

    document.addEventListener('mousedown', (e) => {
      if (!this.isPointerLocked) return;
      if (e.button === 0) this.shootPortal('blue');
      if (e.button === 2) this.shootPortal('orange');
    });

    container.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  update(dt: number) {
    if (this.portalCooldown > 0) this.portalCooldown -= dt;

    // Camera yaw/pitch
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);

    // Movement
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const move = new THREE.Vector3();
    if (this.keys['KeyW'] || this.keys['ArrowUp']) move.addScaledVector(forward, 1);
    if (this.keys['KeyS'] || this.keys['ArrowDown']) move.addScaledVector(forward, -1);
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) move.addScaledVector(right, -1);
    if (this.keys['KeyD'] || this.keys['ArrowRight']) move.addScaledVector(right, 1);
    if (move.length() > 0) move.normalize();

    this.velocity.x = move.x * this.speed;
    this.velocity.z = move.z * this.speed;

    // Jump
    if ((this.keys['Space']) && this.onGround) {
      this.velocity.y = this.jumpForce;
      this.onGround = false;
    }

    // Gravity
    this.velocity.y += this.gravity * dt;

    // Move & collide
    const newPos = this.playerPos.clone();
    newPos.x += this.velocity.x * dt;
    newPos.y += this.velocity.y * dt;
    newPos.z += this.velocity.z * dt;

    this._resolveCollisions(newPos);
    this.playerPos.copy(newPos);

    this.camera.position.copy(this.playerPos);

    // Portal teleport check
    this.checkPortalTeleport();

    // Animate portal rings
    const t = this.clock.getElapsedTime();
    if (this.bluePortal) {
      this.bluePortal.ring.rotation.z = t * 1.2;
      (this.bluePortal.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5 + Math.sin(t * 3) * 0.5;
    }
    if (this.orangePortal) {
      this.orangePortal.ring.rotation.z = -t * 1.2;
      (this.orangePortal.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5 + Math.sin(t * 3 + 1) * 0.5;
    }
  }

  private _resolveCollisions(pos: THREE.Vector3) {
    this.onGround = false;

    for (const mesh of this.collidables) {
      const box = new THREE.Box3().setFromObject(mesh);

      const r = this.playerRadius;
      const h = this.playerHeight;

      const px = [pos.x - r, pos.x + r];
      const py = [pos.y - 0.1, pos.y + h];
      const pz = [pos.z - r, pos.z + r];

      const bmin = box.min;
      const bmax = box.max;

      const overlapX = px[0] < bmax.x && px[1] > bmin.x;
      const overlapY = py[0] < bmax.y && py[1] > bmin.y;
      const overlapZ = pz[0] < bmax.z && pz[1] > bmin.z;

      if (!overlapX || !overlapY || !overlapZ) continue;

      // Find smallest penetration axis
      const dxMin = bmax.x - (pos.x - r);
      const dxMax = (pos.x + r) - bmin.x;
      const dyMin = bmax.y - (pos.y - 0.1);
      const dyMax = (pos.y + h) - bmin.y;
      const dzMin = bmax.z - (pos.z - r);
      const dzMax = (pos.z + r) - bmin.z;

      const dx = Math.min(dxMin, dxMax);
      const dy = Math.min(dyMin, dyMax);
      const dz = Math.min(dzMin, dzMax);

      if (dy < dx && dy < dz) {
        if (dyMin < dyMax) {
          pos.y = bmax.y + 0.1;
          this.onGround = true;
          this.velocity.y = Math.max(0, this.velocity.y);
        } else {
          pos.y = bmin.y - h;
          this.velocity.y = Math.min(0, this.velocity.y);
        }
      } else if (dx < dz) {
        if (dxMin < dxMax) pos.x = bmax.x + r;
        else pos.x = bmin.x - r;
        this.velocity.x = 0;
      } else {
        if (dzMin < dzMax) pos.z = bmax.z + r;
        else pos.z = bmin.z - r;
        this.velocity.z = 0;
      }
    }
  }

  start(onFrame?: () => void) {
    this.isRunning = true;
    this.clock.start();
    const loop = () => {
      if (!this.isRunning) return;
      const dt = Math.min(this.clock.getDelta(), 0.05);
      this.update(dt);
      this.renderer.render(this.scene, this.camera);
      onFrame?.();
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  }

  stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animId);
  }

  dispose() {
    this.stop();
    this.renderer.dispose();
  }
}
