import { useState } from 'react';
import styles from './RightSidebar.module.css';
import type { ImageItem, RulerTool, AppMode } from '../types';

interface RightSidebarProps {
  activeItem: ImageItem | null;
  activeRuler: RulerTool | null;
  appMode: AppMode;
  onUpdateItem: (updatedItem: ImageItem) => void;
  onUpdateRuler: (updateRuler: RulerTool) => void;
  setAppMode: (mode: AppMode) => void;
}

export default function RightSidebar({
  activeItem,
  activeRuler,
  appMode,
  onUpdateItem,
  onUpdateRuler,
  setAppMode
}: RightSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside className={`${styles.sidebar} ${!isOpen ? styles.collapsed : ''}`}>
      <button className={styles.toggleBtn} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '▶' : '◀'}
      </button>

      {isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          <h3 className={styles.sectionTitle}>Item Settings</h3>
          
          {/* CASE A: IMAGE SETTINGS INPUT PANEL */}
          {activeItem && (
            <>
              <h3 className={styles.sectionTitle}>Item Settings</h3>
              <div className={styles.formGroup}>
                <label>Real Width of Box (mm)</label>
                <input 
                  type="number" className={styles.inputField}
                  value={activeItem.knownBoxWidthMm ?? ''} placeholder="Enter width..."
                  disabled={!!activeItem.cropBounds}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : Number(e.target.value);
                    if (!val) { onUpdateItem({ ...activeItem, knownBoxWidthMm: null }); return; }
                    let linkedHeight = activeItem.knownBoxHeightMm;
                    if (activeItem.objectBounds) {
                      linkedHeight = Math.round(val / (activeItem.objectBounds.width / activeItem.objectBounds.height));
                    }
                    onUpdateItem({ ...activeItem, primaryDimension: 'width', knownBoxWidthMm: val, knownBoxHeightMm: linkedHeight });
                  }}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Real Height of Box (mm)</label>
                <input 
                  type="number" className={styles.inputField}
                  value={activeItem.knownBoxHeightMm ?? ''} placeholder="Enter height..."
                  disabled={!!activeItem.cropBounds}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : Number(e.target.value);
                    if (!val) { onUpdateItem({ ...activeItem, knownBoxHeightMm: null }); return; }
                    let linkedWidth = activeItem.knownBoxWidthMm;
                    if (activeItem.objectBounds) {
                      linkedWidth = Math.round(val * (activeItem.objectBounds.width / activeItem.objectBounds.height));
                    }
                    onUpdateItem({ ...activeItem, primaryDimension: 'height', knownBoxHeightMm: val, knownBoxWidthMm: linkedWidth });
                  }}
                />
              </div>

              {appMode === 'arrange' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {!activeItem.cropBounds && (
                    <button 
                      style={{ padding: '10px', cursor: 'pointer', backgroundColor: '#e65100', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px' }}
                      onClick={() => setAppMode('draw-box')}
                    >
                      📐 Draw Sizing Box
                    </button>
                  )}
                  {activeItem.objectBounds && (activeItem.knownBoxWidthMm || activeItem.knownBoxHeightMm) && !activeItem.cropBounds && (
                    <button 
                      style={{ padding: '10px', cursor: 'pointer', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px' }}
                      onClick={() => setAppMode('crop-item')}
                    >
                      ✂️ Crop Target Item
                    </button>
                  )}
                  {activeItem.cropBounds && (
                    <button 
                      style={{ background: 'none', border: 'none', color: '#007acc', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline', padding: 0, textAlign: 'left' }}
                      onClick={() => onUpdateItem({ ...activeItem, cropBounds: undefined })}
                    >
                      ↩ Reset / Undo Crop Mask
                    </button>
                  )}
                </div>
              )}

              <h3 className={styles.sectionTitle}>Transforms</h3>
              <div className={styles.formGroup}>
                <label>Rotation</label>
                <div className={styles.rangeGroup}>
                  <input 
                    type="range" min="0" max="360" value={activeItem.rotation}
                    onChange={(e) => onUpdateItem({ ...activeItem, rotation: Number(e.target.value) })}
                  />
                  <span className={styles.rangeValue}>{activeItem.rotation}°</span>
                </div>
              </div>
              
              {/* Visual Chain Manual Scaling Override Slider adjustment */}
              <div className={styles.formGroup}>
                <label>Visual Scale Alignment Override</label>
                <div className={styles.rangeGroup}>
                  <input 
                    type="range" 
                    min="10"   
                    max="500"  
                    value={Math.round(activeItem.manualScaleMultiplier * 100)}
                    // FIXED: Replaced missing handlePropChange with explicit onUpdateItem dispatcher
                    onChange={(e) => onUpdateItem({
                      ...activeItem,
                      manualScaleMultiplier: Number(e.target.value) / 100
                    })}
                  />
                  <span className={styles.rangeValue}>{Math.round(activeItem.manualScaleMultiplier * 100)}%</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Transparency (Opacity)</label>
                <div className={styles.rangeGroup}>
                  <input 
                    type="range" min="10" max="100" value={Math.round(activeItem.opacity * 100)}
                    onChange={(e) => onUpdateItem({ ...activeItem, opacity: Number(e.target.value) / 100 })}
                  />
                  <span className={styles.rangeValue}>{Math.round(activeItem.opacity * 100)}%</span>
                </div>
              </div>
            </>
          )}

          {/* CASE B: NEW MEASUREMENT RULER SETTINGS INPUT PANEL */}
          {activeRuler && (
            <>
              <h3 className={styles.sectionTitle}>Ruler Tool Options</h3>
              <div className={styles.formGroup}>
                <label>Ruler Physical Length (mm)</label>
                <input 
                  type="number" className={styles.inputField}
                  value={activeRuler.lengthMm}
                  onChange={(e) => onUpdateRuler({ 
                    ...activeRuler, 
                    lengthMm: Math.min(2000, Math.max(20, Number(e.target.value))) 
                  })}
                />
              </div>

              <h3 className={styles.sectionTitle}>Transforms</h3>
              <div className={styles.formGroup}>
                <label>Rotation</label>
                <div className={styles.rangeGroup}>
                  <input 
                    type="range" min="0" max="360" value={activeRuler.rotation}
                    onChange={(e) => onUpdateRuler({ ...activeRuler, rotation: Number(e.target.value) })}
                  />
                  <span className={styles.rangeValue}>{activeRuler.rotation}°</span>
                </div>
              </div>
            </>
          )}

          {/* CASE C: EMPTY SELECTION STATE PANEL FALLBACK */}
          {!activeItem && !activeRuler && (
            <p style={{ fontSize: '13px', color: '#888', textAlign: 'center', marginTop: '20px' }}>
              Select an item or ruler on the workspace to configure settings.
            </p>
          )}
        </div>
      )}
    </aside>
  );
}
