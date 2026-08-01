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
  const [localBox, setLocalBox] = useState<{ startX: number; startY: number; x: number; y: number; w: number; h: number } | null>(null);
  const isDraggingAction = useRef(false);

  const rectRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const cropRectRef = useRef<Konva.Rect>(null);
  const cropTrRef = useRef<Konva.Transformer>(null);
  const imageRef = useRef<Konva.Image>(null);

  useEffect(() => {
    const img = new Image();
    img.src = item.imageUrl;
    img.crossOrigin = 'Anonymous';
    img.onload = () => setImageElement(img);
  }, [item.imageUrl]);

  // Sync Bounding Box Transformer
  useEffect(() => {
    if (trRef.current && rectRef.current && isSelected && appMode === 'arrange') {
      trRef.current.nodes([rectRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, appMode, item.objectBounds]);

  // Sync Crop Box Transformer
  useEffect(() => {
    if (cropTrRef.current && cropRectRef.current && isSelected && appMode === 'arrange') {
      cropTrRef.current.nodes([cropRectRef.current]);
      cropTrRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, appMode, item.tempCropBounds]);

  // Handle re-caching pixels when dropper parameters change
  useEffect(() => {
    if (imageRef.current && imageElement) {
      imageRef.current.clearCache();
      if (item.chromaKeyColor) {
        imageRef.current.cache();
      }
      imageRef.current.getLayer()?.batchDraw();
    }
  }, [item.chromaKeyColor, item.chromaTolerance, imageElement]);

  if (!imageElement) return null;

  // --- SCALING CALCULATIONS ---
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
  imageScale = imageScale * item.manualScaleMultiplier;

  // --- DYNAMIC RENDERING SIZES ---
  const baseWidth = item.cropBounds ? item.cropBounds.width : imageElement.width;
  const baseHeight = item.cropBounds ? item.cropBounds.height : imageElement.height;
  const renderWidth = baseWidth * imageScale;
  const renderHeight = baseHeight * imageScale;

  const isCalibratingThis = isSelected && appMode === 'draw-box';
  const isCroppingThis = isSelected && appMode === 'crop-item';
  const isPickingColorThis = isSelected && appMode === 'pick-color';
  const shouldShowOutline = isSelected || isCalibratingThis || isCroppingThis || isPickingColorThis;

  const outlineColor = isPickingColorThis ? '#673ab7' : (isCroppingThis ? '#2e7d32' : (isCalibratingThis ? '#e65100' : '#007acc'));
  const outlineDash = (isCalibratingThis || isCroppingThis || isPickingColorThis) ? [6, 4] : undefined;

  // --- CUSTOM CHROMA FILTER PIXEL SCANNER ---
  const customChromaFilter = (imageData: ImageData) => {
    if (!item.chromaKeyColor) return;
    const data = imageData.data;
    const target = item.chromaKeyColor;
    const tol = item.chromaTolerance;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const colorDistance = Math.sqrt(
        Math.pow(r - target.r, 2) +
        Math.pow(g - target.g, 2) +
        Math.pow(b - target.b, 2)
      );

      if (colorDistance <= tol) {
        data[i + 3] = 0; // Set Alpha to 0
      }
    }
  };

  // --- MOUSE HANDLERS ---
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPickingColorThis) {
      e.cancelBubble = true;
      const stage = e.target.getStage();
      const pointerPos = stage?.getPointerPosition();
      const layer = imageRef.current?.getLayer();
      const context = layer?.getContext();

      if (pointerPos && context) {
        const pixelData = context.getImageData(pointerPos.x, pointerPos.y, 1, 1).data;
        onChange({
          ...item,
          chromaKeyColor: { r: pixelData[0], g: pixelData[1], b: pixelData[2] }
        });
        setTimeout(() => setAppMode('arrange'), 50);
      }
      return;
    }

    if (!isCalibratingThis && !isCroppingThis) return;
    e.cancelBubble = true;
    const localPos = e.currentTarget.getRelativePointerPosition();
    if (!localPos) return;

    let imgPixelX = localPos.x / imageScale;
    let imgPixelY = localPos.y / imageScale;
    if (item.cropBounds) {
      imgPixelX += item.cropBounds.x;
      imgPixelY += item.cropBounds.y;
    }

    isDraggingAction.current = true;
    setLocalBox({ startX: imgPixelX, startY: imgPixelY, x: imgPixelX, y: imgPixelY, w: 0, h: 0 });
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
        onChange({
          ...item,
          knownBoxWidthMm: null,
          knownBoxHeightMm: null,
          cropBounds: undefined,
          tempCropBounds: undefined,
          objectBounds: { x: localBox.x, y: localBox.y, width: localBox.w, height: localBox.h }
        });
      } else if (appMode === 'crop-item') {
        onChange({
          ...item,
          tempCropBounds: { x: localBox.x, y: localBox.y, width: localBox.w, height: localBox.h }
        });
      }
    }
    setLocalBox(null);
    setTimeout(() => setAppMode('arrange'), 50);
  };

  const getRenderX = (pixelX: number) => (item.cropBounds ? pixelX - item.cropBounds.x : pixelX) * imageScale;
  const getRenderY = (pixelY: number) => (item.cropBounds ? pixelY - item.cropBounds.y : pixelY) * imageScale;

  return (
    <Group
      x={item.position.x}
      y={item.position.y}
      rotation={item.rotation}
      draggable={appMode === 'arrange' && !item.tempCropBounds}
      onDragStart={() => { if (appMode === 'arrange') onSelect(); }}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
        onChange({ ...item, position: { x: e.target.x(), y: e.target.y() } });
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <KonvaImage
        ref={imageRef}
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
        filters={item.chromaKeyColor ? [customChromaFilter] : []}
        onClick={(e) => {
          if (appMode !== 'arrange') return;
          e.cancelBubble = true;
          onSelect();
        }}
      />

      {item.objectBounds && !localBox && !item.cropBounds && !item.tempCropBounds && (
        <Rect
          ref={rectRef}
          x={item.objectBounds.x * imageScale}
          y={item.objectBounds.y * imageScale}
          width={item.objectBounds.width * imageScale}
          height={item.objectBounds.height * imageScale}
          stroke="#e65100"
          strokeWidth={2}
          dash={[6, 4]}
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
              objectBounds: { x: node.x() / imageScale, y: node.y() / imageScale, width: newPixelWidth, height: newPixelHeight }
            });
          }}
        />
      )}

      {/* 2. NEW EDITABLE CROP BOX PREVIEW OVERLAY */}
      {item.tempCropBounds && !localBox && appMode === 'arrange' && (
        <Rect
          ref={cropRectRef}
          x={getRenderX(item.tempCropBounds.x)}
          y={getRenderY(item.tempCropBounds.y)}
          width={item.tempCropBounds.width * imageScale}
          height={item.tempCropBounds.height * imageScale}
          stroke="#2e7d32"
          strokeWidth={2.5}
          dash={[6, 4]}
          fill="rgba(46, 125, 50, 0.1)"
          onTransformEnd={() => {
            const node = cropRectRef.current; 
            if (!node) return;
            const scaleX = node.scaleX(); 
            const scaleY = node.scaleY();
            node.scaleX(1); node.scaleY(1);
            const currentXOnCanvas = node.x();
            const currentYOnCanvas = node.y();
            const rawLocalX = item.cropBounds? (currentXOnCanvas / imageScale) + item.cropBounds.x: currentXOnCanvas / imageScale;
            const rawLocalY = item.cropBounds? (currentYOnCanvas / imageScale) + item.cropBounds.y: currentYOnCanvas / imageScale;
            onChange({...item,tempCropBounds: {x: rawLocalX,y: rawLocalY,width: (node.width() * scaleX) / imageScale,height: (node.height() * scaleY) / imageScale}});
          }}
        />
      )}
      
      {/* Mouse Drag Tracker Box Preview */}
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
      
      {/* Mounting Transformer for Calibration Bounding Box */}
      {isSelected && appMode === 'arrange' && item.objectBounds && !item.cropBounds && !item.tempCropBounds && (
        <Transformer
          ref={trRef}
          keepRatio={false}
          boundBoxFunc={(oldBox, newBox) => (newBox.width < 10 || newBox.height < 10) ? oldBox : newBox}
        />
      )}
      
      {/* NEW: Mounting Independent Transformer explicitly targeting the green Crop Box handles */}
      {isSelected && appMode === 'arrange' && item.tempCropBounds && (
        <Transformer
          ref={cropTrRef}
          keepRatio={false}
          rotateEnabled={false}
          boundBoxFunc={(oldBox, newBox) => (newBox.width < 10 || newBox.height < 10) ? oldBox : newBox}
        />
      )}
    </Group>
  );
}
