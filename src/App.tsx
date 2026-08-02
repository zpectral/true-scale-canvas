import { useState, useEffect, useRef } from 'react';
import styles from './App.module.css';
import CalibrationModal from './components/CalibrationModal';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import WorkspaceCanvas from './components/WorkspaceCanvas';
import type { MonitorCalibration, ImageItem, RulerTool, AppMode, SavedSession } from './types';
import { get, set } from 'idb-keyval';

export default function App() {
  // --- CORE APP STATE BLUEPRINTS ---
  const [calibration, setCalibration] = useState<MonitorCalibration>({ screenPixelsPerMm: 3.78, isCalibrated: false });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState<ImageItem[]>([]);
  const [rulers, setRulers] = useState<RulerTool[]>([]);
  const [appMode, setAppMode] = useState<AppMode>('arrange');
  const [selectedId, setSelectedId] = useState<{ id: string; type: 'item' | 'ruler' } | null>(null);
  const [focusToggle, setFocusToggle] = useState(0);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Check if the user has a saved choice from a previous session
    const savedTheme = localStorage.getItem('true-scale-theme') as 'light' | 'dark';
    if (savedTheme) return savedTheme;
    
    // Fall back to the system's preferred theme configuration
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });

  // --- NEW AUTOMATED SESSION MANAGERS ---
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const isLoaded = useRef(false);

  const canvasRef = useRef<{ exportPng: () => string | undefined }>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('true-scale-theme', theme);
  }, [theme]);

  // 1. LIFECYCLE LOAD: Mount existing historical sessions, or create a default sandbox
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        const storedSessions = await get<SavedSession[]>('true-scale-sessions') || [];
        
        if (storedSessions.length > 0) {
          // Sort by last updated timestamp (newest first)
          storedSessions.sort((a, b) => b.lastUpdated - a.lastUpdated);
          const lastActive = storedSessions[0];
          
          setSessions(storedSessions);
          setActiveSessionId(lastActive.id);
          setItems(lastActive.items);
          setRulers(lastActive.rulers);
          setCalibration(lastActive.calibration);
        } else {
          // Scaffold a clean default starting session sandbox
          const defaultId = crypto.randomUUID();
          const defaultSession: SavedSession = {
            id: defaultId,
            sessionName: 'Default Workspace',
            lastUpdated: Date.now(),
            items: [],
            rulers: [],
            calibration: { screenPixelsPerMm: 3.78, isCalibrated: false }
          };
          await set('true-scale-sessions', [defaultSession]);
          setSessions([defaultSession]);
          setActiveSessionId(defaultId);
        }
        isLoaded.current = true;
      } catch (err) {
        console.error("Database boot failure:", err);
      }
    };
    initializeDatabase();
  }, []);

  // 2. BACKGROUND AUTOSAVE LOOP: Writes data blocks to database on state mutations
  useEffect(() => {
    if (!isLoaded.current || !activeSessionId) return;

    const performBackgroundAutosave = async () => {
      setSessions((prevSessions) => {
        const updatedSessions = prevSessions.map((session) => {
          if (session.id === activeSessionId) {
            return {
              ...session,
              lastUpdated: Date.now(),
              items,
              rulers,
              calibration
            };
          }
          return session;
        });
        
        // Write directly to IndexedDB asynchronously using the freshly updated data array
        set('true-scale-sessions', updatedSessions).catch((err) => 
          console.error("IndexedDB auto-save batch write failed:", err)
        );

        return updatedSessions;
      });
    };

    // Trigger debounced autosave transaction
    const timer = setTimeout(performBackgroundAutosave, 300);
    return () => clearTimeout(timer);
  }, [items, rulers, calibration, activeSessionId]);
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // --- ACTIONS HUB ---
  const handleLoadSession = (id: string) => {
    const target = sessions.find(s => s.id === id);
    if (!target) return;
    setSelectedId(null);
    setActiveSessionId(target.id);
    setItems(target.items);
    setRulers(target.rulers);
    setCalibration(target.calibration);
  };

  const handleCreateNewSession = (customName: string) => {
    const newId = crypto.randomUUID();
    const dateStr = new Date().toLocaleDateString();
    
    const newSession: SavedSession = {
      id: newId,
      sessionName: customName.trim() || `Session (${dateStr})`,
      lastUpdated: Date.now(),
      items: [],
      rulers: [],
      calibration: calibration
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setItems([]);
    setRulers([]);
    setSelectedId(null);
  };

  const handleDeleteSession = async (idToDelete: string) => {
    if (sessions.length === 1) {
      alert("Cannot delete the final workspace session. Clean or create a new session alternative first.");
      return;
    }
    const filtered = sessions.filter(s => s.id !== idToDelete);
    setSessions(filtered);
    await set('true-scale-sessions', filtered);

    // If you delete the currently open session, switch cleanly to the next available one
    if (idToDelete === activeSessionId) {
      handleLoadSession(filtered[0].id);
    }
  };

  const handleSaveCalibration = (pixelsPerMm: number) => {
    setCalibration({ screenPixelsPerMm: pixelsPerMm, isCalibrated: true });
    setIsModalOpen(false);
  };

  const handleAddRuler = () => {
    const newRuler: RulerTool = { id: crypto.randomUUID(), lengthMm: 150, position: { x: 100, y: 200 }, rotation: 0 };
    setRulers(prev => [...prev, newRuler]);
    setSelectedId({ id: newRuler.id, type: 'ruler' });
  };

  const handleExportPng = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.exportPng();
    if (!dataUrl) return;
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = 'true-scale-canvas-mockup.png';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Keep JSON backup utility file capability as a fallback system
  const handleSaveProjectFile = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ items, rulers, calibration }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = dataStr;
    downloadAnchor.download = 'true-scale-workspace.json';
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  const handleLoadProjectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.items && parsed.rulers) {
          setItems(parsed.items);
          setRulers(parsed.rulers);
          setCalibration(parsed.calibration || calibration);
        }
      } catch { alert("Invalid file parsing structure."); }
    };
    reader.readAsText(e.target.files[0]);
  };

  const activeItem = selectedId?.type === 'item' ? items.find(i => i.id === selectedId.id) || null : null;
  const activeRuler = selectedId?.type === 'ruler' ? rulers.find(r => r.id === selectedId.id) || null : null;

  const handleDeleteItem = (idToDelete: string) => {
    setItems((prev) => prev.filter(item => item.id !== idToDelete));
    if (selectedId?.type === 'item' && selectedId.id === idToDelete) {
      setSelectedId(null);
    }
  };

  const handleDeleteRuler = (idToDelete: string) => {
    setRulers((prev) => prev.filter(ruler => ruler.id !== idToDelete));
    if (selectedId?.type === 'ruler' && selectedId.id === idToDelete) {
      setSelectedId(null);
    }
  };

  const handleSidebarSelect = (id: string | null, type: 'item' | 'ruler') => {
    setSelectedId(id ? { id, type } : null);
    if (id) {
      setFocusToggle(prev => prev + 1); // Signal a sidebar focus jump command!
    }
  };

  const handleAddItem = (newItem: ImageItem) => {
    setItems((prev) => [...prev, newItem]);
    setSelectedId({ id: newItem.id, type: 'item' });
    setFocusToggle(prev => prev + 1); // Focus jump to the newly added asset instantly
  };



  return (
    <div className={styles.appContainer}>
      <header className={styles.toolbar}>
        <button className={styles.navButton} onClick={() => setIsModalOpen(true)}>
          Calibrate Monitor {calibration.isCalibrated ? '(✓)' : ''}
        </button>
        <button className={styles.navButton} disabled={!calibration.isCalibrated} onClick={handleAddRuler}>
          Add Ruler
        </button>
        <button className={styles.navButton} disabled={items.length === 0 && rulers.length === 0} onClick={handleExportPng}>
          Export PNG
        </button>
        <button className={styles.navButton} onClick={handleSaveProjectFile}>
          Backup JSON
        </button>
        <label className={styles.navButton}>
          📂 Load JSON
          <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleLoadProjectFile} />
        </label>
        
        {appMode === 'draw-box' && <span className={`${styles.statusBanner} ${styles.bannerWarning}`}>MC Click and drag a box over your known area</span>}
        {appMode === 'crop-item' && <span className={`${styles.statusBanner} ${styles.bannerSuccess}`}> ✂️ Click and drag a green box over the area you want to tune, then adjust its handles </span>}
        {appMode === 'pick-color' && <span className={`${styles.statusBanner} ${styles.bannerSuccess}`} style={{backgroundColor:'#f3e5f5', color:'#4a148c'}}>🔮 Click on background color to hide</span>}
        <span style={{marginLeft:'auto'}}>
          <span className={styles.scaleIndicator}>Scale: {calibration.screenPixelsPerMm.toFixed(3)} px/mm</span>
          <button 
            className={styles.lightButton} 
            onClick={toggleTheme}
            style={{ marginLeft: 'auto', fontSize: '14px', cursor: 'pointer', padding: '2px 8px' }}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </span>
      </header>

      <div className={styles.mainWorkspace}>
        <LeftSidebar
          items={items}
          rulers={rulers}
          calibration={calibration}
          sessions={sessions}
          activeSessionId={activeSessionId}
          selectedItemId={selectedId?.id || null}
          selectedType={selectedId?.type || null}
          onAddItem={handleAddItem}
          onSelectItem={handleSidebarSelect}
          onUpdateAllItems={setItems}
          onLoadSession={handleLoadSession}
          onCreateNewSession={handleCreateNewSession}
          onDeleteSession={handleDeleteSession}
          onDeleteItem={handleDeleteItem}
          onDeleteRuler={handleDeleteRuler}
        />

        <main className={styles.canvasContainer}>
          {!calibration.isCalibrated ? (
            <div style={{ padding: '20px', color: '#d9534f' }}>⚠️ Please calibrate your monitor to begin.</div>
          ) : (
            <WorkspaceCanvas
              ref={canvasRef}
              items={items}
              rulers={rulers}
              selectedItemId={selectedId?.id || null}
              selectedType={selectedId?.type || null}
              focusToggle={focusToggle}
              screenPixelsPerMm={calibration.screenPixelsPerMm}
              appMode={appMode}
              onSelectItem={(id, type) => setSelectedId(id ? { id, type } : null)}
              onUpdateItem={(updatedItem) => setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i))}
              onUpdateRuler={(updatedRuler) => setRulers(prev => prev.map(r => r.id === updatedRuler.id ? updatedRuler : r))}
              setAppMode={setAppMode}
            />
          )}
        </main>
        <RightSidebar
          activeItem={activeItem}
          activeRuler={activeRuler}
          appMode={appMode}
          onUpdateItem={(updatedItem) => setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i))}
          onUpdateRuler={(updatedRuler) => setRulers(prev => prev.map(r => r.id === updatedRuler.id ? updatedRuler : r))}
          setAppMode={setAppMode}
        />

        {isModalOpen && <CalibrationModal onSave={handleSaveCalibration} onClose={() => setIsModalOpen(false)} />}
      </div>
    </div>
  );
}
