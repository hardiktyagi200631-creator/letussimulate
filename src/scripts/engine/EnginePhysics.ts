/**
 * EnginePhysics.ts
 * Unified physics engine consolidating kinematics, cycle state, valve dynamics, and thermodynamics.
 */

import {
  DEFAULT_GEOMETRY,
  DEFAULT_VALVE_TIMING,
  DEFAULT_IGNITION,
  type EngineGeometry,
  type ValveTimingSettings,
  type IgnitionSettings,
} from './EngineConstants';
import { calculateCrankSlider, type KinematicState } from './CrankSlider';
import { getCycleState, type CycleState } from './EngineCycle';
import { calculateValves, type ValveState } from './Valves';
import { calculateThermodynamics, type ThermodynamicState } from './Thermodynamics';

export interface FullEngineState {
  kinematics: KinematicState;
  cycle: CycleState;
  valves: ValveState;
  thermo: ThermodynamicState;
  rpm: number;
}

export class EnginePhysicsEngine {
  private geometry: EngineGeometry;
  private valveTiming: ValveTimingSettings;
  private ignition: IgnitionSettings;

  constructor(
    geometry: Partial<EngineGeometry> = {},
    valveTiming: Partial<ValveTimingSettings> = {},
    ignition: Partial<IgnitionSettings> = {}
  ) {
    this.geometry = { ...DEFAULT_GEOMETRY, ...geometry };
    this.valveTiming = { ...DEFAULT_VALVE_TIMING, ...valveTiming };
    this.ignition = { ...DEFAULT_IGNITION, ...ignition };
  }

  public getGeometry(): Readonly<EngineGeometry> {
    return this.geometry;
  }

  public setGeometry(updates: Partial<EngineGeometry>): void {
    this.geometry = { ...this.geometry, ...updates };
  }

  public getValveTiming(): Readonly<ValveTimingSettings> {
    return this.valveTiming;
  }

  public setValveTiming(updates: Partial<ValveTimingSettings>): void {
    this.valveTiming = { ...this.valveTiming, ...updates };
  }

  public getIgnition(): Readonly<IgnitionSettings> {
    return this.ignition;
  }

  public setIgnition(updates: Partial<IgnitionSettings>): void {
    this.ignition = { ...this.ignition, ...updates };
  }

  /**
   * Computes the complete physical state of the engine at the given crank angle and speed.
   */
  public evaluate(crankAngleDeg: number, rpm: number): FullEngineState {
    const kinematics = calculateCrankSlider(
      crankAngleDeg,
      rpm,
      this.geometry.stroke,
      this.geometry.conRodLength
    );

    const cycle = getCycleState(
      crankAngleDeg,
      this.ignition.sparkAdvance,
      this.ignition.sparkDuration
    );

    const valves = calculateValves(
      crankAngleDeg,
      this.valveTiming,
      this.geometry.maxValveLift
    );

    const thermo = calculateThermodynamics(
      crankAngleDeg,
      rpm,
      kinematics.displacement,
      this.geometry
    );

    return {
      kinematics,
      cycle,
      valves,
      thermo,
      rpm,
    };
  }
}

