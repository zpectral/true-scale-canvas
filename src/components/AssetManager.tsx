import React from 'react';
import styles from './LeftSidebar.module.css';
import type { ImageItem, RulerTool } from '../types';

interface AssetManagerProps {
  items: ImageItem[];
  rulers: RulerTool[];
  selectedItemId: string | null;
  selectedType: 'item' | 'ruler' | null;
  onAddItem: (newItem: ImageItem) => void;
  onSelectItem: (id: string, type: 'item' | 'ruler') => void;
  onUpdateAllItems: (items: ImageItem[]) => void;
  onDeleteItem: (id: string) => void;
  onDeleteRuler: (id: string) => void;
}

export default function AssetManager({
  items,
  rulers,
  selectedItemId,
  selectedType,
  onAddItem,
  onSelectItem,
  onUpdateAllItems,
  onDeleteItem,
  onDeleteRuler
}: AssetManagerProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (!base64Url) return;

      const imgBuffer = new Image();
      imgBuffer.src = base64Url;
      imgBuffer.onload = () => {
        const newItem: ImageItem = {
          id: crypto.randomUUID(),
          name: file.name,
          imageUrl: base64Url,
          aspectRatio: imgBuffer.naturalWidth / imgBuffer.naturalHeight,
          knownBoxWidthMm: null,
          knownBoxHeightMm: null,
          primaryDimension: 'width',
          manualScaleMultiplier: 1.0,
          opacity: 1.0,
          position: { x: 50, y: 50 },
          rotation: 0,
          zIndex: items.length,
          chromaTolerance: 20
        };
        onAddItem(newItem);
      };
    };
  };

  const moveLayer = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIndex = direction === 'up' ? index + 1 : index - 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const sortedList = [...items].sort((a, b) => a.zIndex - b.zIndex);
    const temp = sortedList[index];
    sortedList[index] = sortedList[targetIndex];
    sortedList[targetIndex] = temp;

    onUpdateAllItems(sortedList.map((item, idx) => ({ ...item, zIndex: idx })));
  };

  // Convert items into a standardized layer format for display sorting
  const imageLayers = items.map((item) => ({
    id: item.id,
    name: item.name,
    type: 'item' as const,
    sortIndex: item.zIndex,
    trueIdx: items.length - 1 - [...items].sort((a, b) => a.zIndex - b.zIndex).indexOf(item)
  }));

  const rulerLayers = rulers.map((ruler) => ({
    id: ruler.id,
    name: `📏 Ruler (${ruler.lengthMm}mm)`,
    type: 'ruler' as const,
    sortIndex: Infinity, // Rulers float on top, sort index can remain uniform
    trueIdx: -1          // No layer reordering buttons needed for rulers
  }));

  // Combine layers, putting rulers on top, followed by images sorted highest-to-lowest zIndex
  const unifiedLayers = [
    ...rulerLayers,
    ...imageLayers.sort((a, b) => b.sortIndex - a.sortIndex)
  ];

  return (
    <div className={styles.managerPanel}>
      <label className={styles.uploadBox}>
        <span>📁 Upload Image Asset</span>
        <input type="file" accept="image/*" className={styles.fileInput} onChange={handleFileChange} />
      </label>

      <div className={styles.itemList}>
        {unifiedLayers.map((layer) => {
          const isSelected = selectedType === layer.type && layer.id === selectedItemId;
          return (
            <div
              key={layer.id}
              className={`${styles.itemCard} ${isSelected ? styles.activeItemCard : ''}`}
              onClick={() => onSelectItem(layer.id, layer.type)}
            >
              <span className={styles.truncateText}>{layer.name}</span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {/* Only render sorting controls for images */}
                {layer.type === 'item' && (
                  <div className={styles.arrowGroup}>
                    <button disabled={layer.trueIdx === items.length - 1} onClick={(e) => moveLayer(layer.trueIdx, 'up', e)}>▲</button>
                    <button disabled={layer.trueIdx === 0} onClick={(e) => moveLayer(layer.trueIdx, 'down', e)}>▼</button>
                  </div>
                )}
                
                {/* Unified Delete Button */}
                <button 
                  className={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (layer.type === 'item') {
                      onDeleteItem(layer.id);
                    } else {
                      onDeleteRuler(layer.id);
                    }
                  }}
                  title={`Delete ${layer.type}`}
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
