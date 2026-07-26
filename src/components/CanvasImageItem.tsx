import { useEffect, useState, useRef } from 'react';
import { Image as KonvaImage, Group, Rect, Transformer } from 'react-konva'; 
import type { ImageItem, AppMode } from '../types';
import Konva from 'konva';

interface CanvasImageItemProps {
  item: ImageItem;
  isSelected: boolean;
  screenPixelsPerMm: number;
  appMode: AppMode;
  onSelect: () => void;
  onChange: (updatedItem: ImageItem) => void;
  setAppMode: (mode: AppMode) => void;
}

export default function CanvasImageItem({
  item,
  isSelected,
  screenPixelsPerMm,
  appMode,
  onSelect,
  onChange,
  setAppMode
}: CanvasImageItemProps) {
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  
  // Reuse local box state to preview both scaling boxes and crop boxes
  const [localBox, setLocalBox] = useState<{ startX: number; startY: number; x: number; y: number; w: number; h: number } | null>(null);
  const isDraggingAction = useRef(false);
  
  const rectRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    const img = new Image();
    img.src = item.imageUrl;
    img.onload = () => setImageElement(img);
  }, [item.imageUrl]);

  useEffect(() => {
    if (trRef.current && rectRef.current && isSelected && appMode === 'arrange') {
      trRef.current.nodes([rectRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, appMode, item.objectBounds]);

  if (!imageElement) return null;

  // --- REVISED CALIBRATION AND SCALING ENGINE WITH SLIDER OVERRIDE ---
  let imageScale = 1;
  if (item.objectBounds && item.objectBounds.width > 0) {
    if (item.primaryDimension === 'height' && item.knownBoxHeightMm && item.knownBoxHeightMm > 0) {
      imageScale = (item.knownBoxHeightMm * screenPixelsPerMm) / item.objectBounds.height;
    } else if (item.knownBoxWidthMm && item.knownBoxWidthMm > 0) {
      imageScale = (item.knownBoxWidthMm * screenPixelsPerMm) / item.objectBounds.width;
    } else {
      imageScale = (200 * screenPixelsPerMm) / imageElement.width || 1;
    }
  } else {
    imageScale = (200 * screenPixelsPerMm) / imageElement.width || 1;
  }

  // FIXED: Apply the manual multiplier adjustment directly to the core baseline scale
  imageScale = imageScale * item.manualScaleMultiplier;

  // --- DYNAMIC RENDERING SIZES ---
  const baseWidth = item.cropBounds ? item.cropBounds.width : imageElement.width;
  const baseHeight = item.cropBounds ? item.cropBounds.height : imageElement.height;
  
  const renderWidth = baseWidth * imageScale;
  const renderHeight = baseHeight * imageScale;

  // UI Highlight states
  const isInteractingThis = isSelected && (appMode === 'draw-box' || appMode === 'crop-item');
  const shouldShowOutline = isSelected || isInteractingThis;
  const outlineColor = appMode === 'crop-item' ? '#2e7d32' : (appMode === 'draw-box' ? '#e65100' : '#007acc');
  const outlineDash = isInteractingThis ? [6, 4] : undefined;

  // --- INTERACTION MOUSE MAPPING ---
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isInteractingThis) return;
    e.cancelBubble = true;
    const localPos = e.currentTarget.getRelativePointerPosition();
    if (!localPos) return;

    // Convert canvas click points to raw asset image pixels
    let imgPixelX = localPos.x / imageScale;
    let imgPixelY = localPos.y / imageScale;

    // Shift coordinates if we are drawing inside an already cropped view window frame
    if (item.cropBounds) {
      imgPixelX += item.cropBounds.x;
      imgPixelY += item.cropBounds.y;
    }

    isDraggingAction.current = true;
    setLocalBox({
      startX: imgPixelX, startY: imgPixelY,
      x: imgPixelX, y: imgPixelY,
      w: 0, h: 0
    });
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDraggingAction.current || !localBox) return;
    e.cancelBubble = true;
    const localPos = e.currentTarget.getRelativePointerPosition();
    if (!localPos) return;

    let imgPixelX = localPos.x / imageScale;
    let imgPixelY = localPos.y / imageScale;

    if (item.cropBounds) {
      imgPixelX += item.cropBounds.x;
      imgPixelY += item.cropBounds.y;
    }

    setLocalBox({
      ...localBox,
      x: Math.min(imgPixelX, localBox.startX),
      y: Math.min(imgPixelY, localBox.startY),
      w: Math.abs(imgPixelX - localBox.startX),
      h: Math.abs(imgPixelY - localBox.startY)
    });
  };

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDraggingAction.current || !localBox) return;
    e.cancelBubble = true;
    isDraggingAction.current = false;

    if (localBox.w > 5) {
      if (appMode === 'draw-box') {
        // Calibration path logic
        onChange({
          ...item,
          knownBoxWidthMm: null,
          knownBoxHeightMm: null,
          cropBounds: undefined, // Clear old crops if recalibrating metrics
          objectBounds: { x: localBox.x, y: localBox.y, width: localBox.w, height: localBox.h }
        });
      } else if (appMode === 'crop-item') {
        // Crop execution logic
        onChange({
          ...item,
          cropBounds: { x: localBox.x, y: localBox.y, width: localBox.w, height: localBox.h }
        });
      }
    }
    setLocalBox(null);
    setTimeout(() => setAppMode('arrange'), 50);
  };

  // Adjust preview coordinate projections depending on active crop parameters
  const getRenderX = (pixelX: number) => (item.cropBounds ? pixelX - item.cropBounds.x : pixelX) * imageScale;
  const getRenderY = (pixelY: number) => (item.cropBounds ? pixelY - item.cropBounds.y : pixelY) * imageScale;

  return (
    <Group
      x={item.position.x}
      y={item.position.y}
      rotation={item.rotation}
      draggable={appMode === 'arrange'}
      onDragStart={() => { if (appMode === 'arrange') onSelect(); }}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
        onChange({ ...item, position: { x: e.target.x(), y: e.target.y() } });
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <KonvaImage
        image={imageElement}
        width={renderWidth}
        height={renderHeight}
        opacity={item.opacity} 
        stroke={shouldShowOutline ? outlineColor : undefined}
        strokeWidth={shouldShowOutline ? 3 : 0}
        dash={outlineDash}
        cropX={item.cropBounds ? item.cropBounds.x : undefined}
        cropY={item.cropBounds ? item.cropBounds.y : undefined}
        cropWidth={item.cropBounds ? item.cropBounds.width : undefined}
        cropHeight={item.cropBounds ? item.cropBounds.height : undefined}
        onClick={(e) => {
          if (appMode !== 'arrange') return;
          e.cancelBubble = true; 
          onSelect();
        }}
      />

      {/* Render the scaling calibration box overlay only if the asset hasn't been cropped yet */}
      {item.objectBounds && !localBox && !item.cropBounds && (
        <Rect
          ref={rectRef}
          x={item.objectBounds.x * imageScale}
          y={item.objectBounds.y * imageScale}
          width={item.objectBounds.width * imageScale}
          height={item.objectBounds.height * imageScale}
          stroke="#e65100"
          strokeWidth={2}
          dash={outlineDash}
          onTransformEnd={() => {
            const node = rectRef.current;
            if (!node) return;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            node.scaleX(1); node.scaleY(1);

            const newPixelWidth = (node.width() * scaleX) / imageScale;
            const newPixelHeight = (node.height() * scaleY) / imageScale;

            let updatedWidthMm = item.knownBoxWidthMm;
            let updatedHeightMm = item.knownBoxHeightMm;
            const boxRatio = newPixelWidth / newPixelHeight;

            if (item.primaryDimension === 'width' && item.knownBoxWidthMm) {
              updatedHeightMm = Math.round(item.knownBoxWidthMm / boxRatio);
            } else if (item.primaryDimension === 'height' && item.knownBoxHeightMm) {
              updatedWidthMm = Math.round(item.knownBoxHeightMm * boxRatio);
            }

            onChange({
              ...item,
              knownBoxWidthMm: updatedWidthMm,
              knownBoxHeightMm: updatedHeightMm,
              objectBounds: {
                x: node.x() / imageScale,
                y: node.y() / imageScale,
                width: newPixelWidth,
                height: newPixelHeight
              }
            });
          }}
        />
      )}

      {/* Render interactive dragging selector boxes for both modes */}
      {localBox && (
        <Rect
          x={getRenderX(localBox.x)}
          y={getRenderY(localBox.y)}
          width={localBox.w * imageScale}
          height={localBox.h * imageScale}
          stroke={appMode === 'crop-item' ? '#2e7d32' : '#e65100'}
          strokeWidth={2}
          fill={appMode === 'crop-item' ? 'rgba(46, 125, 50, 0.15)' : 'rgba(230, 81, 0, 0.2)'}
        />
      )}

      {isSelected && appMode === 'arrange' && item.objectBounds && !item.cropBounds && (
        <Transformer
          ref={trRef}
          keepRatio={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) return oldBox;
            return newBox;
          }}
        />
      )}
    </Group>
  );
}
