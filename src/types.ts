export interface ImageItem {
  id: string;
  name: string;
  imageUrl: string; 
  aspectRatio: number; 

  // Store the user inputs for the drawn box dimensions
  knownBoxWidthMm: number | null;
  knownBoxHeightMm: number | null;
  
  // Track which dimension input was edited last to drive the scale math
  primaryDimension: 'width' | 'height';
  
  manualScaleMultiplier: number; 

  objectBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  // NEW: Store the local image pixel boundaries for the final cropped area
  cropBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  opacity: number; 

  position: { x: number; y: number };
  rotation: number; 
  zIndex: number;
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

export type AppMode = 'arrange' | 'draw-box' | 'crop-item';