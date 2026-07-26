import { useState, useRef } from 'react';
import styles from './App.module.css';
import CalibrationModal from './components/CalibrationModal';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import WorkspaceCanvas from './components/WorkspaceCanvas';
import type { MonitorCalibration, ImageItem, RulerTool, AppMode } from './types';

export default function App() {
  const [calibration, setCalibration] = useState<MonitorCalibration>({
    screenPixelsPerMm: 3.78, isCalibrated: false
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState<ImageItem[]>([]);
  const [appMode, setAppMode] = useState<AppMode>('arrange');
  const [rulers, setRulers] = useState<RulerTool[]>([]);
  const [selectedId, setSelectedId] = useState<{ id: string; type: 'item' | 'ruler' } | null>(null);

  // Core component anchor reference point hooks
  const canvasRef = useRef<{ exportPng: () => string | undefined }>(null);

  const handleSaveCalibration = (pixelsPerMm: number) => {
    setCalibration({ screenPixelsPerMm: pixelsPerMm, isCalibrated: true });
    setIsModalOpen(false);
  };

  const handleAddRuler = () => {
    const newRuler: RulerTool = {
      id: crypto.randomUUID(),
      lengthMm: 150, // Standard 15cm school drafting ruler tool size
      position: { x: 100, y: 200 },
      rotation: 0
    };
    setRulers((prev) => [...prev, newRuler]);
    setSelectedId({ id: newRuler.id, type: 'ruler' });
  };

  // --- NATIVE PNG EXPORTER INTERFACE ---
  const handleExportPng = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.exportPng();
    if (!dataUrl) return;

    // Trigger an invisible temporary anchor element download block link tracking loop
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = 'true-scale-canvas-mockup.png';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // --- LOCAL DISK TEXT DATA FILE SAVE/LOAD CONTROLS ---
  const handleSaveProject = () => {
    const projectData = {
      calibration,
      items,
      rulers
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = dataStr;
    downloadAnchor.download = 'true-scale-workspace.json';
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        if (!event.target?.result) return;
        const parsed = JSON.parse(event.target.result as string);
        
        if (parsed.calibration && parsed.items && parsed.rulers) {
          setCalibration(parsed.calibration);
          setItems(parsed.items);
          setRulers(parsed.rulers);
          setSelectedId(null);
          setAppMode('arrange');
        } else {
          alert("Invalid workspace project file formatting mapping signature structure.");
        }
      } catch {
        alert("Failed to parse the selected file asset project state records.");
      }
    };
    reader.readAsText(file);
  };


  // Selection cross-referencing abstractions
  const activeItem = selectedId?.type === 'item' ? items.find(i => i.id === selectedId.id) || null : null;
  const activeRuler = selectedId?.type === 'ruler' ? rulers.find(r => r.id === selectedId.id) || null : null;

  return (
    <div className={styles.appContainer}>
      <header className={styles.toolbar}>
        <button 
          className={styles.navButton} 
          onClick={() => setIsModalOpen(true)}
        >
          Calibrate Monitor {calibration.isCalibrated ? '(✓)' : ''}
        </button>
        
        <button 
          className={styles.navButton} 
          disabled={!calibration.isCalibrated} 
          onClick={handleAddRuler}
        >
          Ruler
        </button>
        
        <button 
          className={styles.navButton} 
          disabled={items.length === 0 && rulers.length === 0} 
          onClick={handleExportPng}
        >
          Export PNG
        </button>
        
        <button 
          className={styles.navButton} 
          disabled={items.length === 0 && rulers.length === 0} 
          onClick={handleSaveProject}
        >
          Save Project
        </button>
        
        {/* Abstracted Loader Trigger Label sharing the exact same classes */}
        <label className={styles.navButton}>
          📂 Load Project
          <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleLoadProject} />
        </label>
        
        {appMode === 'draw-box' && (
          <span className={`${styles.statusBanner} ${styles.bannerWarning}`}>
            MC Click and drag a box over your known reference/object area
          </span>
        )}

        {appMode === 'crop-item' && (
          <span className={`${styles.statusBanner} ${styles.bannerSuccess}`}>
            ✂️ Click and drag a green box tightly around the item you want to keep
          </span>
        )}

        <span className={styles.scaleIndicator}>
          Scale: {calibration.screenPixelsPerMm.toFixed(3)} px/mm
        </span>
      </header>

      <div className={styles.mainWorkspace}>
        {/* LEFT SIDEBAR - Asset Control */}
        <LeftSidebar 
          items={items}
          selectedItemId={selectedId?.type === 'item' ? selectedId.id : null}
          onAddItem={(newItem) => {
            setItems((prev) => [...prev, newItem]);
            setSelectedId({ id: newItem.id, type: 'item' });
          }}
          onSelectItem={(id) => setSelectedId({ id, type: 'item' })}
          // FIXED: Connect the layer array override hook state setter cleanly
          onUpdateAllItems={setItems} 
        />

        <main className={styles.canvasContainer}>
          {!calibration.isCalibrated ? (
            <div style={{ padding: '20px', color: '#d9534f' }}>
              ⚠️ Please calibrate your monitor using the button above to begin.
            </div>
          ) : (
            <WorkspaceCanvas
              ref={canvasRef}
              items={items}
              rulers={rulers} // Passed down
              selectedItemId={selectedId?.id || null}
              selectedType={selectedId?.type || null}
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
          activeRuler={activeRuler} // Passed down
          appMode={appMode}
          onUpdateItem={(updatedItem) => setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i))}
          onUpdateRuler={(updatedRuler) => setRulers(prev => prev.map(r => r.id === updatedRuler.id ? updatedRuler : r))}
          setAppMode={setAppMode}
        />
      </div>

      {isModalOpen && (
        <CalibrationModal onSave={handleSaveCalibration} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
