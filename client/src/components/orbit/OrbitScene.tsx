import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Project, StatusFilter } from '../../types';
import { getProjectStatusColor } from '../../lib/projectRules';
import { easeInOutCubic, lerp } from '../../lib/motion';

interface OrbitSceneProps {
  projects: Project[];
  statusFilter: StatusFilter;
  hoveredProjectId: number | null;
  reduceEffects?: boolean;
  scrollY?: number;
  scrollVelocity?: number;
  viewportHeight?: number;
}

function checkWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

interface OrbitPose {
  x: number;     // half-viewport units (-1..1, right/up)
  y: number;     // half-viewport units (-1..1, right/up)
  s: number;     // outer diameter as share of viewport height
  tiltX: number; // radians
  spinY: number; // radians
}

const POSES: Record<'hero' | 'overview' | 'projects' | 'orbit' | 'end', OrbitPose> = {
  hero:     { x: 0.45,  y: 0.05,  s: 0.78, tiltX: 0.50, spinY: 0.0 },
  overview: { x: 0.60,  y: -0.55, s: 0.40, tiltX: 0.35, spinY: 0.6 },
  projects: { x: 0.78,  y: 0.35,  s: 0.30, tiltX: 0.60, spinY: 1.2 },
  orbit:    { x: 0.42,  y: 0.00,  s: 0.85, tiltX: 0.50, spinY: 2.0 },
  end:      { x: -0.60, y: 0.45,  s: 0.40, tiltX: 0.40, spinY: 2.6 },
};

interface SectionPositions {
  hero: number;
  overview: number;
  projects: number;
  orbit: number;
  end: number;
}

function computeSectionPositions(): SectionPositions {
  const vh = window.innerHeight;
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - vh);

  const getPageTop = (id: string, fallback: number): number => {
    const el = document.getElementById(id);
    if (!el) return fallback;
    const rect = el.getBoundingClientRect();
    return rect.top + window.scrollY;
  };

  const overviewTop = getPageTop('overview', vh);
  const projectsTop = getPageTop('projects', vh * 2);
  const orbitTop = getPageTop('orbit', vh * 3);
  const footerTop = getPageTop('end', vh * 4);

  const p0 = 0;
  const p1 = Math.max(p0 + 10, overviewTop + 0.2 * vh);
  const p2 = Math.max(p1 + 10, projectsTop + 0.3 * vh);
  const p3 = Math.max(p2 + 10, orbitTop + 0.3 * vh);
  const p4 = Math.max(p3 + 10, Math.min(footerTop, maxScroll));

  return { hero: p0, overview: p1, projects: p2, orbit: p3, end: p4 };
}

function getInterpolatedTargetPose(currentScrollY: number, positions: SectionPositions): OrbitPose {
  const keys: (keyof SectionPositions)[] = ['hero', 'overview', 'projects', 'orbit', 'end'];
  const posArray = [positions.hero, positions.overview, positions.projects, positions.orbit, positions.end];

  if (currentScrollY <= posArray[0]) {
    return { ...POSES.hero };
  }
  if (currentScrollY >= posArray[4]) {
    return { ...POSES.end };
  }

  for (let i = 0; i < 4; i++) {
    const startPos = posArray[i];
    const endPos = posArray[i + 1];
    if (currentScrollY >= startPos && currentScrollY <= endPos) {
      const span = endPos - startPos;
      const progress = span > 0 ? (currentScrollY - startPos) / span : 0;
      const eased = easeInOutCubic(progress);

      const poseA = POSES[keys[i]];
      const poseB = POSES[keys[i + 1]];

      return {
        x: lerp(poseA.x, poseB.x, eased),
        y: lerp(poseA.y, poseB.y, eased),
        s: lerp(poseA.s, poseB.s, eased),
        tiltX: lerp(poseA.tiltX, poseB.tiltX, eased),
        spinY: lerp(poseA.spinY, poseB.spinY, eased),
      };
    }
  }

  return { ...POSES.end };
}

interface PlanetEntry {
  id: number;
  pivot: THREE.Group;
  mesh: THREE.Mesh;
  speed: number;
  status: string;
  currentScale: number;
}

