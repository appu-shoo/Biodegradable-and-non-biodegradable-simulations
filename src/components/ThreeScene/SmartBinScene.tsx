import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CameraPreset, SimulationPhase, WasteItemDef, WasteType } from '../../types/simulation';

interface SmartBinSceneProps {
  phase: SimulationPhase;
  currentItem: WasteItemDef | null;
  servoAngle: number;
  cameraPreset: CameraPreset;
  bioFillPercent: number;
  nonBioFillPercent: number;
  bioWasteCount: number;
  nonBioWasteCount: number;
  explodedProgress: number; // 0 to 1
  displayText: string;
}

export const SmartBinScene: React.FC<SmartBinSceneProps> = ({
  phase,
  currentItem,
  servoAngle,
  cameraPreset,
  bioFillPercent,
  nonBioFillPercent,
  bioWasteCount,
  nonBioWasteCount,
  explodedProgress,
  displayText,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  // Core references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const binMainGroupRef = useRef<THREE.Group | null>(null);

  // Moving mechanical parts
  const flapGroupRef = useRef<THREE.Group | null>(null);
  const topCapGroupRef = useRef<THREE.Group | null>(null); // Tilting top inlet cap
  const servoArmRef = useRef<THREE.Group | null>(null);
  const fallingItemMeshRef = useRef<THREE.Group | null>(null);

  // Sensor indicators
  const irBeamMeshRef = useRef<THREE.Mesh | null>(null);
  const cameraFlashLightRef = useRef<THREE.PointLight | null>(null);
  const ultrasonicPulseBioRef = useRef<THREE.Mesh | null>(null);
  const ultrasonicPulseNonBioRef = useRef<THREE.Mesh | null>(null);
  const lcdCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lcdTextureRef = useRef<THREE.CanvasTexture | null>(null);

  // Exploded view groups
  const topAssemblyGroupRef = useRef<THREE.Group | null>(null);
  const outerShellRef = useRef<THREE.Group | null>(null);
  const internalAssemblyRef = useRef<THREE.Group | null>(null);

  // Accumulated waste meshes in bins
  const bioBinItemsGroupRef = useRef<THREE.Group | null>(null);
  const nonBioBinItemsGroupRef = useRef<THREE.Group | null>(null);

  // Camera targets
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 2.3, 5.8));
  const targetCamLook = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.45, 0));
  const currentCamLook = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.45, 0));

  // Dynamic falling item physics animation state
  const itemCurrentPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 4.2, 0));
  const itemCurrentRot = useRef<THREE.Euler>(new THREE.Euler(0, 0, 0));
  const itemTargetPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 4.2, 0));
  const itemTargetRot = useRef<THREE.Euler>(new THREE.Euler(0, 0, 0));
  const topCapTargetAngleZ = useRef<number>(0); // Tilts directly toward left (-Z angle) for Bio or right (+Z angle) for Non-Bio

  // Update dynamic OLED display texture
  const updateLcdCanvas = (text: string, bioP: number, nonBioP: number) => {
    if (!lcdCanvasRef.current || !lcdTextureRef.current) return;
    const canvas = lcdCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#050c18';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle matrix grid
    ctx.strokeStyle = '#0f2438';
    ctx.lineWidth = 1;
    for (let y = 0; y < canvas.height; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Top status strip
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, 26);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('ECOCHAIN-AI SMART BIN · ESP32', 12, 18);

    // Main status text
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text.toUpperCase(), canvas.width / 2, 68);

    // Fill meters
    const gaugeY = 96;
    const gaugeH = 14;
    const gaugeW = 195;

    // Bio (Left, Green)
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`BIO: ${Math.round(bioP)}%`, 18, gaugeY - 5);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(18, gaugeY, gaugeW, gaugeH);
    ctx.fillStyle = bioP >= 90 ? '#ef4444' : bioP >= 70 ? '#f59e0b' : '#10b981';
    ctx.fillRect(18, gaugeY, (gaugeW * Math.min(bioP, 100)) / 100, gaugeH);

    // Non-Bio (Right, Orange)
    ctx.fillStyle = '#f97316';
    ctx.textAlign = 'left';
    ctx.fillText(`NON-BIO: ${Math.round(nonBioP)}%`, 275, gaugeY - 5);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(275, gaugeY, gaugeW, gaugeH);
    ctx.fillStyle = nonBioP >= 90 ? '#ef4444' : nonBioP >= 70 ? '#f59e0b' : '#f97316';
    ctx.fillRect(275, gaugeY, (gaugeW * Math.min(nonBioP, 100)) / 100, gaugeH);

    // Footer
    ctx.fillStyle = '#64748b';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PCA9685 SERVO PWM · OV2640 CAMERA · HC-SR04 DUAL US', canvas.width / 2, 134);

    lcdTextureRef.current.needsUpdate = true;
  };

  // Construct Realistic 3D Waste Models
  const createWasteMesh = (item: WasteItemDef): THREE.Group => {
    const group = new THREE.Group();

    if (item.id === 'banana_peel') {
      const peelMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4, metalness: 0.05 });
      const tipMat = new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.8 });

      const stemGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.2, 8);
      const stem = new THREE.Mesh(stemGeo, tipMat);
      stem.position.y = 0.12;
      group.add(stem);

      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.08, 0),
          new THREE.Vector3(Math.cos(angle) * 0.2, -0.02, Math.sin(angle) * 0.2),
          new THREE.Vector3(Math.cos(angle) * 0.32, -0.2, Math.sin(angle) * 0.32),
        ]);
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.05, 6, false), peelMat);
        group.add(tube);
      }
    } else if (item.id === 'apple_core') {
      const fleshMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 });
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x451a03 });

      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.32, 12), fleshMat);
      group.add(core);

      const topRemnant = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.4), skinMat);
      topRemnant.position.y = 0.15;
      group.add(topRemnant);

      const botRemnant = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.4), skinMat);
      botRemnant.rotation.x = Math.PI;
      botRemnant.position.y = -0.15;
      group.add(botRemnant);

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.16, 6), stemMat);
      stem.position.set(0.02, 0.25, 0);
      stem.rotation.z = 0.2;
      group.add(stem);
    } else if (item.id === 'food_waste') {
      const c1 = new THREE.MeshStandardMaterial({ color: 0x65a30d });
      const c2 = new THREE.MeshStandardMaterial({ color: 0xb45309 });
      const c3 = new THREE.MeshStandardMaterial({ color: 0xeab308 });
      for (let i = 0; i < 5; i++) {
        const scrap = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09 + (i % 2) * 0.03), i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3);
        scrap.position.set((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.2);
        group.add(scrap);
      }
    } else if (item.id === 'plastic_bottle') {
      const petMat = new THREE.MeshPhysicalMaterial({
        color: 0xbae6fd,
        transmission: 0.8,
        opacity: 0.85,
        transparent: true,
        roughness: 0.15,
      });
      const capMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
      const labelMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9 });

      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.38, 16), petMat);
      group.add(body);
      const label = new THREE.Mesh(new THREE.CylinderGeometry(0.132, 0.132, 0.14, 16), labelMat);
      group.add(label);
      const neck = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.14, 16), petMat);
      neck.position.y = 0.25;
      group.add(neck);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 12), capMat);
      cap.position.y = 0.34;
      group.add(cap);
      group.rotation.z = Math.PI / 4;
    } else if (item.id === 'plastic_wrapper') {
      const wrapMat = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.5, roughness: 0.3 });
      const wrap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.2), wrapMat);
      wrap.rotation.set(0.3, 0.4, 0.2);
      group.add(wrap);
    } else {
      // Aluminum Can
      const canMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.2 });
      const rimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.35, 18), canMat);
      group.add(can);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 8, 18), rimMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.175;
      group.add(rim);
    }

    return group;
  };

  // Re-populate accumulated items inside bins
  const updateAccumulatedWaste = (bioCount: number, nonBioCount: number) => {
    if (!bioBinItemsGroupRef.current || !nonBioBinItemsGroupRef.current) return;

    while (bioBinItemsGroupRef.current.children.length > 0) {
      bioBinItemsGroupRef.current.remove(bioBinItemsGroupRef.current.children[0]);
    }
    while (nonBioBinItemsGroupRef.current.children.length > 0) {
      nonBioBinItemsGroupRef.current.remove(nonBioBinItemsGroupRef.current.children[0]);
    }

    // Left bin (Bio, x ~ -0.6 to -0.2)
    const bioRender = Math.min(bioCount, 12);
    for (let i = 0; i < bioRender; i++) {
      const geo = i % 2 === 0 ? new THREE.DodecahedronGeometry(0.09) : new THREE.CylinderGeometry(0.05, 0.05, 0.16, 8);
      const mat = new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0x22c55e : 0xeab308, roughness: 0.6 });
      const m = new THREE.Mesh(geo, mat);
      const row = Math.floor(i / 3);
      m.position.set(-0.5 + ((i % 3) * 0.16 - 0.16), 0.22 + row * 0.14, (Math.random() - 0.5) * 0.35);
      m.rotation.set(Math.random(), Math.random(), 0);
      bioBinItemsGroupRef.current.add(m);
    }

    // Right bin (Non-Bio, x ~ 0.2 to 0.6)
    const nonBioRender = Math.min(nonBioCount, 12);
    for (let i = 0; i < nonBioRender; i++) {
      const geo = i % 2 === 0 ? new THREE.CylinderGeometry(0.07, 0.07, 0.18, 10) : new THREE.BoxGeometry(0.15, 0.05, 0.1);
      const mat = new THREE.MeshStandardMaterial({
        color: i % 3 === 0 ? 0x0ea5e9 : i % 3 === 1 ? 0xf97316 : 0x94a3b8,
        metalness: i % 3 === 2 ? 0.9 : 0.2,
        roughness: 0.3,
      });
      const m = new THREE.Mesh(geo, mat);
      const row = Math.floor(i / 3);
      m.position.set(0.5 + ((i % 3) * 0.16 - 0.16), 0.22 + row * 0.14, (Math.random() - 0.5) * 0.35);
      m.rotation.set(Math.random(), Math.random(), 0);
      nonBioBinItemsGroupRef.current.add(m);
    }
  };

  // Main Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x060911);
      sceneRef.current = scene;

      const width = container.clientWidth;
      const height = container.clientHeight;

      // Camera positioned with optimal field of view so the entire model fits comfortably
      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(0, 2.3, 5.8);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.0);
      keyLight.position.set(3.5, 6, 4.5);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
      fillLight.position.set(-4, 3.5, 3);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xa78bfa, 0.9);
      rimLight.position.set(0, 4, -5);
      scene.add(rimLight);

      // Camera Flash Light
      const flashLight = new THREE.PointLight(0x60a5fa, 0, 4);
      flashLight.position.set(0, 2.7, 0.3);
      scene.add(flashLight);
      cameraFlashLightRef.current = flashLight;

      // Platform Stage
      const stageGeo = new THREE.CylinderGeometry(2.8, 3.0, 0.15, 40);
      const stageMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.6 });
      const stage = new THREE.Mesh(stageGeo, stageMat);
      stage.position.y = -0.08;
      stage.receiveShadow = true;
      scene.add(stage);

      const ringGeo = new THREE.RingGeometry(2.5, 2.62, 40);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.65 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 0.01;
      scene.add(ring);

      // -------------------------------------------------------------
      // SMART BIN ASSEMBLY (Scaled down by ~25% to fit cleanly into single frame)
      // -------------------------------------------------------------
      const binMainGroup = new THREE.Group();
      binMainGroup.scale.set(0.74, 0.74, 0.74);
      binMainGroup.position.set(0, -0.05, 0);
      scene.add(binMainGroup);
      binMainGroupRef.current = binMainGroup;

      const topAssembly = new THREE.Group();
      binMainGroup.add(topAssembly);
      topAssemblyGroupRef.current = topAssembly;

      const outerShell = new THREE.Group();
      binMainGroup.add(outerShell);
      outerShellRef.current = outerShell;

      const internalAssembly = new THREE.Group();
      binMainGroup.add(internalAssembly);
      internalAssemblyRef.current = internalAssembly;

      // Premium engineering materials
      const brushedSteelMat = new THREE.MeshStandardMaterial({
        color: 0xd1d5db,
        metalness: 0.92,
        roughness: 0.25,
      });

      const darkSteelMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.85,
        roughness: 0.3,
      });

      // Crystal clear transparent acrylic for full internal visibility
      const clearAcrylicMat = new THREE.MeshPhysicalMaterial({
        color: 0xf1f5f9,
        transmission: 0.92,
        opacity: 0.35,
        transparent: true,
        roughness: 0.08,
        ior: 1.48,
        reflectivity: 0.6,
        depthWrite: false,
      });

      // Translucent tinted compartment materials
      const bioGreenTranslucentMat = new THREE.MeshPhysicalMaterial({
        color: 0x10b981,
        transmission: 0.75,
        opacity: 0.65,
        transparent: true,
        roughness: 0.2,
      });

      const nonBioOrangeTranslucentMat = new THREE.MeshPhysicalMaterial({
        color: 0xf97316,
        transmission: 0.75,
        opacity: 0.65,
        transparent: true,
        roughness: 0.2,
      });

      // A. BASE RIM & CHASSIS SKELETON
      const baseRim = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.45, 0.2, 36), darkSteelMat);
      baseRim.position.y = 0.1;
      baseRim.receiveShadow = true;
      binMainGroup.add(baseRim);

      // B. TRANSPARENT LOWER CASING (Shows the two compartments inside)
      // Front half is crystal-clear transparent acrylic so you can watch waste drop into bins!
      const lowerShellGeo = new THREE.CylinderGeometry(1.35, 1.35, 1.35, 36, 1, true);
      const lowerShell = new THREE.Mesh(lowerShellGeo, clearAcrylicMat);
      lowerShell.position.y = 0.85;
      outerShell.add(lowerShell);

      // Sleek metallic structural vertical ribbing
      for (let i = 0; i < 4; i++) {
        const ribAngle = (i * Math.PI) / 2 + Math.PI / 4;
        const ribGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.35, 10);
        const rib = new THREE.Mesh(ribGeo, brushedSteelMat);
        rib.position.set(Math.cos(ribAngle) * 1.35, 0.85, Math.sin(ribAngle) * 1.35);
        outerShell.add(rib);
      }

      // Middle separator ring between lower bins and inspection window
      const midRing = new THREE.Mesh(new THREE.CylinderGeometry(1.38, 1.38, 0.08, 36), darkSteelMat);
      midRing.position.y = 1.52;
      outerShell.add(midRing);

      // C. INTERNAL DUAL COMPARTMENTS (Bio on Left -X, Non-Bio on Right +X)
      const dividerMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.4, 2.5), darkSteelMat);
      dividerMesh.position.set(0, 0.8, 0);
      internalAssembly.add(dividerMesh);

      // Left Bio Compartment Liner (Green glowing translucent bed)
      const bioLiner = new THREE.Mesh(
        new THREE.CylinderGeometry(1.28, 1.28, 1.3, 20, 1, false, Math.PI * 0.5, Math.PI),
        bioGreenTranslucentMat
      );
      bioLiner.position.set(-0.02, 0.8, 0);
      internalAssembly.add(bioLiner);

      // Left Bio Floor Glowing Ring
      const bioFloorLed = new THREE.Mesh(
        new THREE.RingGeometry(0.3, 1.1, 24),
        new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.4 })
      );
      bioFloorLed.rotateX(-Math.PI / 2);
      bioFloorLed.position.set(-0.6, 0.16, 0);
      internalAssembly.add(bioFloorLed);

      // Right Non-Bio Compartment Liner (Orange glowing translucent bed)
      const nonBioLiner = new THREE.Mesh(
        new THREE.CylinderGeometry(1.28, 1.28, 1.3, 20, 1, false, -Math.PI * 0.5, Math.PI),
        nonBioOrangeTranslucentMat
      );
      nonBioLiner.position.set(0.02, 0.8, 0);
      internalAssembly.add(nonBioLiner);

      // Right Non-Bio Floor Glowing Ring
      const nonBioFloorLed = new THREE.Mesh(
        new THREE.RingGeometry(0.3, 1.1, 24),
        new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.4 })
      );
      nonBioFloorLed.rotateX(-Math.PI / 2);
      nonBioFloorLed.position.set(0.6, 0.16, 0);
      internalAssembly.add(nonBioFloorLed);

      // Accumulated waste item groups
      const bioBinGroup = new THREE.Group();
      internalAssembly.add(bioBinGroup);
      bioBinItemsGroupRef.current = bioBinGroup;

      const nonBioBinGroup = new THREE.Group();
      internalAssembly.add(nonBioBinGroup);
      nonBioBinItemsGroupRef.current = nonBioBinGroup;

      // External compartment label plaques
      const bioLabel = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.22, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 })
      );
      bioLabel.position.set(-0.7, 0.85, 1.3);
      bioLabel.rotation.y = 0.25;
      outerShell.add(bioLabel);

      const nonBioLabel = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.22, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 })
      );
      nonBioLabel.position.set(0.7, 0.85, 1.3);
      nonBioLabel.rotation.y = -0.25;
      outerShell.add(nonBioLabel);

      // D. TRANSPARENT OBSERVATION SECTION (Middle Chamber)
      const midWindow = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 1.15, 36, 1, true), clearAcrylicMat);
      midWindow.position.y = 2.12;
      internalAssembly.add(midWindow);

      // E. MECHANICAL SORTING FLAP & SERVO ACTUATOR
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.5, 12), darkSteelMat);
      shaft.rotateX(Math.PI / 2);
      shaft.position.set(0, 1.95, 0);
      internalAssembly.add(shaft);

      // Flap Group (Tilts around Z axis: -Z tilts left to Bio, +Z tilts right to Non-Bio)
      const flapGroup = new THREE.Group();
      flapGroup.position.set(0, 1.95, 0);
      internalAssembly.add(flapGroup);
      flapGroupRef.current = flapGroup;

      // Sorting blade plate
      const flapPlate = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.03, 1.2), brushedSteelMat);
      flapPlate.castShadow = true;
      flapPlate.receiveShadow = true;
      flapGroup.add(flapPlate);

      // Retaining guides on flap
      const frontGuide = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.14, 0.02), darkSteelMat);
      frontGuide.position.set(0, 0.07, 0.58);
      flapGroup.add(frontGuide);

      const backGuide = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.14, 0.02), darkSteelMat);
      backGuide.position.set(0, 0.07, -0.58);
      flapGroup.add(backGuide);

      // SG90/MG995 Servo Motor on the side
      const servoMotor = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.28, 0.14),
        new THREE.MeshStandardMaterial({ color: 0x1d4ed8 })
      );
      servoMotor.position.set(1.05, 1.95, 0);
      internalAssembly.add(servoMotor);

      const servoArmGroup = new THREE.Group();
      servoArmGroup.position.set(0.95, 1.95, 0);
      internalAssembly.add(servoArmGroup);
      servoArmRef.current = servoArmGroup;

      const horn = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.16, 8),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      horn.rotation.x = Math.PI / 2;
      servoArmGroup.add(horn);

      // Push rod linkage
      const pushRod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.25, 8),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 })
      );
      pushRod.rotation.z = Math.PI / 4;
      pushRod.position.set(-0.1, 0, 0);
      servoArmGroup.add(pushRod);

      // F. EMBEDDED ELECTRONICS MODULES
      // ESP32-S3 PCB
      const esp32Pcb = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.36, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 })
      );
      esp32Pcb.position.set(0.8, 2.45, -0.6);
      esp32Pcb.rotation.y = -Math.PI / 5;
      internalAssembly.add(esp32Pcb);

      const rfShield = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.16, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xc0c4cc, metalness: 0.9, roughness: 0.2 })
      );
      rfShield.position.set(0, 0.04, 0.015);
      esp32Pcb.add(rfShield);

      // PCA9685 PWM Driver
      const pcaPcb = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.24, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 })
      );
      pcaPcb.position.set(0.8, 2.05, -0.6);
      pcaPcb.rotation.y = -Math.PI / 5;
      internalAssembly.add(pcaPcb);

      // Camera Module (OV2640 with downward angle)
      const camMount = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.06), darkSteelMat);
      camMount.position.set(0, 2.65, 0.5);
      camMount.rotation.x = Math.PI / 4;
      internalAssembly.add(camMount);

      const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 0.06, 16),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.1 })
      );
      lens.rotateX(Math.PI / 2);
      lens.position.set(0, 0, -0.04);
      camMount.add(lens);

      // IR Optical Gate & Beam
      const irBodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
      const irSensorLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.04), irBodyMat);
      irSensorLeft.position.set(-0.85, 2.3, 0);
      internalAssembly.add(irSensorLeft);

      const irSensorRight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.04), irBodyMat);
      irSensorRight.position.set(0.85, 2.3, 0);
      internalAssembly.add(irSensorRight);

      // Modulated IR beam across chamber
      const irBeamGeo = new THREE.CylinderGeometry(0.008, 0.008, 1.7, 8);
      irBeamGeo.rotateZ(Math.PI / 2);
      const irBeamMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.3 });
      const irBeam = new THREE.Mesh(irBeamGeo, irBeamMat);
      irBeam.position.set(0, 2.3, 0);
      internalAssembly.add(irBeam);
      irBeamMeshRef.current = irBeam;

      // Dual Ultrasonic Sensors
      const createUS = (xPos: number, c: number) => {
        const g = new THREE.Group();
        g.position.set(xPos, 2.48, 0);
        g.rotation.x = Math.PI / 2;
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.02), new THREE.MeshStandardMaterial({ color: c }));
        g.add(b);
        const cyl = new THREE.CylinderGeometry(0.04, 0.04, 0.05, 14);
        cyl.rotateX(Math.PI / 2);
        const bMat = new THREE.MeshStandardMaterial({ color: 0xc0c4cc, metalness: 0.85 });
        const t = new THREE.Mesh(cyl, bMat);
        t.position.set(-0.07, 0, 0.03);
        g.add(t);
        const r = new THREE.Mesh(cyl, bMat);
        r.position.set(0.07, 0, 0.03);
        g.add(r);
        return g;
      };

      internalAssembly.add(createUS(-0.6, 0x10b981));
      internalAssembly.add(createUS(0.6, 0xf97316));

      // Ultrasonic pulse rings
      const pulseGeo = new THREE.RingGeometry(0.1, 0.42, 24);
      pulseGeo.rotateX(-Math.PI / 2);
      const pulseBio = new THREE.Mesh(
        pulseGeo,
        new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0, side: THREE.DoubleSide })
      );
      pulseBio.position.set(-0.6, 2.4, 0);
      internalAssembly.add(pulseBio);
      ultrasonicPulseBioRef.current = pulseBio;

      const pulseNonBio = new THREE.Mesh(
        pulseGeo,
        new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0, side: THREE.DoubleSide })
      );
      pulseNonBio.position.set(0.6, 2.4, 0);
      internalAssembly.add(pulseNonBio);
      ultrasonicPulseNonBioRef.current = pulseNonBio;

      // G. TOP COLLAR & TILTING TOP CAP / LID MECHANISM
      const topCollar = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.38, 0.22, 36), brushedSteelMat);
      topCollar.position.y = 2.8;
      topAssembly.add(topCollar);

      // Inner funnel chute
      const chute = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.75, 0.3, 32, 1, true), darkSteelMat);
      chute.position.y = 2.75;
      topAssembly.add(chute);

      const funnelLip = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.035, 12, 36), brushedSteelMat);
      funnelLip.rotateX(Math.PI / 2);
      funnelLip.position.y = 2.91;
      topAssembly.add(funnelLip);

      // MOTORIZED TILTING TOP CAP / LID (Centered at x: 0, y: 2.93, z: 0)
      // Tilts directly to the side where the waste has to be dropped (Left for Bio, Right for Non-Bio)
      const topCapHingeGroup = new THREE.Group();
      topCapHingeGroup.position.set(0, 2.93, 0);
      topAssembly.add(topCapHingeGroup);
      topCapGroupRef.current = topCapHingeGroup;

      // Transparent circular cap disk with brushed steel bezel centered on pivot
      const capDiskGeo = new THREE.CylinderGeometry(0.84, 0.84, 0.03, 32);
      const capDisk = new THREE.Mesh(capDiskGeo, clearAcrylicMat);
      capDisk.position.set(0, 0, 0);
      topCapHingeGroup.add(capDisk);

      // Cap metallic rim
      const capRim = new THREE.Mesh(new THREE.TorusGeometry(0.84, 0.025, 8, 32), brushedSteelMat);
      capRim.rotateX(Math.PI / 2);
      capRim.position.set(0, 0, 0);
      topCapHingeGroup.add(capRim);

      // Central directional tilt pivot axle
      const hingeCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.76, 12), darkSteelMat);
      hingeCyl.rotateX(Math.PI / 2);
      topCapHingeGroup.add(hingeCyl);

      // H. TOP DIGITAL OLED DISPLAY
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.7, 16), darkSteelMat);
      stalk.position.set(0, 3.25, -0.92);
      topAssembly.add(stalk);

      const displayHousing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.75, 0.12), darkSteelMat);
      displayHousing.position.set(0, 3.65, -0.78);
      displayHousing.rotation.x = -0.15;
      topAssembly.add(displayHousing);

      const bezel = new THREE.Mesh(
        new THREE.BoxGeometry(1.52, 0.67, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
      );
      bezel.position.set(0, 0, 0.055);
      displayHousing.add(bezel);

      // Canvas Texture Screen
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 160;
      lcdCanvasRef.current = canvas;

      const lcdTexture = new THREE.CanvasTexture(canvas);
      lcdTexture.minFilter = THREE.LinearFilter;
      lcdTexture.magFilter = THREE.LinearFilter;
      lcdTextureRef.current = lcdTexture;

      const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.44, 0.58), new THREE.MeshBasicMaterial({ map: lcdTexture }));
      screenMesh.position.set(0, 0, 0.068);
      displayHousing.add(screenMesh);

      updateLcdCanvas(displayText, bioFillPercent, nonBioFillPercent);

      // I. FALLING OBJECT CONTAINER (Within bin coordinate system)
      const fallingGroup = new THREE.Group();
      binMainGroup.add(fallingGroup);
      fallingItemMeshRef.current = fallingGroup;

      updateAccumulatedWaste(bioWasteCount, nonBioWasteCount);

      // 4. Orbit Controls (Clean custom implementation)
      let isDragging = false;
      let prevMouseX = 0;
      let prevMouseY = 0;
      let spherical = {
        radius: 5.8,
        theta: 0,
        phi: 1.25,
      };

      const onMouseDown = (e: MouseEvent) => {
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        spherical.theta -= deltaX * 0.007;
        spherical.phi -= deltaY * 0.007;
        spherical.phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, spherical.phi));
      };

      const onMouseUp = () => {
        isDragging = false;
      };

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        spherical.radius += e.deltaY * 0.004;
        spherical.radius = Math.max(3.2, Math.min(10, spherical.radius));
      };

      const domElem = renderer.domElement;
      domElem.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      domElem.addEventListener('wheel', onWheel, { passive: false });

      // Resize listener
      const handleResize = () => {
        if (!container || !rendererRef.current || !cameraRef.current) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);

      // 5. High-FPS Physics & Animation Loop
      let animationFrameId: number;
      let clock = new THREE.Clock();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // 1. Camera Orbit & Preset Lerp
        if (!isDragging) {
          camera.position.lerp(targetCamPos.current, 0.06);
          currentCamLook.current.lerp(targetCamLook.current, 0.06);
          camera.lookAt(currentCamLook.current);

          const offset = camera.position.clone().sub(currentCamLook.current);
          spherical.radius = offset.length();
          spherical.phi = Math.acos(Math.max(-1, Math.min(1, offset.y / spherical.radius)));
          spherical.theta = Math.atan2(offset.x, offset.z);
        } else {
          camera.position.x =
            currentCamLook.current.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
          camera.position.y = currentCamLook.current.y + spherical.radius * Math.cos(spherical.phi);
          camera.position.z =
            currentCamLook.current.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
          camera.lookAt(currentCamLook.current);
          targetCamPos.current.copy(camera.position);
        }

        // 2. Tilting Top Cap Side Interpolation
        // Tilts directly toward the destination compartment: left (-Z) for Bio, right (+Z) for Non-Bio
        if (topCapGroupRef.current) {
          topCapGroupRef.current.rotation.z = THREE.MathUtils.lerp(
            topCapGroupRef.current.rotation.z,
            topCapTargetAngleZ.current,
            0.15
          );
        }

        // 3. Servo Flap Rotation Interpolation
        if (flapGroupRef.current) {
          const targetRad = (servoAngle * Math.PI) / 180;
          flapGroupRef.current.rotation.z = THREE.MathUtils.lerp(flapGroupRef.current.rotation.z, targetRad, 0.16);
        }
        if (servoArmRef.current) {
          const targetRad = (-servoAngle * Math.PI) / 180;
          servoArmRef.current.rotation.z = THREE.MathUtils.lerp(servoArmRef.current.rotation.z, targetRad, 0.16);
        }

        // 4. Smooth Physics Trajectory for Falling Item
        if (fallingItemMeshRef.current) {
          itemCurrentPos.current.lerp(itemTargetPos.current, 0.15);
          fallingItemMeshRef.current.position.copy(itemCurrentPos.current);

          fallingItemMeshRef.current.rotation.x = THREE.MathUtils.lerp(
            fallingItemMeshRef.current.rotation.x,
            itemTargetRot.current.x,
            0.15
          );
          fallingItemMeshRef.current.rotation.y = THREE.MathUtils.lerp(
            fallingItemMeshRef.current.rotation.y,
            itemTargetRot.current.y,
            0.15
          );
          fallingItemMeshRef.current.rotation.z = THREE.MathUtils.lerp(
            fallingItemMeshRef.current.rotation.z,
            itemTargetRot.current.z,
            0.15
          );
        }

        // 5. Exploded View Height Shifts
        if (topAssemblyGroupRef.current && outerShellRef.current) {
          const exp = explodedProgress;
          topAssemblyGroupRef.current.position.y = exp * 1.4;
          outerShellRef.current.position.y = -exp * 0.7;
          const scale = 1 + exp * 0.16;
          outerShellRef.current.scale.set(scale, 1, scale);
        }

        // 6. Platform ring pulsing
        ringMat.opacity = 0.45 + Math.sin(elapsedTime * 2.5) * 0.2;

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
        domElem.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        domElem.removeEventListener('wheel', onWheel);
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    } catch (err) {
      console.error('WebGL Initialization error:', err);
      setWebglSupported(false);
    }
  }, []);

  // Camera Presets
  useEffect(() => {
    switch (cameraPreset) {
      case 'front':
        targetCamPos.current.set(0, 2.3, 5.8);
        targetCamLook.current.set(0, 1.45, 0);
        break;
      case 'top':
        targetCamPos.current.set(0, 5.2, 0.1);
        targetCamLook.current.set(0, 1.45, 0);
        break;
      case 'side':
        targetCamPos.current.set(4.8, 2.2, 0);
        targetCamLook.current.set(0, 1.45, 0);
        break;
      case 'internal':
        targetCamPos.current.set(0, 1.9, 2.6);
        targetCamLook.current.set(0, 1.6, 0);
        break;
      case 'exploded':
        targetCamPos.current.set(3.2, 2.7, 4.8);
        targetCamLook.current.set(0, 1.4, 0);
        break;
    }
  }, [cameraPreset]);

  // Update dynamic LCD Canvas
  useEffect(() => {
    updateLcdCanvas(displayText, bioFillPercent, nonBioFillPercent);
  }, [displayText, bioFillPercent, nonBioFillPercent]);

  // Update Accumulated Waste Count in Bins
  useEffect(() => {
    updateAccumulatedWaste(bioWasteCount, nonBioWasteCount);
  }, [bioWasteCount, nonBioWasteCount]);

  // Manage physical item trajectory and top-cap tilting along simulation sequence
  useEffect(() => {
    if (!fallingItemMeshRef.current) return;
    const itemContainer = fallingItemMeshRef.current;

    // Reset state when idle
    if (phase === 'idle' || !currentItem) {
      topCapTargetAngleZ.current = 0; // Cap centered horizontal
      while (itemContainer.children.length > 0) {
        itemContainer.remove(itemContainer.children[0]);
      }
      if (irBeamMeshRef.current) {
        (irBeamMeshRef.current.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
        (irBeamMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3;
      }
      if (cameraFlashLightRef.current) {
        cameraFlashLightRef.current.intensity = 0;
      }
      if (ultrasonicPulseBioRef.current) {
        (ultrasonicPulseBioRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
      }
      if (ultrasonicPulseNonBioRef.current) {
        (ultrasonicPulseNonBioRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
      }
      return;
    }

    // Ensure 3D waste item is created
    if (itemContainer.children.length === 0 && currentItem) {
      const mesh = createWasteMesh(currentItem);
      itemContainer.add(mesh);
    }

    const isBio = currentItem.type === 'biodegradable';
    // TILT TO THE SIDE WHERE WASTE HAS TO BE DROPPED:
    // Left (-Z angle: -38 degrees) for Biodegradable side
    // Right (+Z angle: +38 degrees) for Non-Biodegradable side
    const sideTiltAngle = isBio ? -0.66 : 0.66;

    // Phase trajectories:
    if (phase === 'dropping') {
      // 1. TILT THE SIDE WHERE THE WASTE HAS TO BE DROPPED
      topCapTargetAngleZ.current = sideTiltAngle;

      // Item falls towards the tilted side of the opening into the chute
      const dropSideX = isBio ? -0.25 : 0.25;
      itemCurrentPos.current.set(dropSideX, 3.8, 0);
      itemTargetPos.current.set(dropSideX * 0.6, 2.7, 0);
      itemTargetRot.current.set(0, 0, isBio ? -0.3 : 0.3);
    } else if (phase === 'ir_detecting') {
      // Keep tilted toward the dropped side while passing the IR beam
      topCapTargetAngleZ.current = sideTiltAngle;
      itemTargetPos.current.set(isBio ? -0.15 : 0.15, 2.25, 0);

      // Red trip effect on IR beam
      if (irBeamMeshRef.current) {
        (irBeamMeshRef.current.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
        (irBeamMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.95;
      }
    } else if (phase === 'camera_capturing') {
      // Sits on horizontal flap at y = 2.02
      topCapTargetAngleZ.current = sideTiltAngle;
      itemTargetPos.current.set(0, 2.02, 0);
      itemTargetRot.current.set(0, 0, 0);

      if (irBeamMeshRef.current) {
        (irBeamMeshRef.current.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
        (irBeamMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.35;
      }

      // Camera Flash strobe
      if (cameraFlashLightRef.current) {
        cameraFlashLightRef.current.intensity = 3.5;
        setTimeout(() => {
          if (cameraFlashLightRef.current) cameraFlashLightRef.current.intensity = 0;
        }, 280);
      }
    } else if (phase === 'ai_analyzing' || phase === 'decision_logic') {
      // Resting on inspection center
      topCapTargetAngleZ.current = sideTiltAngle;
      itemTargetPos.current.set(0, 2.02, 0);
    } else if (phase === 'servo_activating') {
      // Flap tilts: item stays on blade as it begins tilting
      topCapTargetAngleZ.current = sideTiltAngle;
      itemTargetPos.current.set(0, 2.02, 0);
    } else if (phase === 'sorting_slide') {
      // PHYSICAL FALLING INTO BIODEGRADABLE (Left, -X) OR NON-BIODEGRADABLE (Right, +X) SIDE:
      // The item slides down the tilted flap and drops through transparent chamber into the bin below!
      const targetX = isBio ? -0.58 : 0.58;
      itemTargetPos.current.set(targetX, 0.45, (Math.random() - 0.5) * 0.25);
      itemTargetRot.current.set(isBio ? -0.6 : 0.6, Math.PI * 0.4, isBio ? -Math.PI * 0.45 : Math.PI * 0.45);
    } else if (phase === 'ultrasonic_measuring') {
      // Sorting is complete: top cap returns back to level neutral position (0°)
      topCapTargetAngleZ.current = 0;

      // Item has landed in the bottom compartment; ultrasonic beam pulses
      const targetX = isBio ? -0.58 : 0.58;
      itemTargetPos.current.set(targetX, 0.35, 0);

      const pulse = isBio ? ultrasonicPulseBioRef.current : ultrasonicPulseNonBioRef.current;
      if (pulse) {
        (pulse.material as THREE.MeshBasicMaterial).opacity = 0.9;
        pulse.position.y = 2.4;
        let dist = 2.4;
        const interval = setInterval(() => {
          dist -= 0.15;
          if (pulse) pulse.position.y = dist;
          if (dist <= 0.65) {
            clearInterval(interval);
            if (pulse) (pulse.material as THREE.MeshBasicMaterial).opacity = 0;
          }
        }, 30);
      }
    } else if (phase === 'complete') {
      topCapTargetAngleZ.current = 0;
      // Object joins the permanent pile in the bin
      while (itemContainer.children.length > 0) {
        itemContainer.remove(itemContainer.children[0]);
      }
    }
  }, [phase, currentItem]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden rounded-xl bg-slate-950 border border-slate-800 shadow-2xl">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {!webglSupported && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-slate-300 p-6 text-center">
          <p className="font-sans text-sm">
            WebGL acceleration is unavailable. Please verify browser hardware acceleration.
          </p>
        </div>
      )}

      {/* Floating HUD Indicator */}
      <div className="absolute top-2.5 left-2.5 pointer-events-none flex items-center gap-2 text-[10px] font-mono text-slate-300 bg-slate-900/85 px-2.5 py-1 rounded backdrop-blur border border-slate-700/60 shadow">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        <span className="font-semibold text-cyan-200">TRANSPARENT SMART BIN</span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">LEFT: BIO (GREEN) · RIGHT: NON-BIO (ORANGE)</span>
      </div>

      {/* Exploded View Tag */}
      {explodedProgress > 0.05 && (
        <div className="absolute bottom-2.5 left-2.5 pointer-events-none flex items-center gap-1.5 text-[10px] font-mono text-amber-300 bg-amber-950/85 px-2.5 py-1 rounded backdrop-blur border border-amber-700/60">
          <span>EXPLODED CHASSIS INSPECTION ({Math.round(explodedProgress * 100)}%)</span>
        </div>
      )}
    </div>
  );
};
