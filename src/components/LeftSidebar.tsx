import React, { useState } from 'react';
import styles from './LeftSidebar.module.css';
import type { ImageItem } from '../types';

interface LeftSidebarProps {
  items: ImageItem[];
  selectedItemId: string | null;
  onAddItem: (newItem: ImageItem) => void;
  onSelectItem: (id: string) => void;
  onUpdateAllItems: (items: ImageItem[]) => void;
}

export default function LeftSidebar({
  items,
  selectedItemId,
  onAddItem,
  onSelectItem,
  onUpdateAllItems
}: LeftSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Read the file directly into memory as an absolute Base64 text string string data block
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (!base64Url) return;

      const imgBuffer = new Image();
      imgBuffer.src = base64Url;
      
      imgBuffer.onload = () => {
        const nativeRatio = imgBuffer.naturalWidth / imgBuffer.naturalHeight;

        const newItem: ImageItem = {
          id: crypto.randomUUID(),
          name: file.name,
          imageUrl: base64Url, // Safe immutable embedded text data payload!
          aspectRatio: nativeRatio,
          knownBoxWidthMm: null,
          knownBoxHeightMm: null,
          primaryDimension: 'width',
          manualScaleMultiplier: 1.0,
          opacity: 1.0,
          position: { x: 50, y: 50 },
          rotation: 0,
          zIndex: items.length
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

    const updatedList = sortedList.map((item, idx) => ({ ...item, zIndex: idx }));
    onUpdateAllItems(updatedList);
  };

  const displaySortedItems = [...items].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <aside className={`${styles.sidebar} ${!isOpen ? styles.collapsed : ''}`}>
      <button className={styles.toggleBtn} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '◀' : '▶'}
      </button>

      {isOpen && (
        <>
          <h3 className={styles.sectionTitle}>Asset Management</h3>
          <label className={styles.uploadBox}>
            <span>📁 Upload Image</span>
            <input type="file" accept="image/*" className={styles.fileInput} onChange={handleFileChange} />
          </label>

          {items.length > 0 && (
            <div className={styles.itemList}>
              {displaySortedItems.map((item, index) => {
                const trueSortedIdx = items.length - 1 - index;
                return (
                  <div 
                    key={item.id} 
                    className={`${styles.itemCard} ${item.id === selectedItemId ? styles.activeItemCard : ''}`}
                    onClick={() => onSelectItem(item.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {item.name}
                    </span>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button 
                        disabled={trueSortedIdx === items.length - 1}
                        onClick={(e) => moveLayer(trueSortedIdx, 'up', e)}
                        style={{ padding: '2px 4px', fontSize: '11px', cursor: 'pointer' }}
                      >
                        ▲
                      </button>
                      <button 
                        disabled={trueSortedIdx === 0}
                        onClick={(e) => moveLayer(trueSortedIdx, 'down', e)}
                        style={{ padding: '2px 4px', fontSize: '11px', cursor: 'pointer' }}
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </aside>
  );
}
