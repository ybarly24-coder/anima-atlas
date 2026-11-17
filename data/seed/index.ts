import type { AtlasData } from '../../src/lib/types';
import { seedCategories } from './categories';
import { seedTags } from './tags';
import { seedSources } from './sources';
import { seedWorks } from './works';
import { seedScenes } from './scenes';
import { seedBoards } from './boards';

export { SEED_VERSION, SEED_TIMESTAMP } from './meta';
export { seedCategories, seedTags, seedSources, seedWorks, seedScenes, seedBoards };

/** A fresh deep copy of all seed entities (safe to mutate). */
export function buildSeedData(): AtlasData {
  return structuredClone({
    works: seedWorks,
    scenes: seedScenes,
    boards: seedBoards,
    sources: seedSources,
    tags: seedTags,
    insights: [],
    comparisons: [],
  });
}
