/**
 * PVDiagram.ts
 * Real-time, interactive Pressure-Volume (P-V) diagram renderer using HTML5 Canvas.
 * Synchronizes with engine crank angle, displays live operating point,
 * computes indicated work, and supports ideal Otto vs realistic engine modes.
 */

import { generatePVDiaData, type PVPoint } from '../engine/Thermodynamics';
import type { EngineGeometry } from '../engine/EngineConstants';
import type { FullEngineState } from '../engine/EnginePhysics';

export interface PVChartOptions {
  canvas: HTMLCanvasElement;
  geometry: EngineGeometry;
  mode?: 'ideal' | 'realistic';
}

export class PVDiagramChart {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private geometry: EngineGeometry;
  private mode: 'ideal' | 'realistic';
  private curvePoints: PVPoint[] = [];

  private minV = 0;
  private maxV = 300; // cc
  private minP = 0;
  private maxP = 60; // bar

  private currentPoint: { v: number; p: number; stroke: string } = {
    v: 0,
    p: 1,
    stroke: 'intake',
  };

  constructor(options: PVChartOptions) {
    this.canvas = options.canvas;
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D canvas context for PVDiagram');
    this.ctx = context;
    this.geometry = options.geometry;
    this.mode = options.mode || 'realistic';

    this.rebuildCurve();
    this.draw();
  }

  public setMode(mode: 'ideal' | 'realistic'): void {
    this.mode = mode;
    this.rebuildCurve();
    this.draw();
  }

  public setGeometry(geometry: EngineGeometry): void {
    this.geometry = geometry;
    this.rebuildCurve();
    this.draw();
  }

  private rebuildCurve(): void {
    this.curvePoints = generatePVDiaData(this.geometry, this.mode, 2);
    if (this.curvePoints.length > 0) {
      const volumes = this.curvePoints.map((pt) => pt.volumeCc);
      const pressures = this.curvePoints.map((pt) => pt.pressureBar);
      this.minV = Math.floor(Math.min(...volumes) * 0.85);
      this.maxV = Math.ceil(Math.max(...volumes) * 1.1);
      this.minP = 0;
      this.maxP = Math.ceil(Math.max(...pressures) * 1.15 / 10) * 10;
    }
  }

  public updateState(state: FullEngineState): void {
    this.currentPoint = {
      v: state.thermo.currentVolumeCc,
      p: state.thermo.pressureBar,
      stroke: state.cycle.stroke,
    };
    this.draw();
  }

  public draw(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    const padLeft = 52;
    const padRight = 24;
    const padTop = 28;
    const padBottom = 42;

    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    // Coordinate mapping functions
    const mapX = (v: number) => padLeft + ((v - this.minV) / (this.maxV - this.minV)) * plotW;
    const mapY = (p: number) => padTop + plotH - ((p - this.minP) / (this.maxP - this.minP)) * plotH;

    // Draw Grid Lines & Ticks
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = '#64748b';

    // Horizontal pressure grid
    const pSteps = 6;
    for (let i = 0; i <= pSteps; i++) {
      const pVal = this.minP + (i / pSteps) * (this.maxP - this.minP);
      const y = mapY(pVal);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.fillText(`${pVal.toFixed(0)} bar`, padLeft - 6, y + 4);
    }

    // Vertical volume grid
    const vSteps = 5;
    for (let i = 0; i <= vSteps; i++) {
      const vVal = this.minV + (i / vSteps) * (this.maxV - this.minV);
      const x = mapX(vVal);
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, padTop + plotH);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillText(`${vVal.toFixed(0)}`, x, padTop + plotH + 16);
    }

    // Axis Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Cylinder Volume V (cm³ / cc)', padLeft + plotW / 2, h - 8);

    ctx.save();
    ctx.translate(14, padTop + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Pressure P (bar)', 0, 0);
    ctx.restore();

    // Mode Title Badge
    ctx.fillStyle = this.mode === 'ideal' ? '#38bdf8' : '#22c55e';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(
      this.mode === 'ideal' ? 'MODE: IDEAL OTTO CYCLE' : 'MODE: ACTUAL INDICATED CYCLE',
      w - padRight,
      18
    );

    // Draw the full P-V loop path with distinct colors per stroke
    if (this.curvePoints.length > 1) {
      const strokeColors: Record<string, string> = {
        intake: '#38bdf8', // Blue
        compression: '#a855f7', // Violet
        power: '#f97316', // Orange
        exhaust: '#f59e0b', // Amber
      };

      for (let i = 0; i < this.curvePoints.length - 1; i++) {
        const pt1 = this.curvePoints[i];
        const pt2 = this.curvePoints[i + 1];

        ctx.strokeStyle = strokeColors[pt1.stroke] || '#94a3b8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(mapX(pt1.volumeCc), mapY(pt1.pressureBar));
        ctx.lineTo(mapX(pt2.volumeCc), mapY(pt2.pressureBar));
        ctx.stroke();
      }
    }

    // Draw Current Operating Dot
    const curX = mapX(this.currentPoint.v);
    const curY = mapY(this.currentPoint.p);

    // Pulsing outer halo
    ctx.beginPath();
    ctx.arc(curX, curY, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.fill();

    // Solid core dot
    ctx.beginPath();
    ctx.arc(curX, curY, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Current coordinates badge
    const badgeText = `${this.currentPoint.p.toFixed(1)} bar, ${this.currentPoint.v.toFixed(1)} cc`;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(curX + 8, curY - 22, 120, 20);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(curX + 8, curY - 22, 120, 20);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(badgeText, curX + 14, curY - 8);
  }
}

