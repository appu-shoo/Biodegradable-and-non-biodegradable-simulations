export type WasteType = 'biodegradable' | 'non-biodegradable';

export interface WasteItemDef {
  id: string;
  name: string;
  type: WasteType;
  confidence: number;
  moisture: 'HIGH' | 'LOW';
  moistureValue: number; // in percentage e.g. 84%
  weightGrams: number;
  color: string;
  description: string;
}

export type SimulationPhase =
  | 'idle'
  | 'dropping'
  | 'ir_detecting'
  | 'camera_capturing'
  | 'ai_analyzing'
  | 'decision_logic'
  | 'servo_activating'
  | 'sorting_slide'
  | 'ultrasonic_measuring'
  | 'complete';

export type CameraPreset = 'front' | 'top' | 'side' | 'internal' | 'exploded';

export interface HardwareState {
  esp32: {
    status: 'ONLINE' | 'PROCESSING' | 'IDLE' | 'ALERT';
    cpuLoad: number;
    clockSpeed: string;
    ramFree: string;
    tempC: number;
  };
  pca9685: {
    status: 'ONLINE' | 'DRIVING' | 'STANDBY';
    i2cAddress: string;
    pwmFreq: string;
    activeChannel: number | null;
    pulseWidthUs: number;
  };
  servo: {
    angle: number; // -40 (left bio), 0 (neutral), +40 (right non-bio)
    targetAngle: number;
    status: 'HOLD' | 'TILTING_BIO' | 'TILTING_NON_BIO' | 'RETURNING';
    torqueNm: number;
  };
  camera: {
    status: 'STANDBY' | 'ACQUIRING' | 'STREAMING';
    model: string;
    resolution: string;
    lastInferenceMs: number;
    fps: number;
  };
  irSensor: {
    triggered: boolean;
    beamStrength: number;
    distanceCm: number;
  };
  moistureSensor: {
    level: 'HIGH' | 'LOW' | 'DRY';
    analogMv: number;
    percentage: number;
  };
  ultrasonicBio: {
    distanceCm: number;
    fillPercent: number;
    warningLevel: 'NORMAL' | 'HIGH' | 'CAPACITY ALERT' | 'BIN FULL';
  };
  ultrasonicNonBio: {
    distanceCm: number;
    fillPercent: number;
    warningLevel: 'NORMAL' | 'HIGH' | 'CAPACITY ALERT' | 'BIN FULL';
  };
}

export interface LogEntry {
  id: string;
  timestamp: string;
  layer: 'Sensing' | 'Processing' | 'Actuation' | 'Output' | 'Cloud';
  level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  message: string;
  metadata?: string;
}

export interface WasteHistoryItem {
  id: string;
  name: string;
  type: WasteType;
  confidence: number;
  time: string;
  weightGrams: number;
}