export const OrbitScene: React.FC<OrbitSceneProps> = (props) => {
  const {
    projects,
    statusFilter,
    hoveredProjectId,
    reduceEffects = false,
    scrollY = 0,
    scrollVelocity = 0,
    viewportHeight = window.innerHeight,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webGLSupported] = useState<boolean>(() => checkWebGL());

  // Store interactive state in a mutable ref for requestAnimationFrame loop
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    group: THREE.Group | null;
    planets: PlanetEntry[];
    rings: THREE.Mesh[];
    disposables: { dispose: () => void }[];
    mouse: { x: number; y: number };
    camTilt: { x: number; y: number };
    currentPose: OrbitPose;
    positions: SectionPositions;
    smoothedVelocity: number;
    lastTime: number;
    totalTime: number;
    animId: number | null;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    group: null,
    planets: [],
    rings: [],
    disposables: [],
    mouse: { x: 0, y: 0 },
    camTilt: { x: 0, y: 0 },
    currentPose: { ...POSES.hero },
    positions: { hero: 0, overview: 800, projects: 1600, orbit: 2400, end: 3200 },
    smoothedVelocity: 0,
    lastTime: performance.now(),
    totalTime: 0,
    animId: null,
  });

  // Recompute page-absolute section positions on mount and resize
  useEffect(() => {
    const updatePositions = () => {
      stateRef.current.positions = computeSectionPositions();
    };

    updatePositions();
    window.addEventListener('resize', updatePositions, { passive: true });
    // Slight delay to ensure DOM layout has stabilized
    const timer = setTimeout(updatePositions, 350);

    return () => {
      window.removeEventListener('resize', updatePositions);
      clearTimeout(timer);
    };
  }, [projects.length, viewportHeight]);

  // Mount Scene & WebGLRenderer once
  useEffect(() => {
    if (!webGLSupported || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Perspective Camera (fov 45 at z=12)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 12);

    // 2. WebGL Renderer with ACES tone mapping & sRGB output
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
    } catch {
      return;
    }

    // 3. Lighting (Ambient 0.55 + point light (5,6,8) 1.2)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.2, 80);
    pointLight.position.set(5, 6, 8);
    scene.add(pointLight);

    // Warm rim light for depth
    const rimLight = new THREE.PointLight(0xffb454, 0.75, 60);
    rimLight.position.set(-6, -4, 5);
    scene.add(rimLight);

    // 4. Main Orbit Group
    const group = new THREE.Group();
    group.rotation.x = POSES.hero.tiltX;
    scene.add(group);

    // 5. Sun & Halo
    // Sun: radius 0.7, MeshBasicMaterial #FFC060
    const sunGeom = new THREE.SphereGeometry(0.7, 40, 40);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffc060 });
    const sunMesh = new THREE.Mesh(sunGeom, sunMat);
    group.add(sunMesh);

    // Halo: radius 0.95, MeshBasicMaterial, color #FFC060, transparent, opacity 0.14
    const haloGeom = new THREE.SphereGeometry(0.95, 40, 40);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffc060,
      transparent: true,
      opacity: 0.14,
    });
    const haloMesh = new THREE.Mesh(haloGeom, haloMat);
    group.add(haloMesh);

    const disposables: { dispose: () => void }[] = [
      sunGeom,
      sunMat,
      haloGeom,
      haloMat,
    ];

    stateRef.current.renderer = renderer;
    stateRef.current.scene = scene;
    stateRef.current.camera = camera;
    stateRef.current.group = group;
    stateRef.current.disposables = disposables;
    stateRef.current.lastTime = performance.now();

    // Mouse movement listener for subtle 1 deg camera tilt
    const handleMouseMove = (e: MouseEvent) => {
      stateRef.current.mouse = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Window resize handler
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      if (stateRef.current.animId !== null) {
        cancelAnimationFrame(stateRef.current.animId);
        stateRef.current.animId = null;
      }

      for (const d of disposables) {
        d.dispose();
      }
      for (const p of stateRef.current.planets) {
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
      }
      for (const r of stateRef.current.rings) {
        r.geometry.dispose();
        (r.material as THREE.Material).dispose();
      }

      renderer.dispose();
      stateRef.current.renderer = null;
      stateRef.current.scene = null;
      stateRef.current.camera = null;
      stateRef.current.group = null;
      stateRef.current.planets = [];
      stateRef.current.rings = [];
    };
  }, [webGLSupported]);

  // Update Orbits & Planets when `projects` changes
  useEffect(() => {
    const { group } = stateRef.current;
    if (!group) return;

    // Clear old planets and rings
    for (const p of stateRef.current.planets) {
      group.remove(p.pivot);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    }
    for (const r of stateRef.current.rings) {
      group.remove(r);
      r.geometry.dispose();
      (r.material as THREE.Material).dispose();
    }

    const newPlanets: PlanetEntry[] = [];
    const newRings: THREE.Mesh[] = [];

    // Up to projects count:
    // orbit radius = 1.5 + i*0.6;
    // planet radius = 0.10 + (budget/180000)*0.22;
    projects.forEach((proj, i) => {
      const orbitRadius = 1.5 + i * 0.6;
      const planetRadius = 0.10 + (proj.budget / 180000) * 0.22;

      // Status color from shared single source of truth in projectRules.ts:
      // Active: #35D49A, Completed: #5B93FF, On hold: #E8C14A, Over budget: #FF4D5E (overrides status)
      const hexColor = getProjectStatusColor(proj);
      const colorNum = parseInt(hexColor.replace('#', '0x'), 16);

      // Thin orbit rings (white 14%)
      const ringGeom = new THREE.RingGeometry(orbitRadius - 0.007, orbitRadius + 0.007, 120);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      group.add(ringMesh);
      newRings.push(ringMesh);

      // Planet pivot & mesh
      const pivot = new THREE.Group();
      pivot.rotation.y = i * 1.3;

      // MeshStandardMaterial with color = hex, emissive = hex, emissiveIntensity 0.45, roughness 0.4, metalness 0.15
      const planetGeom = new THREE.SphereGeometry(planetRadius, 32, 32);
      const planetMat = new THREE.MeshStandardMaterial({
        color: colorNum,
        emissive: colorNum,
        emissiveIntensity: 0.45,
        roughness: 0.4,
        metalness: 0.15,
        transparent: true,
        opacity: 1.0,
      });
      const planetMesh = new THREE.Mesh(planetGeom, planetMat);
      planetMesh.position.x = orbitRadius;
      pivot.add(planetMesh);
      group.add(pivot);

      newPlanets.push({
        id: proj.id,
        pivot,
        mesh: planetMesh,
        speed: 0.012 / (1 + i * 0.45),
        status: proj.status,
        currentScale: 1.0,
      });
    });

    stateRef.current.planets = newPlanets;
    stateRef.current.rings = newRings;
  }, [projects]);

  // Handle statusFilter dimming (non-matching fade to 25% opacity)
  useEffect(() => {
    for (const p of stateRef.current.planets) {
      const isMatching = statusFilter === 'all' || p.status === statusFilter;
      const mat = p.mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.opacity = isMatching ? 1.0 : 0.25;
      }
    }
  }, [statusFilter]);

  // Animation Loop with 5-pose scroll choreography, velocity speedup, and pointer tilt
  useEffect(() => {
    if (!webGLSupported || reduceEffects) {
      if (stateRef.current.animId !== null) {
        cancelAnimationFrame(stateRef.current.animId);
        stateRef.current.animId = null;
      }
      return;
    }

    let isVisible = document.visibilityState === 'visible';
    const handleVisibility = () => {
      isVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const loop = () => {
      stateRef.current.animId = requestAnimationFrame(loop);

      if (!isVisible) return;

      const { renderer, scene, camera, group, planets, mouse, positions, currentPose } =
        stateRef.current;
      if (!renderer || !scene || !camera || !group) return;

      const now = performance.now();
      const dt = Math.min((now - stateRef.current.lastTime) / 1000, 0.05);
      stateRef.current.lastTime = now;
      stateRef.current.totalTime += dt;

      // 1. Target Pose from Scroll Progress
      const targetPose = getInterpolatedTargetPose(scrollY, positions);

      // 2. Ease currentPose toward targetPose (k = 1 - e^(-3.2dt))
      if (prefersReducedMotion) {
        currentPose.x = targetPose.x;
        currentPose.y = targetPose.y;
        currentPose.s = targetPose.s;
        currentPose.tiltX = targetPose.tiltX;
        currentPose.spinY = targetPose.spinY;
      } else {
        const k = 1 - Math.exp(-3.2 * dt);
        currentPose.x += (targetPose.x - currentPose.x) * k;
        currentPose.y += (targetPose.y - currentPose.y) * k;
        currentPose.s += (targetPose.s - currentPose.s) * k;
        currentPose.tiltX += (targetPose.tiltX - currentPose.tiltX) * k;
        currentPose.spinY += (targetPose.spinY - currentPose.spinY) * k;
      }

      // 3. World Space Transformation
      // Camera fov 45 at z=12
      const vFovRad = (45 * Math.PI) / 180;
      const visibleHeight = 2 * Math.tan(vFovRad / 2) * 12; // ~9.941 units
      const visibleWidth = visibleHeight * camera.aspect;

      // Base unscaled outer diameter of the planetary system
      const maxOrbitRadius =
        projects.length > 0 ? 1.5 + (projects.length - 1) * 0.6 : 1.5;
      const baseOuterDiameter = (maxOrbitRadius + 0.32) * 2;

      // s is the target outer diameter as a share of viewport height
      const targetDiameter = currentPose.s * visibleHeight;
      const isMobile = window.innerWidth <= 820;
      const scaleMultiplier = isMobile ? 0.72 : 1.0;
      const scale = (targetDiameter / baseOuterDiameter) * scaleMultiplier;

      // Subtle idle bob: y += sin(0.9t) * 0.018 (skipped if reduced motion)
      const idleBob = prefersReducedMotion
        ? 0
        : Math.sin(0.9 * stateRef.current.totalTime) * 0.018;

      const worldX = currentPose.x * (visibleWidth / 2);
      const worldY = (currentPose.y + idleBob) * (visibleHeight / 2);

      group.position.set(worldX, worldY, 0);
      group.scale.set(scale, scale, scale);
      group.rotation.x = currentPose.tiltX;
      group.rotation.y = currentPose.spinY;

      // 4. Planet Orbiting & Velocity Speedup
      // scrollVelocity smoothed: vel += (instant - vel) * 0.1
      stateRef.current.smoothedVelocity +=
        (scrollVelocity - stateRef.current.smoothedVelocity) * 0.1;
      const speedUp = Math.min(
        Math.abs(stateRef.current.smoothedVelocity) / 1800,
        1.4
      );

      for (const p of planets) {
        const step = p.speed * (1 + speedUp);
        p.pivot.rotation.y += step;

        // Smooth hover enlargement: 1.5x on hover
        const targetScale = hoveredProjectId === p.id ? 1.5 : 1.0;
        const scaleK = 1 - Math.exp(-8 * dt);
        p.currentScale += (targetScale - p.currentScale) * scaleK;
        p.mesh.scale.set(p.currentScale, p.currentScale, p.currentScale);
      }

      // 5. Camera Pointer Tilt (max 1 deg = ~0.01745 rad, k = 1 - e^(-dt/0.1))
      if (!prefersReducedMotion) {
        const maxTiltRad = (1 * Math.PI) / 180;
        const targetCamTiltX = -mouse.y * maxTiltRad;
        const targetCamTiltY = mouse.x * maxTiltRad;
        const kCam = 1 - Math.exp(-dt / 0.1);

        stateRef.current.camTilt.x += (targetCamTiltX - stateRef.current.camTilt.x) * kCam;
        stateRef.current.camTilt.y += (targetCamTiltY - stateRef.current.camTilt.y) * kCam;

        camera.rotation.x = stateRef.current.camTilt.x;
        camera.rotation.y = stateRef.current.camTilt.y;
      }

      renderer.render(scene, camera);
    };

    loop();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (stateRef.current.animId !== null) {
        cancelAnimationFrame(stateRef.current.animId);
        stateRef.current.animId = null;
      }
    };
  }, [
    webGLSupported,
    reduceEffects,
    scrollY,
    scrollVelocity,
    hoveredProjectId,
    projects.length,
  ]);

  if (!webGLSupported) {
    return null;
  }

  return (
    <>
      {/* WebGL Canvas (owned directly by React, hidden when reduced effects; 40% opacity below 820px) */}
      <canvas
        ref={canvasRef}
        id="gl"
        aria-hidden="true"
        style={{ display: reduceEffects ? 'none' : 'block' }}
        className="fixed inset-0 w-full h-full pointer-events-none z-0 max-[820px]:opacity-40"
      />

      {/* Legend: glass card at bottom-right containing heading "Planet size = budget" and 4 status dots; hidden below 900px */}
      <div
        className="hidden min-[900px]:flex fixed bottom-6 right-6 z-20 solar-glass px-4 py-3 rounded-[16px] flex-col gap-2 text-xs shadow-solar-card pointer-events-auto"
        aria-label="3D Orbit Scene Legend"
      >
        <span className="text-[12px] font-semibold text-[#FFF6EA]">
          Planet size = budget
        </span>
        <div className="flex items-center gap-3.5 text-[11px] text-[#B6A78F]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#35D49A]" />
            <span>Active</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#5B93FF]" />
            <span>Completed</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E8C14A]" />
            <span>On hold</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF4D5E]" />
            <span>Over budget</span>
          </span>
        </div>
      </div>
    </>
  );
};

export default OrbitScene;
