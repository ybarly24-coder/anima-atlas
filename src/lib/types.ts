// ANIMA ATLAS core data model (spec section 4.1, extended where noted)
import type { AiAnalysisRecord } from './aiSchema';

/** 'other' = works imported from search that belong to none of the 3 research studios (e.g. Pixar). */
export type CategoryId = 'sony' | 'disney' | 'ghibli' | 'other';
export type Lens = 'visual' | 'narrative' | 'production';
export type EvidenceType = 'official_primary' | 'secondary' | 'direct_observation' | 'hypothesis';
export type VerificationStatus = 'verified' | 'partial' | 'needs_review' | 'unverified';
export type SourceType = 'official_film' | 'official_process' | 'interview' | 'analysis' | 'filmography';
export type TagFacet = 'emotion' | 'color' | 'space' | 'camera' | 'motion' | 'narrative' | 'technique' | 'custom';

export interface CategoryFact {
  text: string;
  sourceIds: string[];
}

export interface ResearchTrack {
  track: string;
  analyze: string;
  compare: string;
  output: string;
}

/** Categories are fixed reference data (not user-editable in v1). */
export interface Category {
  id: CategoryId;
  label: string; // e.g. "SONY / SPIDER-VERSE"
  nameKo: string;
  nameEn: string;
  tagline: string;
  scopeNote?: string;
  aliases: string[]; // search aliases: 소니, 디즈니, 지브리 ...
  axes: Record<Lens, string>;
  confirmedFacts: CategoryFact[];
  tracks: ResearchTrack[];
}

export interface Tag {
  id: string;
  nameKo: string;
  nameEn: string;
  facet: TagFacet;
  definition: string;
  aliases?: string[];
  isCustom?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Work {
  id: string;
  slug: string;
  categoryId: CategoryId;
  titleKo: string;
  titleEn: string;
  releaseYear: number;
  studio: string;
  director?: string[];
  medium?: string[];
  synopsisKo?: string; // official synopsis paraphrase (cited)
  overviewKo?: string; // analysis framing (NOT an official statement)
  researchQuestion?: string;
  researchKeywords: string[];
  lensIds: Lens[];
  officialSourceIds: string[];
  coverAssetId?: string | null;
  /** TMDB movie id, set when the work was matched/imported via TMDB search. */
  tmdbId?: number | null;
  /** TMDB poster path (e.g. "/abc.jpg"), displayed via the local proxy with TMDB attribution. */
  tmdbPosterPath?: string | null;
  officialUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** What the scene image actually is. A TMDB backdrop is usually a promotional still, not a verified frame. */
export type ImageType = 'actual_frame' | 'promotional_still' | 'poster' | 'concept_art' | 'unknown';

export interface ColorSwatch {
  hex: string;
  proportion: number; // 0..1
}

/** Palette computed from real image pixels only (spec v2 ColorAnalysis). */
export interface ColorAnalysis {
  swatches: ColorSwatch[];
  algorithmVersion: string;
  extractedFromAssetId: string;
  createdAt: string;
}

export interface Scene {
  id: string;
  seedCode?: string; // e.g. S-G02 for seed candidates
  workId: string;
  title: string;
  description?: string;
  focusLabel?: string; // original "main analysis lens" phrase from the research sheet
  startSeconds: number | null;
  endSeconds: number | null;
  shotDescription?: string;
  sceneImageAssetId?: string | null;
  externalVideoUrl?: string | null;
  lensIds: Lens[];
  tagIds: string[];
  colors: string[]; // only HEX values that were actually sampled
  colorSource?: 'user_sampled' | 'auto_extracted' | null;
  observation?: string;
  interpretation?: string;
  productionFact?: string;
  hypothesis?: string;
  application?: string;
  visualNotes?: string;
  narrativeNotes?: string;
  productionNotes?: string;
  researchQuestion?: string;
  sourceIds: string[];
  verificationStatus: VerificationStatus;
  isBookmark: boolean;
  /** AI-generated analysis of the scene image. Interpretation only - never a verified fact. */
  aiAnalysis?: AiAnalysisRecord | null;
  /** Where the user found the image (pasted URL), for attribution. */
  imageSourceUrl?: string | null;
  imageType?: ImageType;
  colorAnalysis?: ColorAnalysis | null;
  createdAt: string;
  updatedAt: string;
}

export type BoardStatus = 'template' | 'in_progress' | 'done';

export interface ResearchBoard {
  id: string;
  seedCode?: string;
  title: string;
  researchQuestion: string;
  background?: string;
  criteria?: string;
  scopePeriod?: string;
  outputLabel?: string;
  status: BoardStatus;
  categoryIds: CategoryId[];
  lensIds: Lens[];
  sceneIds: string[]; // ordered
  sceneNotes: Record<string, string>;
  workIds: string[];
  commonalities: string;
  differences: string;
  counterexamples: string;
  interpretation?: string;
  productionFacts?: string;
  hypothesis?: string;
  findings: string; // Insight summary
  applications: string;
  sourceIds: string[];
  isBookmark?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Source {
  id: string;
  code?: string; // S1, D4, G7 ...
  title: string;
  url: string;
  publisher: string;
  accessedAt: string;
  sourceType: SourceType;
  evidenceType: EvidenceType;
  verificationStatus: VerificationStatus;
  relatedWorkIds: string[];
  categoryIds: CategoryId[];
  notes?: string;
  altSearchHint?: string;
  createdAt: string;
  updatedAt: string;
}

export type SourceProvider = 'tmdb' | 'manual_upload' | 'official_link';
export type LicenseStatus = 'unverified' | 'checked' | 'restricted';

/** Image asset (spec v2 ImageAsset). Blob lives in IndexedDB; provenance is always recorded. */
export interface MediaAsset {
  id: string;
  kind: 'user_upload' | 'approved_external' | 'placeholder';
  urlOrLocalPath: string; // local blob: "idb://<id>"
  blob?: Blob;
  mimeType?: string;
  alt: string;
  rightsNote?: string;
  attribution?: string;
  workId?: string | null;
  sourceProvider?: SourceProvider;
  sourcePageUrl?: string | null;
  originalImageUrl?: string | null;
  licenseStatus?: LicenseStatus;
  width?: number;
  height?: number;
  aspectRatio?: number;
  contentHash?: string; // SHA-256 hex of the image bytes (duplicate detection)
  importedAt?: string;
  createdAt: string;
}

export type InsightKind = 'hypothesis' | 'finding' | 'application';

export interface Insight {
  id: string;
  kind: InsightKind;
  title: string;
  body: string;
  sceneIds: string[];
  boardIds: string[];
  workIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type CompareMode = 'scene' | 'work';

export interface Comparison {
  id: string;
  title: string;
  mode: CompareMode;
  itemIds: string[];
  cells: Record<string, string>; // key: `${itemId}::${rowKey}`
  createdAt: string;
  updatedAt: string;
}

export interface AtlasData {
  works: Work[];
  scenes: Scene[];
  boards: ResearchBoard[];
  sources: Source[];
  tags: Tag[];
  insights: Insight[];
  comparisons: Comparison[];
}

export type EntityStore = keyof AtlasData;

export interface BackupFile {
  app: 'anima-atlas';
  schemaVersion: 1;
  exportedAt: string;
  data: AtlasData;
  assets: Array<Omit<MediaAsset, 'blob'> & { dataUrl?: string }>;
}
