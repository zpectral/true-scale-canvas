import { useState } from 'react';
import styles from './LeftSidebar.module.css';
import type { SavedSession } from '../types';

interface SessionManagerProps {
  sessions: SavedSession[];
  activeSessionId: string;
  onLoadSession: (id: string) => void;
  onCreateNewSession: (name: string) => void;
  onDeleteSession: (id: string) => void;
}

export default function SessionManager({
  sessions,
  activeSessionId,
  onLoadSession,
  onCreateNewSession,
  onDeleteSession
}: SessionManagerProps) {
  const [inputName, setInputName] = useState('');

  const handleCreate = () => {
    onCreateNewSession(inputName);
    setInputName('');
  };

  return (
    <div className={styles.managerPanel}>
      <div className={styles.inputGroup}>
        <input
          type="text"
          className={styles.textField}
          placeholder="New Workspace Name..."
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
        />
        <button className={styles.addSessionBtn} onClick={handleCreate}>➕</button>
      </div>

      <div className={styles.itemList}>
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          const displayDate = new Date(session.lastUpdated).toLocaleDateString();
          const displayTime = new Date(session.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div
              key={session.id}
              className={`${styles.itemCard} ${isActive ? styles.activeItemCard : ''}`}
              onClick={() => onLoadSession(session.id)}
            >
              <div className={styles.sessionMeta}>
                <strong>{session.sessionName || `Untitled (${displayDate})`}</strong>
                <small>{displayDate} {displayTime} {isActive ? '◀ Active' : ''}</small>
              </div>
              <button
                className={styles.deleteBtn}
                onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
              >
                🗑️
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
