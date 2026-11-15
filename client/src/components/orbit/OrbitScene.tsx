import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Project, StatusFilter } from '../../types';
import { isOverBudget } from '../../lib/projectRules';

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

export const OrbitScene: React.FC<OrbitSceneProps> = ({
  projects,
  statusFilter,
  hoveredProjectId,
  reduceEffects = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webGLSupported] = useState<boolean>(() => checkWebGL());

  // Store refs to interactive objects for animation frames
  const sceneObjectsRef = useRef<{
    planets: {
      id: number;
      mesh: THREE.Mesh;
      baseRadius: number;
      orbitRadius: number;
      angle: number;
      speed: number;
      status: string;
      isOver: boolean;
      scale: number;
    }[];
    systemGroup: THREE.Group;
    camera: THREE.PerspectiveCamera;
    mouseTarget: { x: number; y: number };
  }>({
    planets: [],
    systemGroup: new THREE.Group(),
    camera: new THREE.PerspectiveCamera(),
    mouseTarget: { x: 0, y: 0 },
  });

  useEffect(() => {
    if (!webGLSupported || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 9);
    sceneObjectsRef.current.camera = camera;

    // 2. Renderer (transparent, pixelRatio capped at 2)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Transparent so CSS background glow shows through
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.2, 50);
    pointLight.position.set(5, 6, 8);
    scene.add(pointLight);

    // 4. Central System Group
    const systemGroup = new THREE.Group();
    systemGroup.rotation.x = 0.5; // Tilted angle
    // Above 900px width position at x=3.1; below 900px center at x=0
    systemGroup.position.x = width > 900 ? 3.1 : 0;
    scene.add(systemGroup);
    sceneObjectsRef.current.systemGroup = systemGroup;

    // 5. Sun & Sun Halo
    const sunGeom = new THREE.SphereGeometry(0.75, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffc060 });
    const sunMesh = new THREE.Mesh(sunGeom, sunMat);
    systemGroup.add(sunMesh);

    const haloGeom = new THREE.SphereGeometry(1.05, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffc060,
      transparent: true,
      opacity: 0.14,
    });
    const haloMesh = new THREE.Mesh(haloGeom, haloMat);
    systemGroup.add(haloMesh);

    // 6. Track all disposable resources
    const disposables: { dispose: () => void }[] = [
      sunGeom,
      sunMat,
      haloGeom,
      haloMat,
    ];

    // 7. Mouse cursor listener for smooth camera easing
    const handleMouseMove = (e: MouseEvent) => {
      const normalizedX = (e.clientX / window.innerWidth) * 2 - 1;
      const normalizedY = -(e.clientY / window.innerHeight) * 2 + 1;
      sceneObjectsRef.current.mouseTarget = {
        x: normalizedX * 2,
        y: -normalizedY * 1.4,
      };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 8. Resize Listener
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || window.innerWidth;
      const newH = container.clientHeight || window.innerHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
      systemGroup.position.x = newW > 900 ? 3.1 : 0;
    };
    window.addEventListener('resize', handleResize);

    // 9. Animation Loop with Tab Visibility Pause
    let animationFrameId: number;
    let isTabVisible = document.visibilityState === 'visible';

    const handleVisibilityChange = () => {
      isTabVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isTabVisible) return;

      // Camera easing toward cursor target
      const { mouseTarget } = sceneObjectsRef.current;
      camera.position.x += (mouseTarget.x - camera.position.x) * 0.04;
      camera.position.y += (mouseTarget.y - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      // Rotate and animate planets if not reduced motion
      const speedMultiplier = reduceEffects ? 0 : 1;

      for (const p of sceneObjectsRef.current.planets) {
        p.angle += p.speed * speedMultiplier;
        p.mesh.position.x = Math.cos(p.angle) * p.orbitRadius;
        p.mesh.position.z = Math.sin(p.angle) * p.orbitRadius;

        // Smooth scale easing when hovered
        const targetScale = hoveredProjectId === p.id ? 1.5 : 1.0;
        p.scale += (targetScale - p.scale) * 0.1;
        p.mesh.scale.set(p.scale, p.scale, p.scale);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      for (const d of disposables) {
        d.dispose();
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [webGLSupported, reduceEffects]);

  // Update planets whenever `projects` changes
  useEffect(() => {
    const { systemGroup } = sceneObjectsRef.current;
    if (!systemGroup) return;

    // Remove existing planets and rings from group
    for (const p of sceneObjectsRef.current.planets) {
      systemGroup.remove(p.mesh);
    }
    // Remove old rings
    const ringsToRemove = systemGroup.children.filter((child) => child.name === 'orbitRing');
    for (const ring of ringsToRemove) {
      systemGroup.remove(ring);
    }

    const newPlanets: typeof sceneObjectsRef.current.planets = [];

    projects.forEach((proj, i) => {
      const orbitRadius = 1.6 + i * 0.65;
      const planetRadius = 0.12 + (proj.budget / 180000) * 0.3;
      const overBudget = isOverBudget(proj);

      // Status color palette: active #35D49A, completed #5B93FF, on_hold #E8C14A, over budget #FF4D5E
      let hexColor = 0x35d49a;
      if (overBudget) {
        hexColor = 0xff4d5e;
      } else if (proj.status === 'completed') {
        hexColor = 0x5b93ff;
      } else if (proj.status === 'on_hold') {
        hexColor = 0xe8c14a;
      }

      // Planet Mesh
      const geom = new THREE.SphereGeometry(planetRadius, 24, 24);
      const mat = new THREE.MeshStandardMaterial({
        color: hexColor,
        emissive: hexColor,
        emissiveIntensity: 0.3,
        roughness: 0.4,
        metalness: 0.15,
        transparent: true,
        opacity: 1.0,
      });

      const mesh = new THREE.Mesh(geom, mat);
      const startAngle = i * 1.3;
      mesh.position.x = Math.cos(startAngle) * orbitRadius;
      mesh.position.z = Math.sin(startAngle) * orbitRadius;
      systemGroup.add(mesh);

      // Orbit Ring (flat ring)
      const ringGeom = new THREE.RingGeometry(orbitRadius - 0.008, orbitRadius + 0.008, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.name = 'orbitRing';
      systemGroup.add(ringMesh);

      newPlanets.push({
        id: proj.id,
        mesh,
        baseRadius: planetRadius,
        orbitRadius,
        angle: startAngle,
        speed: 0.012 / (1 + i * 0.45),
        status: proj.status,
        isOver: overBudget,
        scale: 1.0,
      });
    });

    sceneObjectsRef.current.planets = newPlanets;
  }, [projects]);

  // Handle status filter opacity dimming: non-matching planets fade to 25% opacity
  useEffect(() => {
    for (const p of sceneObjectsRef.current.planets) {
      const isMatching = statusFilter === 'all' || p.status === statusFilter;
      const mat = p.mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.opacity = isMatching ? 1.0 : 0.25;
      }
    }
  }, [statusFilter]);

  if (!webGLSupported) {
    return null;
  }

  return (
    <>
      {/* 3D Canvas Container */}
      <div
        ref={mountRef}
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      />

      {/* Legend bottom-right (hidden below 900px width) */}
      <div className="hidden min-[900px]:flex fixed bottom-6 right-6 z-20 solar-glass px-4 py-3 rounded-2xl flex-col gap-2 text-xs shadow-solar-card pointer-events-auto">
        <span className="font-semibold text-[#FFF6EA] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-solar-sun" />
          <span>Planet size = budget</span>
        </span>
        <div className="flex items-center gap-3 text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#35D49A]" />
            <span>Active</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#5B93FF]" />
            <span>Completed</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#E8C14A]" />
            <span>On hold</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#FF4D5E]" />
            <span>Over budget</span>
          </span>
        </div>
      </div>
    </>
  );
};

export default OrbitScene;
