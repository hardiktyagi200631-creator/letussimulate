/**
 * ValveTiming.ts
 * Real-time, interactive Valve Timing Diagram rendered on HTML5 Canvas.
 * Plots Intake & Exhaust valve lift vs Crankshaft Angle [0° - 720°],
 * highlights TDC, BDC, IVO, IVC, EVO, EVC, and the valve overlap region.
 */

import { calculateValves, type ValveState } from '../engine/Valves';
import type { ValveTimingSettings } from '../engine/EngineConstants';
import type { FullEngineState } from '../engine/EnginePhysics';

export interface ValveChartOptions {
  canvas: HTMLCanvasElement;
  timingSettings: ValveTimingSettings;
  maxLiftMm?: number;
}

export class ValveTimingChart {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private settings: ValveTimingSettings;
  private maxLiftMm: number;
  private currentCrankAngle = 0;

  constructor(options: ValveChartOptions) {
    this.canvas = options.canvas;
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context for ValveTimingChart');
    this.ctx = context;
    this.settings = options.timingSettings;
    this.maxLiftMm = options.maxLiftMm || 8.5;

    this.draw();
  }

  public setSettings(settings: ValveTimingSettings): void {
    this.settings = settings;
    this.draw();
  }

  public updateState(state: FullEngineState): void {
    this.currentCrankAngle = state.cycle.crankAngleDeg;
    this.draw();
  }

  public draw(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    const padLeft = 48;
    const padRight = 24;
    const padTop = 28;
    const padBottom = 42;

    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    const mapX = (deg: number) => padLeft + (deg / 720) * plotW;
    const mapY = (lift: number) => padTop + plotH - (lift / 10) * plotH;

    // 1. Draw 4 Stroke background segments
    const strokes = [
      { name: 'INTAKE', start: 0, end: 180, color: 'rgba(56, 189, 248, 0.06)' },
      { name: 'COMPRESSION', start: 180, end: 360, color: 'rgba(168, 85, 247, 0.06)' },
      { name: 'POWER', start: 360, end: 540, color: 'rgba(249, 115, 22, 0.06)' },
      { name: 'EXHAUST', start: 540, end: 720, color: 'rgba(245, 158, 11, 0.06)' },
    ];

    strokes.forEach((s) => {
      const x1 = mapX(s.start);
      const x2 = mapX(s.end);
      ctx.fillStyle = s.color;
      ctx.fillRect(x1, padTop, x2 - x1, plotH);

      // Stroke label
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(s.name, (x1 + x2) / 2, padTop + 14);
    });

    // 2. Highlight Overlap Region if in realistic mode
    if (this.settings.mode === 'realistic') {
      const overlapStartDeg = 720 - this.settings.ivo;
      const overlapEndDeg = this.settings.evc;

      // Part 1: from IVO (e.g. 708°) to 720°
      const ox1 = mapX(overlapStartDeg);
      const ox2 = mapX(720);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.16)';
      ctx.fillRect(ox1, padTop, ox2 - ox1, plotH);

      // Part 2: from 0° to EVC (e.g. 10°)
      const ox3 = mapX(0);
      const ox4 = mapX(overlapEndDeg);
      ctx.fillRect(ox3, padTop, ox4 - ox3, plotH);
    }

    // 3. Grid Lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillStyle = '#64748b';

    // Horizontal lift lines (0, 2, 4, 6, 8, 10 mm)
    for (let lift = 0; lift <= 10; lift += 2) {
      const y = mapY(lift);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.fillText(`${lift} mm`, padLeft - 6, y + 3);
    }

    // Vertical angle markers (0, 180, 360, 540, 720)
    const deadCentres = [
      { deg: 0, label: 'TDC (0°)' },
      { deg: 180, label: 'BDC (180°)' },
      { deg: 360, label: 'TDC (360°)' },
      { deg: 540, label: 'BDC (540°)' },
      { deg: 720, label: 'TDC (720°)' },
    ];

    deadCentres.forEach((dc) => {
      const x = mapX(dc.deg);
      ctx.beginPath();
      ctx.strokeStyle = '#334155';
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, padTop + plotH);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(dc.label, x, padTop + plotH + 16);
    });

    // 4. Plot Intake & Exhaust Curves
    const step = 2;
    // Intake Curve (Cyan)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let first = true;
    for (let deg = 0; deg <= 720; deg += step) {
      const val = calculateValves(deg, this.settings, this.maxLiftMm);
      const x = mapX(deg);
      const y = mapY(val.intakeLift);
      if (first) {
        ctx.moveTo(x, y);
        first = false;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Exhaust Curve (Orange)
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    first = true;
    for (let deg = 0; deg <= 720; deg += step) {
      const val = calculateValves(deg, this.settings, this.maxLiftMm);
      const x = mapX(deg);
      const y = mapY(val.exhaustLift);
      if (first) {
        ctx.moveTo(x, y);
        first = false;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Legend
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(w - 180, 10, 10, 10);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Intake Valve Lift', w - 165, 18);

    ctx.fillStyle = '#f97316';
    ctx.fillRect(w - 85, 10, 10, 10);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Exhaust Valve', w - 70, 18);

    // 5. Live Cursor Tracking current crank angle
    const curX = mapX(this.currentCrankAngle);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(curX, padTop);
    ctx.lineTo(curX, padTop + plotH);
    ctx.stroke();

    // Current angle pin head
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(curX, padTop, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.currentCrankAngle.toFixed(0)}°`, curX, padTop - 6);
  }
}

