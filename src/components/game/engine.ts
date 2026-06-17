import * as THREE from 'three';
import { LEVELS, LevelDef } from './levels';

export interface Portal {
  mesh: THREE.Mesh;
  ring: THREE.Mesh;
  glow: THREE.PointLight;
  normal: THREE.Vector3;
  position: THREE.Vector3;
  color: 'blue' | 'orange';
  linked: Portal | null;
}

export interface WallPanel {
  mesh: THREE.Mesh;
  normal: THREE.Vector3;
}

export class GameEngine {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  clock: THREE.Clock;

  velocity = new THREE.Vector3();
  onGround = false;
  gravity = -20;
  speed = 7;
  jumpForce = 9;

  playerHeight = 1.7;
  playerRadius = 0.35;
  playerPos = new THREE.Vector3();

  yaw = 0;
  pitch = 0;
  isPointerLocked = false;

  keys: Record<string, boolean> = {};

  bluePortal: Portal | null = null;
  orangePortal: Portal | null = null;
  portalCooldown = 0;
  justTeleported = false;
  teleportTimer = 0;

  walls: WallPanel[] = [];
  collidables: THREE.Mesh[] = [];
  currentLevel = 0;
  exitMesh: THREE.Mesh | null = null;
  exitLight: THREE.PointLight | null = null;
  levelObjects: THREE.Object3D[] = [];

  raycaster = new THREE.Raycaster();
  animId = 0;
  isRunning = false;

  onLevelComplete?: (lvl: number) => void;
  onLevelChange?: (lvl: number) => void;

