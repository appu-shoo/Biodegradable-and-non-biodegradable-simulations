/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Layers,
  Activity,
  Cpu,
  Wifi,
  Radio,
  RotateCcw,
  Play,
  Pause,
  Shuffle,
  Camera,
  Terminal,
  TrendingUp,
  MapPin,
  Workflow,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  CameraPreset,
  HardwareState,
  LogEntry,
  SimulationPhase,
  WasteHistoryItem,
  WasteItemDef,
} from './types/simulation';
import { WASTE_CATALOG } from './data/wasteCatalog';
import { SmartBinScene } from './components/ThreeScene/SmartBinScene';
import { DigitalDisplayPanel } from './components/DigitalDisplayPanel';
import { CameraViewfinder } from './components/CameraViewfinder';
import { ArchitectureFlow } from './components/ArchitectureFlow';
import { HardwareStatusPanel } from './components/HardwareStatusPanel';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { IoTFleetMap } from './components/IoTFleetMap';
import { SystemLogPanel } from './components/SystemLogPanel';
import { ControlToolbar } from './components/ControlToolbar';

export default function App() {
  // 1. Simulation Phase & Active Item
  const [phase, setPhase] = useState<SimulationPhase>('idle');
  const [currentItem, setCurrentItem] = useState<WasteItemDef | null>(null);
  const [displayText, setDisplayText] = useState<string>('ECOCHAINAI – SMART WASTE BIN');

  // 2. Hardware Driver & Sensor State
  const [servoAngle, setServoAngle] = useState<number>(0); // -40 (Bio), 0 (Neutral), +40 (Non-Bio)
  const [bioFillPercent, setBioFillPercent] = useState<number>(24);
  const [nonBioFillPercent, setNonBioFillPercent] = useState<number>(18);
  const [bioCount, setBioCount] = useState<number>(2);
  const [nonBioCount, setNonBioCount] = useState<number>(2);
  const [bioWeightGrams, setBioWeightGrams] = useState<number>(125);
  const [nonBioWeightGrams, setNonBioWeightGrams] = useState<number>(58);

  // 3. Camera & Exploded View Controls
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('front');
  const [explodedProgress, setExplodedProgress] = useState<number>(0);

  // 4. Single-Frame Bottom Inspector Tab
  const [activeTab, setActiveTab] = useState<'pipeline' | 'hardware' | 'analytics' | 'iot' | 'logs'>('pipeline');

  // 5. Demo Autopilot State
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const demoIndexRef = useRef<number>(0);

  // 6. History & Logs
  const [history, setHistory] = useState<WasteHistoryItem[]>([
    {
      id: 'init-1',
      name: 'Apple Core',
      type: 'biodegradable',
      confidence: 96.5,
      time: '10:14:02',
      weightGrams: 50,
    },
    {
      id: 'init-2',
      name: 'Plastic Bottle',
      type: 'non-biodegradable',
      confidence: 97.4,
      time: '10:15:30',
      weightGrams: 30,
    },
  ]);

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'log-1',
      timestamp: '10:14:00',
      layer: 'Processing',
      level: 'INFO',
      message: 'ESP32-S3 bootloader online. Flash: 8MB. Clock: 240MHz. I2C Bus ready.',
    },
    {
      id: 'log-2',
      timestamp: '10:14:01',
      layer: 'Actuation',
      level: 'INFO',
      message: 'PCA9685 12-bit PWM servo driver linked at 0x40. Neutral locked at 1500µs.',
    },
    {
      id: 'log-3',
      timestamp: '10:14:02',
      layer: 'Sensing',
      level: 'SUCCESS',
      message: 'IR optical gate, OV2640 camera, and dual ultrasonic sensors calibrated.',
    },
  ]);

  const addLog = useCallback(
    (
      layer: 'Sensing' | 'Processing' | 'Actuation' | 'Output' | 'Cloud',
      level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT',
      message: string,
      metadata?: string
    ) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const newEntry: LogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: timeStr,
        layer,
        level,
        message,
        metadata,
      };
      setLogs((prev) => [...prev, newEntry]);
    },
    []
  );

  const getWarningLevel = (percent: number) => {
    if (percent >= 100) return 'BIN FULL';
    if (percent >= 90) return 'CAPACITY ALERT';
    if (percent >= 70) return 'HIGH';
    return 'NORMAL';
  };

  // Hardware telemetry bus state
  const hardwareState: HardwareState = {
    esp32: {
      status: phase !== 'idle' && phase !== 'complete' ? 'PROCESSING' : 'ONLINE',
      cpuLoad: phase !== 'idle' ? 42 : 12,
      clockSpeed: '240 MHz (Xtensa Dual)',
      ramFree: '284 KB',
      tempC: 38.4 + (phase !== 'idle' ? 2.5 : 0),
    },
    pca9685: {
      status: servoAngle !== 0 ? 'DRIVING' : 'STANDBY',
      i2cAddress: '0x40 (I2C-1)',
      pwmFreq: '50 Hz (20ms cycle)',
      activeChannel: servoAngle < 0 ? 0 : servoAngle > 0 ? 1 : null,
      pulseWidthUs: servoAngle < 0 ? 1000 : servoAngle > 0 ? 2000 : 1500,
    },
    servo: {
      angle: servoAngle,
      targetAngle: servoAngle,
      status:
        servoAngle < 0
          ? 'TILTING_BIO'
          : servoAngle > 0
          ? 'TILTING_NON_BIO'
          : phase === 'servo_activating' || phase === 'sorting_slide'
          ? 'RETURNING'
          : 'HOLD',
      torqueNm: 9.8,
    },
    camera: {
      status: phase === 'camera_capturing' || phase === 'ai_analyzing' ? 'ACQUIRING' : 'STREAMING',
      model: 'OV2640 UXGA 2MP',
      resolution: '1600 × 1200 px',
      lastInferenceMs: 138,
      fps: 30,
    },
    irSensor: {
      triggered: phase === 'ir_detecting' || phase === 'camera_capturing',
      beamStrength: 98,
      distanceCm: 4.2,
    },
    moistureSensor: {
      level: currentItem ? currentItem.moisture : 'DRY',
      analogMv: currentItem ? (currentItem.moisture === 'HIGH' ? 2450 : 340) : 120,
      percentage: currentItem ? currentItem.moistureValue : 0,
    },
    ultrasonicBio: {
      distanceCm: Math.max(5, 45 - (bioFillPercent / 100) * 40),
      fillPercent: bioFillPercent,
      warningLevel: getWarningLevel(bioFillPercent),
    },
    ultrasonicNonBio: {
      distanceCm: Math.max(5, 45 - (nonBioFillPercent / 100) * 40),
      fillPercent: nonBioFillPercent,
      warningLevel: getWarningLevel(nonBioFillPercent),
    },
  };

  // Execute complete waste drop sequence
  const executeWasteDrop = useCallback(
    (item: WasteItemDef) => {
      if (phase !== 'idle' && phase !== 'complete') return;

      const isBio = item.type === 'biodegradable';
      const targetPercent = isBio ? bioFillPercent : nonBioFillPercent;

      // 100% capacity threshold check
      if (targetPercent >= 100) {
        setDisplayText(`BIN FULL: ${isBio ? 'BIO' : 'NON-BIO'} REJECTED`);
        addLog(
          'Output',
          'ALERT',
          `Deposit rejected: ${isBio ? 'Biodegradable' : 'Non-Biodegradable'} compartment is 100% full! Empty bin to proceed.`
        );
        return;
      }

      setCurrentItem(item);
      setPhase('dropping');
      setDisplayText('READY FOR WASTE');
      addLog(
        'Sensing',
        'INFO',
        `Waste deposit initiated: ${item.name} (${item.type}). Tilting top cap toward ${isBio ? 'left (Biodegradable)' : 'right (Non-Biodegradable)'} side.`
      );

      // 1. T+400ms: IR Optical Beam detection
      setTimeout(() => {
        setPhase('ir_detecting');
        setDisplayText('WASTE DETECTED');
        addLog('Sensing', 'SUCCESS', 'IR presence beam interrupted by falling object.');

        // 2. T+950ms: Camera Shutter & Strobe Flash
        setTimeout(() => {
          setPhase('camera_capturing');
          setDisplayText('IMAGE CAPTURED');
          addLog('Sensing', 'INFO', 'OV2640 camera shutter triggered. UXGA frame grabbed to buffer.');

          // 3. T+1550ms: AI Classification & Moisture Probe
          setTimeout(() => {
            setPhase('ai_analyzing');
            const classLabel = item.type === 'biodegradable' ? 'BIODEGRADABLE' : 'NON-BIODEGRADABLE';
            setDisplayText(`${classLabel} – Confidence: ${item.confidence.toFixed(0)}%`);
            addLog(
              'Processing',
              'SUCCESS',
              `MobileNetV3 Edge CNN classified: ${classLabel} (${item.confidence.toFixed(1)}%). Moisture: ${item.moisture} (${item.moistureValue}%).`
            );

            // 4. T+2350ms: ESP32 Decision Logic
            setTimeout(() => {
              setPhase('decision_logic');
              setDisplayText('SORTING...');
              const targetCh = isBio ? 0 : 1;
              addLog(
                'Processing',
                'INFO',
                `ESP32 routing decision: Dispatching PCA9685 Channel ${targetCh} to ${item.type} compartment.`
              );

              // 5. T+2900ms: Servo Actuation (Tilting Flap left for Bio, right for Non-Bio)
              setTimeout(() => {
                setPhase('servo_activating');
                setDisplayText('SERVO ACTIVATED');
                const targetAngle = isBio ? -40 : 40;
                setServoAngle(targetAngle);
                addLog(
                  'Actuation',
                  'SUCCESS',
                  `PCA9685 PWM pulse sent. Servo rotated flap to ${targetAngle}° (${isBio ? 'Bio Left' : 'Non-Bio Right'}).`
                );

                // 6. T+3500ms: Object slides down into compartment
                setTimeout(() => {
                  setPhase('sorting_slide');
                  setDisplayText('SORTING...');
                  addLog('Actuation', 'INFO', `Object sliding down flap into ${item.type} compartment.`);

                  // 7. T+4200ms: Ultrasonic Fill Measurement & Reset Flap
                  setTimeout(() => {
                    setPhase('ultrasonic_measuring');
                    setServoAngle(0); // Flap returns to neutral horizontal

                    const increment = Math.round(10 + Math.random() * 5); // 10-15%
                    let newBio = bioFillPercent;
                    let newNonBio = nonBioFillPercent;

                    if (isBio) {
                      newBio = Math.min(100, bioFillPercent + increment);
                      setBioFillPercent(newBio);
                      setBioCount((c) => c + 1);
                      setBioWeightGrams((w) => w + item.weightGrams);
                    } else {
                      newNonBio = Math.min(100, nonBioFillPercent + increment);
                      setNonBioFillPercent(newNonBio);
                      setNonBioCount((c) => c + 1);
                      setNonBioWeightGrams((w) => w + item.weightGrams);
                    }

                    setDisplayText('SORTING COMPLETE');
                    addLog(
                      'Sensing',
                      'SUCCESS',
                      `HC-SR04 ultrasonic echo measured. ${isBio ? 'Bio' : 'Non-Bio'} fill updated to ${isBio ? newBio : newNonBio}%.`
                    );
                    addLog('Output', 'INFO', 'OLED display & IoT telemetry synchronizing.');

                    const now = new Date();
                    setHistory((prev) => [
                      {
                        id: `item-${Date.now()}`,
                        name: item.name,
                        type: item.type,
                        confidence: item.confidence,
                        time: now.toTimeString().split(' ')[0],
                        weightGrams: item.weightGrams,
                      },
                      ...prev.slice(0, 19),
                    ]);

                    // 8. T+5200ms: Return to ready state
                    setTimeout(() => {
                      setPhase('complete');
                      setDisplayText('READY FOR WASTE');
                      setTimeout(() => {
                        setPhase('idle');
                        setDisplayText('ECOCHAINAI – SMART WASTE BIN');
                      }, 900);
                    }, 900);
                  }, 700);
                }, 600);
              }, 550);
            }, 550);
          }, 800);
        }, 550);
      }, 400);
    },
    [phase, bioFillPercent, nonBioFillPercent, addLog]
  );

  // Demo autopilot loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isDemoRunning && (phase === 'idle' || phase === 'complete')) {
      timer = setTimeout(() => {
        const item = WASTE_CATALOG[demoIndexRef.current % WASTE_CATALOG.length];
        demoIndexRef.current += 1;
        executeWasteDrop(item);
      }, 1500);
    }
    return () => clearTimeout(timer);
  }, [isDemoRunning, phase, executeWasteDrop]);

  const handleDropRandom = () => {
    const randomIndex = Math.floor(Math.random() * WASTE_CATALOG.length);
    executeWasteDrop(WASTE_CATALOG[randomIndex]);
  };

  const handleResetSystem = () => {
    setIsDemoRunning(false);
    setPhase('idle');
    setCurrentItem(null);
    setServoAngle(0);
    setBioFillPercent(0);
    setNonBioFillPercent(0);
    setBioCount(0);
    setNonBioCount(0);
    setBioWeightGrams(0);
    setNonBioWeightGrams(0);
    setDisplayText('ECOCHAINAI – SMART WASTE BIN');
    addLog('Processing', 'WARNING', 'System reset issued. Dual compartment fill levels reset to 0%. Flap centered.');
  };

  const handleToggleExplodedView = () => {
    if (explodedProgress === 0) {
      setCameraPreset('exploded');
      setExplodedProgress(1);
      addLog('Actuation', 'INFO', 'Chassis exploded view engaged.');
    } else {
      setExplodedProgress(0);
      setCameraPreset('front');
      addLog('Actuation', 'INFO', 'Chassis returned to standard sealed view.');
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 font-sans select-none overflow-x-hidden overflow-y-auto lg:overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP BAR CONTRACT: Single text wordmark · Nav/Status · Actions */}
      {/* ------------------------------------------------------------- */}
      <header className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950/95 backdrop-blur z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
          <span className="text-sm md:text-base font-bold tracking-tight text-white font-mono">
            EcoChainAI
          </span>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            · Smart Waste Segregation 3D Simulation
          </span>
        </div>

        {/* Status Indicators */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Wifi className="w-3.5 h-3.5" /> ESP32 ONLINE
          </span>
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Cpu className="w-3.5 h-3.5" /> PCA9685 ACTIVE
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <Radio className="w-3.5 h-3.5" /> 940nm IR ARMED
          </span>
        </div>

        {/* Global Demo & Reset buttons */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setIsDemoRunning((p) => !p)}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              isDemoRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md'
            }`}
          >
            {isDemoRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Stop Demo
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Start Auto Demo
              </>
            )}
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN SINGLE-FRAME COCKPIT                                 */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 flex flex-col p-2.5 md:p-3 gap-2.5 overflow-hidden">
        {/* UPPER STAGE: 3D MODEL VIEWPORT (Left) + HARDWARE PANELS (Right) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2.5 min-h-[380px] lg:min-h-0">
          {/* Left Column (7 cols): Scaled 3D Viewport with Transparent Bin & Tilting Cap */}
          <div className="lg:col-span-7 flex flex-col gap-2 h-full">
            {/* 3D Smart Bin Canvas Container */}
            <div className="flex-1 relative rounded-xl overflow-hidden min-h-[320px]">
              <SmartBinScene
                phase={phase}
                currentItem={currentItem}
                servoAngle={servoAngle}
                cameraPreset={cameraPreset}
                bioFillPercent={bioFillPercent}
                nonBioFillPercent={nonBioFillPercent}
                bioWasteCount={bioCount}
                nonBioWasteCount={nonBioCount}
                explodedProgress={explodedProgress}
                displayText={displayText}
              />
            </div>

            {/* Waste Drop Injector Bar & View Presets */}
            <ControlToolbar
              onDropItem={executeWasteDrop}
              onDropRandom={handleDropRandom}
              isDemoRunning={isDemoRunning}
              onToggleDemo={() => setIsDemoRunning((p) => !p)}
              onResetSystem={handleResetSystem}
              cameraPreset={cameraPreset}
              onSelectCameraPreset={(preset) => {
                setExplodedProgress(0);
                setCameraPreset(preset);
              }}
              explodedProgress={explodedProgress}
              onToggleExplodedView={handleToggleExplodedView}
              phase={phase}
              bioFull={bioFillPercent >= 100}
              nonBioFull={nonBioFillPercent >= 100}
            />
          </div>

          {/* Right Column (5 cols): OLED Display & Camera Viewfinder & Realtime Telemetry */}
          <div className="lg:col-span-5 flex flex-col gap-2 h-full overflow-y-auto pr-0.5 scrollbar-thin">
            {/* Realtime OLED Digital Screen */}
            <DigitalDisplayPanel
              displayText={displayText}
              phase={phase}
              bioFillPercent={bioFillPercent}
              nonBioFillPercent={nonBioFillPercent}
              moistureLevel={hardwareState.moistureSensor.level}
              moistureVal={hardwareState.moistureSensor.percentage}
              activeItemName={currentItem?.name}
              confidence={currentItem?.confidence}
            />

            {/* Camera Viewfinder & AI Detection Bounding Box */}
            <CameraViewfinder
              phase={phase}
              currentItem={currentItem}
              cameraStatus={hardwareState.camera.status}
            />
          </div>
        </div>

        {/* LOWER STAGE: SINGLE-FRAME INTEGRATED INSPECTOR TABS           */}
        <div className="shrink-0 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-mono shadow-xl flex flex-col">
          {/* Tab Navigation Strip */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-xs gap-2">
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { id: 'pipeline', label: 'Architecture Pipeline', icon: Workflow },
                { id: 'hardware', label: 'Hardware Bus & Drivers', icon: Cpu },
                { id: 'analytics', label: 'Analytics & Yield', icon: TrendingUp },
                { id: 'iot', label: 'IoT Fleet & GPS Radar', icon: MapPin },
                { id: 'logs', label: `System Logs (${logs.length})`, icon: Terminal },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-cyan-600 text-white font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-500">
              <span>SINGLE-FRAME VIEW</span>
              <span>·</span>
              <span className="text-cyan-400 font-bold">10-STEP PHYSICAL SEQUENCE</span>
            </div>
          </div>

          {/* Tab Content Display Area (Max height to preserve single frame) */}
          <div className="p-2.5 max-h-56 overflow-y-auto scrollbar-thin">
            {activeTab === 'pipeline' && <ArchitectureFlow phase={phase} />}

            {activeTab === 'hardware' && <HardwareStatusPanel hardware={hardwareState} phase={phase} />}

            {activeTab === 'analytics' && (
              <AnalyticsDashboard
                totalProcessed={bioCount + nonBioCount}
                bioCount={bioCount}
                nonBioCount={nonBioCount}
                bioWeightGrams={bioWeightGrams}
                nonBioWeightGrams={nonBioWeightGrams}
                history={history}
                bioFillPercent={bioFillPercent}
                nonBioFillPercent={nonBioFillPercent}
                onEmptyBio={() => {
                  setBioFillPercent(0);
                  setBioCount(0);
                  setBioWeightGrams(0);
                  addLog('Output', 'SUCCESS', 'Biodegradable compartment emptied to 0%.');
                }}
                onEmptyNonBio={() => {
                  setNonBioFillPercent(0);
                  setNonBioCount(0);
                  setNonBioWeightGrams(0);
                  addLog('Output', 'SUCCESS', 'Non-Biodegradable compartment emptied to 0%.');
                }}
              />
            )}

            {activeTab === 'iot' && (
              <IoTFleetMap
                bioFill={bioFillPercent}
                nonBioFill={nonBioFillPercent}
                status={displayText}
              />
            )}

            {activeTab === 'logs' && <SystemLogPanel logs={logs} onClearLogs={() => setLogs([])} />}
          </div>
        </div>
      </main>
    </div>
  );
}
