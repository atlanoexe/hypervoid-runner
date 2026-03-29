import { ITEM_SCALE } from './constants.js';

export const ITEM_RULES = {
  coin: {
    radius: 0.6 * ITEM_SCALE,
    travelRate: 0.36,
    burstDuration: 0.18,
    gap: {
      sparseMin: 18,
      sparseMax: 30,
      denseMin: 9,
      denseMax: 17
    },
    batch: {
      minCount: 2,
      variance: 2,
      densityBonus: 2
    },
    spacing: {
      min: 3.5,
      max: 8.5
    },
    scale: {
      min: 0.92,
      max: 1.18
    }
  },
  obstacle: {
    radius: 0.95 * ITEM_SCALE,
    travelRate: 0.4,
    burstDuration: 0,
    gap: {
      sparseMin: 22,
      sparseMax: 32,
      denseMin: 12,
      denseMax: 19
    },
    batch: {
      minCount: 1,
      variance: 1,
      densityBonus: 2
    },
    spacing: {
      min: 4.8,
      max: 10.8
    },
    scale: {
      min: 0.88,
      max: 1.22
    }
  }
};
