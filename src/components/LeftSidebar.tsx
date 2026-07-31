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
  onAddItem: (newItem: ImageItem) => void;
  onSelectItem: (id: string) => void;
  onUpdateAllItems: (items: ImageItem[]) => void;
  onLoadSession: (id: string) => void;
  onCreateNewSession: (name: string) => void;
  onDeleteSession: (id: string) => void;
}

export default function LeftSidebar({
  items,
  sessions,
  activeSessionId,
  selectedItemId,
  onAddItem,
  onSelectItem,
  onUpdateAllItems,
  onLoadSession,
  onCreateNewSession,
  onDeleteSession
}: LeftSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  // Track open accordion panel: 'assets', 'sessions', or 'none'
  const [openPanel, setOpenPanel] = useState<'assets' | 'sessions'>('assets');

  return (
    <aside className={`${styles.sidebar} ${!isOpen ? styles.collapsed : ''}`}>
      <button className={styles.toggleBtn} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '◀' : '▶'}
      </button>

      {isOpen && (
        <>
          {/* ACCORDION 1: ASSETS */}
          <div 
            className={styles.accordionHeader} 
            onClick={() => setOpenPanel(openPanel === 'assets' ? 'sessions' : 'assets')}
          >
            <span>📦 Asset Manager ({items.length})</span>
            <span>{openPanel === 'assets' ? '▼' : '►'}</span>
          </div>
          {openPanel === 'assets' && (
            <AssetManager
              items={items}
              selectedItemId={selectedItemId}
              onAddItem={onAddItem}
              onSelectItem={onSelectItem}
              onUpdateAllItems={onUpdateAllItems}
            />
          )}

          {/* ACCORDION 2: SESSIONS */}
          <div 
            className={styles.accordionHeader} 
            onClick={() => setOpenPanel(openPanel === 'sessions' ? 'assets' : 'sessions')}
          >
            <span>⚙️ Workspace Sessions ({sessions.length})</span>
            <span>{openPanel === 'sessions' ? '▼' : '►'}</span>
          </div>
          {openPanel === 'sessions' && (
            <SessionManager
              sessions={sessions}
              activeSessionId={activeSessionId}
              onLoadSession={onLoadSession}
              onCreateNewSession={onCreateNewSession}
              onDeleteSession={onDeleteSession}
            />
          )}
        </>
      )}
    </aside>
  );
}
