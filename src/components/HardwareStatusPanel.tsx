import React from 'react';
import {
  Cpu,
  Layers,
  Camera,
  Activity,
  Droplets,
  Radio,
  Gauge,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { HardwareState, SimulationPhase } from '../types/simulation';

interface HardwareStatusPanelProps {
  hardware: HardwareState;
  phase: SimulationPhase;
}

export const HardwareStatusPanel: React.FC<HardwareStatusPanelProps> = ({
  hardware,
  phase,
}) => {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono shadow-xl text-slate-200">
      {/* Title */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
            Embedded Hardware Telemetry & Drivers
          </span>
        </div>
        <span className="text-[11px] text-blue-400 font-semibold bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded">
          I2C BUS 400kHz · SPI 40MHz
        </span>
      </div>

      {/* Grid of Microcontroller & Peripherals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* ESP32 Controller Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              ESP32-S3 MCU
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                hardware.esp32.status === 'PROCESSING'
                  ? 'bg-amber-950 text-amber-300'
                  : 'bg-emerald-950 text-emerald-300'
              }`}
            >
              {hardware.esp32.status}
            </span>
          </div>
          <div className="space-y-1 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Clock Speed:</span>
              <span className="text-slate-200">{hardware.esp32.clockSpeed}</span>
            </div>
            <div className="flex justify-between">
              <span>CPU Core Temp:</span>
              <span className="text-slate-200">{hardware.esp32.tempC.toFixed(1)}°C</span>
            </div>
            <div className="flex justify-between">
              <span>SRAM Free:</span>
              <span className="text-slate-200">{hardware.esp32.ramFree}</span>
            </div>
          </div>
        </div>

        {/* PCA9685 PWM Servo Driver */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              PCA9685 PWM Driver
            </span>
            <span className="text-[10px] bg-blue-950 text-blue-300 px-1.5 py-0.2 rounded font-bold">
              {hardware.pca9685.status}
            </span>
          </div>
          <div className="space-y-1 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>I2C Address:</span>
              <span className="text-slate-200">{hardware.pca9685.i2cAddress}</span>
            </div>
            <div className="flex justify-between">
              <span>PWM Frequency:</span>
              <span className="text-slate-200">{hardware.pca9685.pwmFreq}</span>
            </div>
            <div className="flex justify-between">
              <span>Active Channel:</span>
              <span className="text-slate-200">
                {hardware.pca9685.activeChannel !== null
                  ? `CH_${hardware.pca9685.activeChannel} (${hardware.pca9685.pulseWidthUs}µs)`
                  : 'IDLE (1500µs)'}
              </span>
            </div>
          </div>
        </div>

        {/* Servo Motor (MG995) Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              Servo Flap Actuator
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                hardware.servo.status !== 'HOLD'
                  ? 'bg-amber-950 text-amber-300'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {hardware.servo.status}
            </span>
          </div>
          <div className="space-y-1 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Angle Position:</span>
              <span className="text-slate-200 font-bold">
                {hardware.servo.angle > 0
                  ? `+${hardware.servo.angle}° (Right Non-Bio)`
                  : hardware.servo.angle < 0
                  ? `${hardware.servo.angle}° (Left Bio)`
                  : '0° (Neutral Lock)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Holding Torque:</span>
              <span className="text-slate-200">{hardware.servo.torqueNm.toFixed(1)} N·cm</span>
            </div>
            <div className="flex justify-between">
              <span>Gearbox:</span>
              <span className="text-slate-200">Metal Gear Dual BB</span>
            </div>
          </div>
        </div>

        {/* OV2640 Camera Module */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              Camera Module
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                hardware.camera.status === 'ACQUIRING'
                  ? 'bg-amber-950 text-amber-300'
                  : 'bg-blue-950 text-blue-300'
              }`}
            >
              {hardware.camera.status}
            </span>
          </div>
          <div className="space-y-1 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Sensor Model:</span>
              <span className="text-slate-200">{hardware.camera.model}</span>
            </div>
            <div className="flex justify-between">
              <span>Resolution:</span>
              <span className="text-slate-200">{hardware.camera.resolution}</span>
            </div>
            <div className="flex justify-between">
              <span>Inference Latency:</span>
              <span className="text-slate-200">{hardware.camera.lastInferenceMs}ms</span>
            </div>
          </div>
        </div>

        {/* IR Optical Presence Sensor */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-blue-400" />
              IR Presence Sensor
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                hardware.irSensor.triggered
                  ? 'bg-red-950 text-red-300'
                  : 'bg-emerald-950 text-emerald-300'
              }`}
            >
              {hardware.irSensor.triggered ? 'BEAM TRIPPED' : 'CLEAR'}
            </span>
          </div>
          <div className="space-y-1 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Infrared Beam:</span>
              <span className="text-slate-200">940nm Modulated</span>
            </div>
            <div className="flex justify-between">
              <span>Gate Status:</span>
              <span className="text-slate-200">
                {hardware.irSensor.triggered ? 'Object Detected' : 'Open / Unobstructed'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Beam Intensity:</span>
              <span className="text-slate-200">{hardware.irSensor.beamStrength}%</span>
            </div>
          </div>
        </div>

        {/* Moisture Sensor */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-blue-400" />
              Moisture Sensor
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                hardware.moistureSensor.level === 'HIGH'
                  ? 'bg-amber-950 text-amber-300'
                  : 'bg-blue-950 text-blue-300'
              }`}
            >
              {hardware.moistureSensor.level}
            </span>
          </div>
          <div className="space-y-1 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Level Classification:</span>
              <span className="text-slate-200 font-bold">
                {hardware.moistureSensor.level} ({hardware.moistureSensor.percentage}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Analog Voltage:</span>
              <span className="text-slate-200">{hardware.moistureSensor.analogMv} mV</span>
            </div>
            <div className="flex justify-between">
              <span>Probe Type:</span>
              <span className="text-slate-200">Corrosion Resistant Dual Prong</span>
            </div>
          </div>
        </div>

        {/* Ultrasonic Bio Sensor */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              US Bio Sensor
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                hardware.ultrasonicBio.warningLevel === 'BIN FULL'
                  ? 'bg-red-950 text-red-300'
                  : hardware.ultrasonicBio.warningLevel === 'CAPACITY ALERT'
                  ? 'bg-rose-950 text-rose-300'
                  : hardware.ultrasonicBio.warningLevel === 'HIGH'
                  ? 'bg-amber-950 text-amber-300'
                  : 'bg-emerald-950 text-emerald-300'
              }`}
            >
              {hardware.ultrasonicBio.warningLevel}
            </span>
          </div>
          <div className="space-y-1 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Distance to Waste:</span>
              <span className="text-slate-200">{hardware.ultrasonicBio.distanceCm.toFixed(1)} cm</span>
            </div>
            <div className="flex justify-between">
              <span>Compartment Fill:</span>
              <span className="text-emerald-400 font-bold">
                {Math.round(hardware.ultrasonicBio.fillPercent)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Sensor Transducer:</span>
              <span className="text-slate-200">HC-SR04 @ 40kHz</span>
            </div>
          </div>
        </div>

        {/* Ultrasonic Non-Bio Sensor */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="font-semibold text-orange-400 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-orange-400" />
              US Non-Bio Sensor
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                hardware.ultrasonicNonBio.warningLevel === 'BIN FULL'
                  ? 'bg-red-950 text-red-300'
                  : hardware.ultrasonicNonBio.warningLevel === 'CAPACITY ALERT'
                  ? 'bg-rose-950 text-rose-300'
                  : hardware.ultrasonicNonBio.warningLevel === 'HIGH'
                  ? 'bg-amber-950 text-amber-300'
                  : 'bg-orange-950 text-orange-300'
              }`}
            >
              {hardware.ultrasonicNonBio.warningLevel}
            </span>
          </div>
          <div className="space-y-1 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Distance to Waste:</span>
              <span className="text-slate-200">{hardware.ultrasonicNonBio.distanceCm.toFixed(1)} cm</span>
            </div>
            <div className="flex justify-between">
              <span>Compartment Fill:</span>
              <span className="text-orange-400 font-bold">
                {Math.round(hardware.ultrasonicNonBio.fillPercent)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Sensor Transducer:</span>
              <span className="text-slate-200">HC-SR04 @ 40kHz</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
