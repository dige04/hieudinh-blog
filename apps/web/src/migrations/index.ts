import * as migration_20260204_122350_initial from './20260204_122350_initial';

export const migrations = [
  {
    up: migration_20260204_122350_initial.up,
    down: migration_20260204_122350_initial.down,
    name: '20260204_122350_initial'
  },
];
