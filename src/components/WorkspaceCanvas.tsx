import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react'; // Added forwardRef hooks
import { Stage, Layer } from 'react-konva';
import styles from './WorkspaceCanvas.module.css';
import CanvasImageItem from './CanvasImageItem';
import CanvasRulerTool from './CanvasRulerTool';
import type { ImageItem, RulerTool, AppMode } from '../types';
import Konva from 'konva';

interface WorkspaceCanvasProps {
  items: ImageItem[];
  rulers: RulerTool[];
  selectedItemId: string | null;
  selectedType: 'item' | 'ruler' | null;
  screenPixelsPerMm: number;
  appMode: AppMode;
  onSelectItem: (id: string | null, type: 'item' | 'ruler') => void;
  onUpdateItem: (updatedItem: ImageItem) => void;
  onUpdateRuler: (updatedRuler: RulerTool) => void;
  setAppMode: (mode: AppMode) => void;
}

// Wrapped inside forwardRef wrapper layout engine blocks
const WorkspaceCanvas = forwardRef((props: WorkspaceCanvasProps, ref) => {
  const {
    items, rulers, selectedItemId, selectedType,
    screenPixelsPerMm, appMode, onSelectItem,
    onUpdateItem, onUpdateRuler, setAppMode
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null); // Anchor hook pointing directly into Stage core elements
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const lastSelectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Expose the native export function safely up to App.tsx
  useImperativeHandle(ref, () => ({
    exportPng() {
      if (!stageRef.current) return undefined;
      // Triggers native canvas baseline render capture string dumps directly
      return stageRef.current.toDataURL({ pixelRatio: 2 }); // double density multiplier for high resolution text rendering crispness
    }
  }));

  useEffect(() => {
    // 1. Guard gates: Only run if an item is selected and the Stage exists
    if (!selectedItemId || !stageRef.current) {
      lastSelectedIdRef.current = selectedItemId;
      return;
    }

    // 2. CRUCIAL GUARD: If the selected ID hasn't changed, they are just dragging it!
    if (selectedItemId === lastSelectedIdRef.current) {
      return;
    }

    const stage = stageRef.current;

    // 3. SELECTION TRACKING: Look up the active rendering node directly on the canvas layers
    const targetNode = stage.findOne(`#${selectedItemId}`) as Konva.Group;
    
    if (targetNode) {
      // Fetch the exact layout rectangle dimensions currently painted on the screen
      const clientRect = targetNode.getClientRect();

      // Convert global screen pixel bounds to local Stage coordinates
      const stageTransform = stage.getAbsoluteTransform().copy().invert();
      const localRectTopLeft = stageTransform.point({ x: clientRect.x, y: clientRect.y });
      const localWidth = clientRect.width / stage.scaleX();
      const localHeight = clientRect.height / stage.scaleY();

      // Calculate the perfect dead-center coordinates of the rendered element
      const targetCenterX = localRectTopLeft.x + (localWidth / 2);
      const targetCenterY = localRectTopLeft.y + (localHeight / 2);

      const viewportCenterX = dimensions.width / 2;
      const viewportCenterY = dimensions.height / 2;

      // Smoothly pan the main stage container window to focus on that point
      const tween = new Konva.Tween({
        node: stage,
        duration: 0.25,
        easing: Konva.Easings.EaseInOut,
        x: viewportCenterX - targetCenterX,
        y: viewportCenterY - targetCenterY,
      });

      tween.play();
    }

    // Record this ID change so subsequent dragging loops don't re-trigger this block
    lastSelectedIdRef.current = selectedItemId;

    // Fixed dependency array: Includes native canvas updates while staying completely light-weight
  }, [selectedItemId, dimensions.width, dimensions.height, items, rulers]);

  useImperativeHandle(ref, () => ({
    exportPng() {
      if (!stageRef.current) return undefined;
      return stageRef.current.toDataURL({ pixelRatio: 2 });
    }
  }));

  const sortedItems = [...items].sort((a, b) => {
    if (a.id === selectedItemId) return 1;
    if (b.id === selectedItemId) return -1;
    return a.zIndex - b.zIndex;
  });

  return (
    <div className={styles.canvasWrapper} ref={containerRef}>
      <Stage 
        ref={stageRef} // Bind ref node directly onto Konva element
        width={dimensions.width} 
        height={dimensions.height}
        draggable={appMode === 'arrange'}
        onClick={(e) => {
          if (appMode !== 'arrange') return;
          if (e.target === e.target.getStage()) {
            onSelectItem(null, 'item');
          }
        }}
      >
        <Layer>
          {sortedItems.map((item) => (
            <CanvasImageItem
              key={item.id}
              item={item}
              isSelected={selectedType === 'item' && item.id === selectedItemId}
              screenPixelsPerMm={screenPixelsPerMm}
              appMode={appMode}
              onSelect={() => onSelectItem(item.id, 'item')}
              onChange={onUpdateItem}
              setAppMode={setAppMode}
            />
          ))}

          {rulers.map((ruler) => (
            <CanvasRulerTool
              key={ruler.id}
              ruler={ruler}
              isSelected={selectedType === 'ruler' && ruler.id === selectedItemId}
              screenPixelsPerMm={screenPixelsPerMm}
              appMode={appMode}
              onSelect={() => onSelectItem(ruler.id, 'ruler')}
              onChange={onUpdateRuler}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
});

export default WorkspaceCanvas;
