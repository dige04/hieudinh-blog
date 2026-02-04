import * as migration_20260204_092427_initial from './20260204_092427_initial';

export const migrations = [
  {
    up: migration_20260204_092427_initial.up,
    down: migration_20260204_092427_initial.down,
    name: '20260204_092427_initial'
  },
];
