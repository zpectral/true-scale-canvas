import { useEffect, useRef } from 'react';
import { Group, Rect, Line, Text } from 'react-konva';
import type { RulerTool, AppMode } from '../types';
import Konva from 'konva';

interface CanvasRulerToolProps {
  ruler: RulerTool;
  isSelected: boolean;
  screenPixelsPerMm: number;
  appMode: AppMode;
  onSelect: () => void;
  onChange: (updatedRuler: RulerTool) => void;
}

export default function CanvasRulerTool({
  ruler,
  isSelected,
  screenPixelsPerMm,
  appMode,
  onSelect,
  onChange
}: CanvasRulerToolProps) {
  const groupRef = useRef<Konva.Group>(null); 
  const rulerHeightMm = 30; 
  const heightPixels = rulerHeightMm * screenPixelsPerMm;

  // NEW: Introduce a 5mm layout cushion padding on both ends
  const paddingMm = 5;
  const paddingPixels = paddingMm * screenPixelsPerMm;
  const activeTicksWidthPixels = ruler.lengthMm * screenPixelsPerMm;
  const totalRulerWidthPixels = activeTicksWidthPixels + (paddingPixels * 2);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.clearCache();

      groupRef.current.cache({
        x: -5,
        y: -5,
        width: totalRulerWidthPixels + 10,
        height: heightPixels + 10
      });

      groupRef.current.getLayer()?.batchDraw();
    }
  }, [ruler.lengthMm, screenPixelsPerMm, totalRulerWidthPixels, heightPixels]);

  const ticks = [];
  const labels = [];

  for (let mm = 0; mm <= ruler.lengthMm; mm++) {
    const xPos = paddingPixels + (mm * screenPixelsPerMm);
    let tickHeight = heightPixels * 0.25; 

    if (mm % 10 === 0) {
      tickHeight = heightPixels * 0.5; 
      labels.push(
        <Text
          key={`lbl-${mm}`}
          x={xPos}
          y={heightPixels * 0.55}
          text={`${mm / 10}`}
          fontSize={Math.max(10, screenPixelsPerMm * 3)} 
          fontStyle="bold"
          fill="#111"
          align="center"
          offsetX={screenPixelsPerMm * 1.5}
        />
      );
    } else if (mm % 5 === 0) {
      tickHeight = heightPixels * 0.38; 
    }

    ticks.push(
      <Line
        key={`tick-${mm}`}
        points={[xPos, 0, xPos, tickHeight]}
        stroke="#111"
        strokeWidth={1}
      />
    );
  }

  return (
    <Group
      name="selectable-layer"
      id={ruler.id}
      ref={groupRef}
      x={ruler.position.x}
      y={ruler.position.y}
      rotation={ruler.rotation}
      draggable={appMode === 'arrange'}
      onDragStart={() => { if (appMode === 'arrange') onSelect(); }}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
        onChange({
          ...ruler,
          position: { x: e.target.x(), y: e.target.y() }
        });
      }}
    >
      {/* Background Frame - Made semi-transparent (opacity: 0.65) */}
      <Rect
        width={totalRulerWidthPixels}
        height={heightPixels}
        fill="rgba(255, 249, 196, 0.65)" 
        stroke={isSelected ? '#007acc' : '#555'}
        strokeWidth={isSelected ? 3 : 1}
        cornerRadius={3}
        shadowColor="black"
        shadowBlur={4}
        shadowOpacity={0.15}
        shadowOffset={{ x: 2, y: 2 }}
        onClick={(e) => {
          if (appMode !== 'arrange') return;
          e.cancelBubble = true;
          onSelect();
        }}
      />

      <Line 
        points={[paddingPixels, 0, paddingPixels + activeTicksWidthPixels, 0]} 
        stroke="#111" 
        strokeWidth={1.5} 
      />

      {ticks}
      {labels}
    </Group>
  );
}