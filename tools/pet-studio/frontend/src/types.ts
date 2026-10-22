export type Crop = { x: number; y: number; width: number; height: number };
export type Style = 'natural' | 'sticker' | 'soft';
export type Settings = {
  crop: Crop;
  style: Style;
  output_size: 512 | 1024;
  border: number;
  shadow: boolean;
  subject_scale: number;
};
export type Result = {
  job_id: string;
  image_url: string;
  cutout_url: string;
  download_url: string;
  created_at: string;
  settings_revision: number;
  settings: Settings;
};
export type Asset = {
  id: string;
  name: string;
  owner: string;
  label: string;
  source: 'library' | 'upload';
  original_url: string;
  thumbnail_url: string;
  width: number;
  height: number;
  settings: Settings;
  revision: number;
  saved_at: string | null;
  status: string;
  latest_result: Result | null;
};
export type Engine = { ready: boolean; model: string; message: string };
export type AssetList = { items: Asset[]; selected_id: string | null; engine: Engine };
export type Job = {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  phase: string;
  message: string;
  asset_id: string;
  settings_revision: number;
  result: Result | null;
};
export type SaveState = 'loading' | 'saved' | 'dirty' | 'saving' | 'error' | 'conflict';
export type PreviewMode = 'original' | 'result' | 'compare';
