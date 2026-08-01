import { useState } from 'react';
import styles from './LeftSidebar.module.css';
import AssetManager from './AssetManager';
import SessionManager from './SessionManager';
import type { ImageItem, SavedSession, MonitorCalibration, RulerTool } from '../types';

interface LeftSidebarProps {
  items: ImageItem[];
  rulers: RulerTool[];
  calibration: MonitorCalibration;
  sessions: SavedSession[];
  activeSessionId: string;
  selectedItemId: string | null;
  selectedType: 'item' | 'ruler' | null;
  onAddItem: (newItem: ImageItem) => void;
  onSelectItem: (id: string | null, type: 'item' | 'ruler') => void;
  onUpdateAllItems: (items: ImageItem[]) => void;
  onLoadSession: (id: string) => void;
  onCreateNewSession: (name: string) => void;
  onDeleteSession: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onDeleteRuler: (id: string) => void;
}

export default function LeftSidebar({
  items,
  rulers,
  sessions,
  activeSessionId,
  selectedItemId,
  selectedType,
  onAddItem,
  onSelectItem,
  onUpdateAllItems,
  onLoadSession,
  onCreateNewSession,
  onDeleteSession,
  onDeleteItem,
  onDeleteRuler
}: LeftSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showAssets, setShowAssets] = useState(true);
  const [showSessions, setShowSessions] = useState(true);

  return (
    <aside className={`${styles.sidebar} ${!isOpen ? styles.collapsed : ''}`}>
      <button className={styles.toggleBtn} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '◀' : '▶'}
      </button>

      {isOpen && (
        <div className={styles.scrollContainer}>
          {/* ACCORDION 1: ASSETS */}
          <div 
            className={styles.accordionHeader} 
            onClick={() => setShowAssets(!showAssets)}
          >
            <span>📦 Asset Manager ({items.length})</span>
            <span>{showAssets ? '▼' : '►'}</span>
          </div>
          {showAssets  && (
            <AssetManager
              items={items}
              rulers={rulers}
              selectedItemId={selectedItemId}
              selectedType={selectedType}
              onAddItem={onAddItem}
              onSelectItem={(id, type) => onSelectItem(id, type)}
              onUpdateAllItems={onUpdateAllItems}
              onDeleteItem={onDeleteItem}
              onDeleteRuler={onDeleteRuler}
            />
          )}

          {/* ACCORDION 2: SESSIONS */}
          <div 
            className={styles.accordionHeader} 
            onClick={() => setShowSessions(!showSessions)}
          >
            <span>⚙️ Workspace Sessions ({sessions.length})</span>
            <span>{showSessions ? '▼' : '►'}</span>
          </div>
          {showSessions && (
            <SessionManager
              sessions={sessions}
              activeSessionId={activeSessionId}
              onLoadSession={onLoadSession}
              onCreateNewSession={onCreateNewSession}
              onDeleteSession={onDeleteSession}
            />
          )}
        </div>
      )}
    </aside>
  );
}
