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