  // Portal 2 style materials
  private matWall = new THREE.MeshStandardMaterial({ color: 0x8a9eae, roughness: 0.88, metalness: 0.04 });
  private matWallDark = new THREE.MeshStandardMaterial({ color: 0x181f2e, roughness: 0.92, metalness: 0.12 });
  private matPanel = new THREE.MeshStandardMaterial({ color: 0xd8e8f2, roughness: 0.52, metalness: 0.06 });
  private matFloor = new THREE.MeshStandardMaterial({ color: 0x252f40, roughness: 0.92, metalness: 0.18 });
  private matPlatform = new THREE.MeshStandardMaterial({ color: 0x384560, roughness: 0.72, metalness: 0.42 });
  private matMetal = new THREE.MeshStandardMaterial({ color: 0x4a5c70, roughness: 0.38, metalness: 0.92 });
  private matExitFrame = new THREE.MeshStandardMaterial({ color: 0x354555, roughness: 0.5, metalness: 0.85 });

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060c18);

    this.camera = new THREE.PerspectiveCamera(80, 1, 0.05, 300);
    this.clock = new THREE.Clock();
  }

  resize(w: number, h: number) {
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  loadLevel(index: number) {
    // Cleanup
    for (const o of this.levelObjects) this.scene.remove(o);
    this.levelObjects = [];
    this.walls = [];
    this.collidables = [];
    if (this.bluePortal) { this.scene.remove(this.bluePortal.mesh, this.bluePortal.ring, this.bluePortal.glow); this.bluePortal = null; }
    if (this.orangePortal) { this.scene.remove(this.orangePortal.mesh, this.orangePortal.ring, this.orangePortal.glow); this.orangePortal = null; }

    this.currentLevel = index;
    const def = LEVELS[index];

    this.playerPos.set(def.playerStart.x, def.roomH * 0.5, def.playerStart.z);
    this.velocity.set(0, 0, 0);
    this.yaw = Math.PI;
    this.pitch = 0;

    this.scene.fog = new THREE.FogExp2(0x08101e, 0.016 + index * 0.00005);

    this._buildRoom(def);
    this._buildPlatforms(def);
    this._buildPortalPanels(def);
    this._buildExit(def);
    this._buildLighting(def);

    this.onLevelChange?.(index);
  }

  private _add(obj: THREE.Object3D) {
    this.scene.add(obj);
    this.levelObjects.push(obj);
    return obj;
  }

  private _buildRoom(def: LevelDef) {
    const { roomW: W, roomH: H, roomD: D } = def;
    const hw = W / 2, hd = D / 2;

    // Floor
    const floor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.5, D), this.matFloor);
    floor.position.set(0, -0.25, 0);
    floor.receiveShadow = true;
    this._add(floor); this.collidables.push(floor);

    // Ceiling
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(W, 0.5, D), this.matWallDark);
    ceiling.position.set(0, H + 0.25, 0);
    this._add(ceiling); this.collidables.push(ceiling);

    // Segmented walls — Portal 2 tile look
    this._buildWallGrid(-hw, H, D, 'x', 1);
    this._buildWallGrid(hw, H, D, 'x', -1);
    this._buildWallGrid(-hd, H, W, 'z', 1);
    this._buildWallGrid(hd, H, W, 'z', -1);

    // Floor metal strips
    const stripMat = new THREE.MeshStandardMaterial({ color: 0x18222e, roughness: 0.6, metalness: 0.8 });
    for (let i = -Math.floor(W / 2); i <= Math.floor(W / 2); i += 3) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.01, D), stripMat);
      s.position.set(i, 0.01, 0); this._add(s);
    }
    for (let i = -Math.floor(D / 2); i <= Math.floor(D / 2); i += 3) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(W, 0.01, 0.05), stripMat);
      s.position.set(0, 0.01, i); this._add(s);
    }
  }

  private _buildWallGrid(offset: number, H: number, len: number, axis: 'x' | 'z', normalDir: number) {
    const segW = 2.2, segH = 2.2;
    const cols = Math.ceil(len / segW);
    const rows = Math.ceil(H / segH);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const u = (c - (cols - 1) / 2) * segW;
        const v = (r + 0.5) * segH;
        const variant = (r + c) % 4;
        const mat = variant === 0 ? this.matWallDark : this.matWall;
        const thickness = 0.28;

        const geo = new THREE.BoxGeometry(
          axis === 'x' ? thickness : segW - 0.07,
          segH - 0.07,
          axis === 'z' ? thickness : segW - 0.07
        );
        const m = new THREE.Mesh(geo, mat);
        if (axis === 'x') m.position.set(offset, v, u);
        else m.position.set(u, v, offset);
        m.receiveShadow = true;
        this._add(m);
        this.collidables.push(m);
      }
    }

    // Solid backing for collision
    const backing = new THREE.Mesh(
      new THREE.BoxGeometry(axis === 'x' ? 0.08 : len, H, axis === 'z' ? 0.08 : len),
      this.matWallDark
    );
    backing.position.set(axis === 'x' ? offset : 0, H / 2, axis === 'z' ? offset : 0);
    this._add(backing);
    this.collidables.push(backing);

    const n = new THREE.Vector3(axis === 'x' ? normalDir : 0, 0, axis === 'z' ? normalDir : 0);
    this.walls.push({ mesh: backing, normal: n });
  }

  private _buildPlatforms(def: LevelDef) {
    for (const p of def.platforms) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(p.w, 0.24, p.d), this.matPlatform);
      slab.position.set(p.x, p.y, p.z);
      slab.castShadow = true; slab.receiveShadow = true;
      this._add(slab); this.collidables.push(slab);

      // Glowing edge trim
      const trimMat = new THREE.MeshStandardMaterial({ color: 0x4a7090, emissive: new THREE.Color(0x1a3050), emissiveIntensity: 0.5, roughness: 0.4, metalness: 0.8 });
      const trim = new THREE.Mesh(new THREE.BoxGeometry(p.w + 0.05, 0.05, p.d + 0.05), trimMat);
      trim.position.set(p.x, p.y + 0.145, p.z);
      this._add(trim);

      // Support beams
      if (p.y > 0.6) {
        for (const [dx, dz] of [[-p.w / 2 + 0.15, 0], [p.w / 2 - 0.15, 0]]) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, p.y, 8), this.matMetal);
          leg.position.set(p.x + dx, p.y / 2, p.z + dz);
          this._add(leg);
        }
      }
    }
  }

  private _buildPortalPanels(def: LevelDef) {
    for (const p of def.extraPanels) {
      const normal = new THREE.Vector3(p.nx, p.ny, p.nz);
      const geo = new THREE.BoxGeometry(
        p.nx !== 0 ? 0.16 : p.pw,
        p.ny !== 0 ? 0.16 : p.ph,
        p.nz !== 0 ? 0.16 : p.pw
      );
      const mat = this.matPanel.clone();
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(p.x, p.y, p.z);
      mesh.receiveShadow = true;
      this._add(mesh);
      this.walls.push({ mesh, normal });
      this.collidables.push(mesh);

      // Panel border frame
      const borderMat = new THREE.MeshStandardMaterial({ color: 0x7799bb, roughness: 0.45, metalness: 0.6 });
      const bGeo = new THREE.BoxGeometry(
        p.nx !== 0 ? 0.04 : p.pw + 0.12,
        p.ny !== 0 ? 0.04 : p.ph + 0.12,
        p.nz !== 0 ? 0.04 : p.pw + 0.12
      );
      const border = new THREE.Mesh(bGeo, borderMat);
      border.position.set(p.x - p.nx * 0.05, p.y, p.z - p.nz * 0.05);
      this._add(border);
    }
  }

  private _buildExit(def: LevelDef) {
    const { x: ex, z: ez } = def.exitPos;

    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.3, 3.1, 0.25), this.matExitFrame);
    frame.position.set(ex, 1.55, ez);
    this._add(frame);

    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x00ff99, emissive: new THREE.Color(0x00ee55), emissiveIntensity: 1.0,
      transparent: true, opacity: 0.65
    });
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.65, 2.65, 0.07), doorMat);
    door.position.set(ex, 1.55, ez + 0.12);
    this.exitMesh = door;
    this._add(door);

    const light = new THREE.PointLight(0x00ff88, 3.5, 7);
    light.position.set(ex, 2, ez + 0.8);
    this.exitLight = light;
    this._add(light);

    // Floor ring marker
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.75, 48), new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: new THREE.Color(0x00cc55), emissiveIntensity: 0.7, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(ex, 0.02, ez);
    this._add(ring);

    // Arrow trail
    for (let i = 1; i <= 4; i++) {
      const arMat = new THREE.MeshStandardMaterial({ color: 0x00ff99, emissive: new THREE.Color(0x00cc44), emissiveIntensity: 0.3 + i * 0.15 });
      const ar = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.01, 0.3), arMat);
      ar.position.set(ex, 0.02, ez + i * 0.8);
      this._add(ar);
    }

    // Level number display
    const numMat = new THREE.MeshStandardMaterial({ color: 0x88ddff, emissive: new THREE.Color(0x3388cc), emissiveIntensity: 0.8, roughness: 0.3, metalness: 0.5 });
    const numPlate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.04), numMat);
    numPlate.position.set(ex, 3.4, ez + 0.14);
    this._add(numPlate);
  }

  private _buildLighting(def: LevelDef) {
    const { roomW: W, roomH: H, roomD: D } = def;

    this._add(new THREE.AmbientLight(0x1a2840, 0.7));

    // Ceiling fluorescent strips (Portal 2 signature)
    const stripMat = new THREE.MeshStandardMaterial({
      color: 0xaaccff, emissive: new THREE.Color(0x5588cc), emissiveIntensity: 1.8, roughness: 1
    });
    const lRows = Math.max(2, Math.ceil(D / 7));
    const lCols = Math.max(2, Math.ceil(W / 8));
    for (let r = 0; r < lRows; r++) {
      for (let c = 0; c < lCols; c++) {
        const lx = (c / (lCols - 1) - 0.5) * (W - 4);
        const lz = (r / (lRows - 1) - 0.5) * (D - 4);
        const strip = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.03, 2.8), stripMat);
        strip.position.set(lx, H - 0.03, lz);
        this._add(strip);
        const pl = new THREE.PointLight(0x7799ee, 1.1, 14);
        pl.position.set(lx, H - 0.35, lz);
        this._add(pl);
      }
    }

    // Main shadow caster
    const sun = new THREE.DirectionalLight(0x7080a0, 0.45);
    sun.position.set(W / 4, H, D / 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.far = Math.max(W, H, D) * 2.5;
    sun.shadow.camera.left = -W; sun.shadow.camera.right = W;
    sun.shadow.camera.top = D; sun.shadow.camera.bottom = -D;
    this._add(sun);

    // Colored wall accents
    const bl = new THREE.PointLight(0x1133ff, 0.5, W * 0.9);
    bl.position.set(-W / 2 + 2, H / 2, 0);
    this._add(bl);
    const ol = new THREE.PointLight(0xff5500, 0.35, W * 0.7);
    ol.position.set(W / 2 - 2, H / 2, 0);
    this._add(ol);
  }

  // ─── Portal ────────────────────────────────────────────────────
  shootPortal(color: 'blue' | 'orange') {
    if (this.portalCooldown > 0) return;
    this.portalCooldown = 0.22;

    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const hits = this.raycaster.intersectObjects(this.walls.map(w => w.mesh));
    if (!hits.length) return;

    const wall = this.walls.find(w => w.mesh === hits[0].object);
    if (!wall) return;
    const pos = hits[0].point.clone().addScaledVector(wall.normal, 0.06);

    if (color === 'blue' && this.bluePortal) this._removePortal(this.bluePortal);
    if (color === 'orange' && this.orangePortal) this._removePortal(this.orangePortal);

    const portal = this._spawnPortal(pos, wall.normal, color);
    if (color === 'blue') {
      this.bluePortal = portal;
      if (this.orangePortal) { portal.linked = this.orangePortal; this.orangePortal.linked = portal; }
    } else {
      this.orangePortal = portal;
      if (this.bluePortal) { portal.linked = this.bluePortal; this.bluePortal.linked = portal; }
    }
  }

  private _removePortal(p: Portal) {
    this.scene.remove(p.mesh, p.ring, p.glow);
    this.levelObjects = this.levelObjects.filter(o => o !== p.mesh && o !== p.ring && o !== p.glow);
  }

  private _spawnPortal(pos: THREE.Vector3, normal: THREE.Vector3, color: 'blue' | 'orange'): Portal {
    const isBlue = color === 'blue';
    const col = isBlue ? 0x00aaff : 0xff6600;
    const emissiveCol = isBlue ? new THREE.Color(0x0044ee) : new THREE.Color(0xff3300);

    // Ellipse (Portal 2 shape — taller oval)
    const shape = new THREE.Shape();
    shape.absellipse(0, 0, 0.7, 0.98, 0, Math.PI * 2);
    const geo = new THREE.ShapeGeometry(shape, 52);
    const mat = new THREE.MeshStandardMaterial({
      color: col, emissive: emissiveCol, emissiveIntensity: 2.8,
      transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.lookAt(pos.clone().add(normal));
    this.scene.add(mesh);

    // Main ring
    const ringGeo = new THREE.TorusGeometry(0.86, 0.10, 16, 72);
    const ringMat = new THREE.MeshStandardMaterial({
      color: col, emissive: emissiveCol, emissiveIntensity: 4.5,
      roughness: 0.08, metalness: 0.15
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(pos).addScaledVector(normal, 0.05);
    ring.lookAt(pos.clone().add(normal));
    this.scene.add(ring);

    // Outer thin ring
    const outerGeo = new THREE.TorusGeometry(1.02, 0.025, 6, 72);
    const outerMat = new THREE.MeshStandardMaterial({ color: col, emissive: emissiveCol, emissiveIntensity: 2.5 });
    const outer = new THREE.Mesh(outerGeo, outerMat);
    outer.position.copy(pos).addScaledVector(normal, 0.02);
    outer.lookAt(pos.clone().add(normal));
    this.scene.add(outer);

    // Spoke details (Portal 2 has inner cross marks)
    for (let i = 0; i < 4; i++) {
      const spokeGeo = new THREE.BoxGeometry(0.025, 0.55, 0.015);
      const spokeMat = new THREE.MeshStandardMaterial({ color: col, emissive: emissiveCol, emissiveIntensity: 3 });
      const spoke = new THREE.Mesh(spokeGeo, spokeMat);
      spoke.position.copy(pos).addScaledVector(normal, 0.07);
      spoke.lookAt(pos.clone().add(normal));
      spoke.rotateZ((Math.PI / 4) * i);
      this.scene.add(spoke);
      this.levelObjects.push(spoke);
    }

    const glow = new THREE.PointLight(col, 4.5, 5.5);
    glow.position.copy(pos).addScaledVector(normal, 0.35);
    this.scene.add(glow);

    return { mesh, ring, glow, normal: normal.clone(), position: pos.clone(), color, linked: null };
  }

  private _checkPortalTeleport() {
    if (!this.bluePortal?.linked || this.justTeleported) return;
    for (const src of [this.bluePortal, this.orangePortal] as Portal[]) {
      if (!src?.linked) continue;
      if (this.playerPos.distanceTo(src.position) < 1.05) {
        const dst = src.linked;
        this.playerPos.copy(dst.position).addScaledVector(dst.normal, 1.9);
        this.yaw = Math.atan2(dst.normal.x, dst.normal.z);
        this.pitch = 0;
        this.velocity.set(0, 0, 0);
        this.justTeleported = true;
        this.teleportTimer = 0.45;
        break;
      }
    }
  }

  private _checkExit() {
    const def = LEVELS[this.currentLevel];
    const { x: ex, z: ez } = def.exitPos;
    const dx = this.playerPos.x - ex;
    const dz = this.playerPos.z - ez;
    if (Math.sqrt(dx * dx + dz * dz) < 1.3 && this.playerPos.y < 3.5) {
      this.onLevelComplete?.(this.currentLevel);
    }
  }

  setupControls(container: HTMLElement) {
    container.addEventListener('click', () => container.requestPointerLock());
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === container;
    });
    document.addEventListener('mousemove', e => {
      if (!this.isPointerLocked) return;
      this.yaw -= e.movementX * 0.0018;
      this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch - e.movementY * 0.0018));
    });
    document.addEventListener('keydown', e => { this.keys[e.code] = true; });
    document.addEventListener('keyup', e => { this.keys[e.code] = false; });
    document.addEventListener('mousedown', e => {
      if (!this.isPointerLocked) return;
      if (e.button === 0) this.shootPortal('blue');
      if (e.button === 2) this.shootPortal('orange');
    });
    container.addEventListener('contextmenu', e => e.preventDefault());
  }

  update(dt: number) {
    if (this.portalCooldown > 0) this.portalCooldown -= dt;
    if (this.teleportTimer > 0) {
      this.teleportTimer -= dt;
      if (this.teleportTimer <= 0) this.justTeleported = false;
    }

    this.camera.quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));

    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const move = new THREE.Vector3();
    if (this.keys['KeyW'] || this.keys['ArrowUp']) move.addScaledVector(fwd, 1);
    if (this.keys['KeyS'] || this.keys['ArrowDown']) move.addScaledVector(fwd, -1);
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) move.addScaledVector(right, -1);
    if (this.keys['KeyD'] || this.keys['ArrowRight']) move.addScaledVector(right, 1);
    if (move.length() > 0) move.normalize();

    const sprint = this.keys['ShiftLeft'] ? 1.65 : 1;
    this.velocity.x = move.x * this.speed * sprint;
    this.velocity.z = move.z * this.speed * sprint;

    if (this.keys['Space'] && this.onGround) { this.velocity.y = this.jumpForce; this.onGround = false; }
    this.velocity.y += this.gravity * dt;

    const newPos = this.playerPos.clone();
    newPos.addScaledVector(this.velocity, dt);
    this._collide(newPos);
    this.playerPos.copy(newPos);
    this.camera.position.copy(this.playerPos);

    this._checkPortalTeleport();
    this._checkExit();

    // Portal animations
    const t = this.clock.getElapsedTime();
    if (this.bluePortal) {
      this.bluePortal.ring.rotation.z = t * 0.9;
      (this.bluePortal.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.2 + Math.sin(t * 2.8) * 0.7;
      this.bluePortal.glow.intensity = 3.5 + Math.sin(t * 2.8) * 1.2;
    }
    if (this.orangePortal) {
      this.orangePortal.ring.rotation.z = -t * 0.9;
      (this.orangePortal.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.2 + Math.sin(t * 2.8 + 1) * 0.7;
      this.orangePortal.glow.intensity = 3.5 + Math.sin(t * 2.8 + 1) * 1.2;
    }

    // Exit pulse
    if (this.exitLight) this.exitLight.intensity = 2.8 + Math.sin(t * 2.5) * 1;
    if (this.exitMesh) {
      const m = this.exitMesh.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.85 + Math.sin(t * 1.8) * 0.3;
      m.opacity = 0.58 + Math.sin(t * 1.3) * 0.1;
    }
  }

  private _collide(pos: THREE.Vector3) {
    this.onGround = false;
    const r = this.playerRadius, h = this.playerHeight;
    for (const mesh of this.collidables) {
      const { min, max } = new THREE.Box3().setFromObject(mesh);
      const ox = pos.x - r < max.x && pos.x + r > min.x;
      const oy = pos.y - 0.05 < max.y && pos.y + h > min.y;
      const oz = pos.z - r < max.z && pos.z + r > min.z;
      if (!ox || !oy || !oz) continue;

      const dxL = max.x - (pos.x - r), dxR = (pos.x + r) - min.x;
      const dyB = max.y - (pos.y - 0.05), dyT = (pos.y + h) - min.y;
      const dzF = max.z - (pos.z - r), dzB = (pos.z + r) - min.z;
      const dx = Math.min(dxL, dxR), dy = Math.min(dyB, dyT), dz = Math.min(dzF, dzB);

      if (dy < dx && dy < dz) {
        if (dyB < dyT) { pos.y = max.y + 0.05; this.onGround = true; this.velocity.y = Math.max(0, this.velocity.y); }
        else { pos.y = min.y - h; this.velocity.y = Math.min(0, this.velocity.y); }
      } else if (dx < dz) {
        pos.x += dxL < dxR ? dxL : -dxR; this.velocity.x = 0;
      } else {
        pos.z += dzF < dzB ? dzF : -dzB; this.velocity.z = 0;
      }
    }
  }

  start(onFrame?: () => void) {
    this.isRunning = true;
    this.clock.start();
    const loop = () => {
      if (!this.isRunning) return;
      this.update(Math.min(this.clock.getDelta(), 0.05));
      this.renderer.render(this.scene, this.camera);
      onFrame?.();
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  }

  stop() { this.isRunning = false; cancelAnimationFrame(this.animId); }
  dispose() { this.stop(); this.renderer.dispose(); }
}
