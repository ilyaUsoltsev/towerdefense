import { EnemyType } from './enemies-config';

export type Wave = {
  enemyType: EnemyType;
  name: string;
  count: number;
  spawnInterval: number;
  hp: number;
  reward: number;
};

export const wavesConfig: readonly Wave[] = [
  {
    enemyType: 'normal',
    name: 'Normal',
    count: 5,
    spawnInterval: 500,
    hp: 20,
    reward: 1,
  },
  {
    enemyType: 'fast',
    name: 'Fast',
    count: 5,
    spawnInterval: 300,
    hp: 30,
    reward: 1,
  },
  {
    enemyType: 'immune',
    name: 'Immune',
    count: 5,
    spawnInterval: 500,
    hp: 40,
    reward: 1,
  },
  {
    enemyType: 'skeletonBoss',
    name: 'Boss',
    count: 3,
    spawnInterval: 900,
    hp: 300,
    reward: 20,
  },
  {
    enemyType: 'normal',
    name: 'Normal',
    count: 6,
    spawnInterval: 400,
    hp: 25,
    reward: 2,
  },
  {
    enemyType: 'fast',
    name: 'Fast',
    count: 6,
    spawnInterval: 250,
    hp: 35,
    reward: 2,
  },
  {
    enemyType: 'immune',
    name: 'Immune',
    count: 6,
    spawnInterval: 400,
    hp: 45,
    reward: 2,
  },
  {
    enemyType: 'golemBoss',
    name: 'Boss',
    count: 4,
    spawnInterval: 800,
    hp: 500,
    reward: 35,
  },
  {
    enemyType: 'normal',
    name: 'Normal',
    count: 7,
    spawnInterval: 300,
    hp: 30,
    reward: 3,
  },
  {
    enemyType: 'fast',
    name: 'Fast',
    count: 7,
    spawnInterval: 200,
    hp: 40,
    reward: 3,
  },
  {
    enemyType: 'immune',
    name: 'Immune',
    count: 7,
    spawnInterval: 300,
    hp: 50,
    reward: 3,
  },
  {
    enemyType: 'skeletonBoss',
    name: 'Boss',
    count: 5,
    spawnInterval: 700,
    hp: 800,
    reward: 50,
  },
] as const;
