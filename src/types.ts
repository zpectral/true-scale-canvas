export interface ImageItem {
  id: string;
  name: string;
  imageUrl: string;
  aspectRatio: number;
  
  // Sizing dimensions
  knownBoxWidthMm: number | null;
  knownBoxHeightMm: number | null;
  primaryDimension: 'width' | 'height';
  manualScaleMultiplier: number;
  opacity: number;
  
  // Transform positions
  position: { x: number; y: number };
  rotation: number;
  zIndex: number;
  
  // Chroma background removal properties
  chromaKeyColor?: { r: number; g: number; b: number };
  chromaTolerance: number;

  // Crucial Bounding Boxes (Explicitly typed as optional)
  objectBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  cropBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  tempCropBounds?: { 
    x: number;
    y: number; 
    width: number; 
    height: number 
  };
}

export interface RulerTool {
  id: string;
  lengthMm: number;
  position: { x: number; y: number };
  rotation: number;
}

export interface MonitorCalibration {
  screenPixelsPerMm: number;
  isCalibrated: boolean;
}

export type AppMode = 'arrange' | 'draw-box' | 'crop-item' | 'pick-color';

// NEW SCHEMA: Unified Session Structure
export interface SavedSession {
  id: string;
  sessionName: string;       // Falls back to Date string if left blank
  lastUpdated: number;       // Timestamp for autosave ordering
  items: ImageItem[];
  rulers: RulerTool[];
  calibration: MonitorCalibration;
}