import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Project, StatusFilter } from '../../types';
import { getProjectStatusColor } from '../../lib/projectRules';

interface OrbitSceneProps {
  projects: Project[];
  statusFilter: StatusFilter;
  hoveredProjectId: number | null;
  reduceEffects?: boolean;
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

interface PlanetEntry {
  id: number;
  pivot: THREE.Group;
  mesh: THREE.Mesh;
  speed: number;
  status: string;
  isOver: boolean;
  currentScale: number;
}

export const OrbitScene: React.FC<OrbitSceneProps> = ({
  projects,
  statusFilter,
  hoveredProjectId,
  reduceEffects = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webGLSupported] = useState<boolean>(() => checkWebGL());

  // Store interactive three refs across renders
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    group: THREE.Group | null;
    planets: PlanetEntry[];
    rings: THREE.Mesh[];
    disposables: { dispose: () => void }[];
    mouse: { x: number; y: number };
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
    animId: null,
  });

  // Mount Scene & WebGLRenderer once
  useEffect(() => {
    if (!webGLSupported || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Scene & Camera (PerspectiveCamera fov 45 at z=12)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 12);

    // 2. Renderer
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
    } catch {
      return;
    }

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xffffff, 1.2, 60);
    pointLight1.position.set(5, 6, 8);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffb454, 0.8, 60);
    pointLight2.position.set(-6, -3, 5);
    scene.add(pointLight2);

    // 4. Main Orbit Group (Tilt 0.5; x=2.6 on screens >1100px, 0 below)
    const group = new THREE.Group();
    group.rotation.x = 0.5;
    group.position.x = width > 1100 ? 2.6 : 0;
    scene.add(group);

    // 5. Sun & Halo
    // Sun: radius 0.7, color #FFC060 (MeshBasicMaterial)
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

    stateRef.current = {
      renderer,
      scene,
      camera,
      group,
      planets: [],
      rings: [],
      disposables,
      mouse: { x: 0, y: 0 },
      animId: null,
    };

    // Mouse movement listener
    const handleMouseMove = (e: MouseEvent) => {
      stateRef.current.mouse = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Resize listener (group position x=2.6 on >1100px)
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      group.position.x = w > 1100 ? 2.6 : 0;
    };
    window.addEventListener('resize', handleResize);

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
      const planetSize = 0.10 + (proj.budget / 180000) * 0.22;

      // Status color from shared single source of truth in projectRules.ts:
      // Active: #35D49A, Completed: #5B93FF, On hold: #E8C14A, Over budget: #FF4D5E (overrides status)
      const hexColor = getProjectStatusColor(proj);
      const colorNum = parseInt(hexColor.replace('#', '0x'), 16);

      // Orbit ring: concentric thin ring, color #FFB454, opacity 0.22
      const ringGeom = new THREE.RingGeometry(orbitRadius - 0.008, orbitRadius + 0.008, 120);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffb454,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      group.add(ringMesh);
      newRings.push(ringMesh);

      // Planet pivot
      const pivot = new THREE.Group();
      pivot.rotation.y = i * 1.3;

      // MeshStandardMaterial with color = hex, emissive = hex, emissiveIntensity 0.45, roughness 0.4, metalness 0.15
      const planetGeom = new THREE.SphereGeometry(planetSize, 32, 32);
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
        isOver: hexColor === '#FF4D5E',
        currentScale: 1.0,
      });
    });

    stateRef.current.planets = newPlanets;
    stateRef.current.rings = newRings;
  }, [projects]);

  // Handle statusFilter dimming
  useEffect(() => {
    for (const p of stateRef.current.planets) {
      const isMatching = statusFilter === 'all' || p.status === statusFilter;
      const mat = p.mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.opacity = isMatching ? 1.0 : 0.25;
      }
    }
  }, [statusFilter]);

  // Animation Loop: Pause and drop CPU to 0% when reduceEffects is true
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

    const loop = () => {
      stateRef.current.animId = requestAnimationFrame(loop);

      if (!isVisible) return;

      const { renderer, scene, camera, planets, mouse } = stateRef.current;
      if (!renderer || !scene || !camera) return;

      // Camera easing toward cursor target
      camera.position.x += (mouse.x * 2 - camera.position.x) * 0.04;
      camera.position.y += (-mouse.y * 1.4 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      // Rotate planet pivots
      for (const p of planets) {
        p.pivot.rotation.y += p.speed;

        // Smooth scale easing on hover
        const targetScale = hoveredProjectId === p.id ? 1.5 : 1.0;
        p.currentScale += (targetScale - p.currentScale) * 0.1;
        p.mesh.scale.set(p.currentScale, p.currentScale, p.currentScale);
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
  }, [webGLSupported, reduceEffects, hoveredProjectId]);

  if (!webGLSupported) {
    return null;
  }

  return (
    <>
      {/* WebGL Canvas (owned directly by React, hidden when reduced effects; 40% opacity below 900px) */}
      <canvas
        ref={canvasRef}
        id="gl"
        aria-hidden="true"
        style={{ display: reduceEffects ? 'none' : 'block' }}
        className="fixed inset-0 w-full h-full pointer-events-none z-0 max-[900px]:opacity-40"
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
