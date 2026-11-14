import { describe, it, expect } from 'vitest';
import { EngineModel } from '../../src/scripts/engine/EngineModel';
import { EngineSimulation } from '../../src/scripts/engine/EngineSimulation';
import { DEFAULT_GEOMETRY } from '../../src/scripts/engine/EngineConstants';

describe('EngineModel and EngineSimulation integration', () => {
  it('instantiates EngineModel without error', () => {
    const model = new EngineModel(DEFAULT_GEOMETRY);
    expect(model.rootGroup.children.length).toBeGreaterThan(0);
    expect(model.allSelectableMeshes.length).toBeGreaterThan(0);
  });

  it('updates model state for full 720 degrees cycle without NaN', () => {
    const model = new EngineModel(DEFAULT_GEOMETRY);
    const simulation = new EngineSimulation();

    for (let deg = 0; deg <= 720; deg += 10) {
      simulation.setAngle(deg);
      const state = simulation.getCurrentState();
      expect(() => model.update(state)).not.toThrow();
      expect(model.connectingRodGroup.rotation.z).not.toBeNaN();
      expect(model.pistonGroup.position.y).not.toBeNaN();
      expect(model.crankshaftGroup.rotation.z).not.toBeNaN();
    }
  });

  it('handles transparent and exploded modes', () => {
    const model = new EngineModel(DEFAULT_GEOMETRY);
    expect(() => model.setTransparentMode(true)).not.toThrow();
    expect(() => model.setExplodedFactor(0.5)).not.toThrow();
    expect(() => model.highlightComponent('piston')).not.toThrow();
    expect(() => model.isolateComponent('piston')).not.toThrow();
  });
});

