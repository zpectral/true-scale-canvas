import React from 'react';
import styles from './LeftSidebar.module.css';
import type { ImageItem } from '../types';

interface AssetManagerProps {
  items: ImageItem[];
  selectedItemId: string | null;
  onAddItem: (newItem: ImageItem) => void;
  onSelectItem: (id: string) => void;
  onUpdateAllItems: (items: ImageItem[]) => void;
}

export default function AssetManager({
  items,
  selectedItemId,
  onAddItem,
  onSelectItem,
  onUpdateAllItems
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

  return (
    <div className={styles.managerPanel}>
      <label className={styles.uploadBox}>
        <span>📁 Upload Image Asset</span>
        <input type="file" accept="image/*" className={styles.fileInput} onChange={handleFileChange} />
      </label>

      <div className={styles.itemList}>
        {[...items].sort((a, b) => b.zIndex - a.zIndex).map((item, index) => {
          const trueIdx = items.length - 1 - index;
          return (
            <div
              key={item.id}
              className={`${styles.itemCard} ${item.id === selectedItemId ? styles.activeItemCard : ''}`}
              onClick={() => onSelectItem(item.id)}
            >
              <span className={styles.truncateText}>{item.name}</span>
              <div className={styles.arrowGroup}>
                <button disabled={trueIdx === items.length - 1} onClick={(e) => moveLayer(trueIdx, 'up', e)}>▲</button>
                <button disabled={trueIdx === 0} onClick={(e) => moveLayer(trueIdx, 'down', e)}>▼</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
