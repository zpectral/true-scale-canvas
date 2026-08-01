import { useState } from 'react';
import styles from './RightSidebar.module.css';
import type { ImageItem, RulerTool, AppMode } from '../types';

interface RightSidebarProps {
  activeItem: ImageItem | null;
  activeRuler: RulerTool | null;
  appMode: AppMode;
  onUpdateItem: (updatedItem: ImageItem) => void;
  onUpdateRuler: (updatedRuler: RulerTool) => void;
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

  const isScaleCalibrated = !!(activeItem?.objectBounds && (activeItem.knownBoxWidthMm || activeItem.knownBoxHeightMm));
  const isCropped = !!activeItem?.cropBounds;

  return (
    <aside className={`${styles.sidebar} ${!isOpen ? styles.collapsed : ''}`}>
      <button className={styles.toggleBtn} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '▶' : '◀'}
      </button>

      {isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          {activeItem && (
            <>
              <h3 className={styles.sectionTitle}>Item Settings</h3>
              <div className={styles.formGroup}>
                <label>Real Width of Box (mm)</label>
                <input
                  type="number" className={styles.inputField}
                  value={activeItem.knownBoxWidthMm ?? ''} placeholder="Enter width..."
                  disabled={isCropped}
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
                  disabled={isCropped}
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
                  {/* BUTTON 1: Calibration Box */}
                  {!isCropped && !activeItem.tempCropBounds && (
                    <button
                      style={{ padding: '10px', cursor: 'pointer', backgroundColor: '#e65100', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px' }}
                      onClick={() => setAppMode('draw-box')}
                    >
                      📐 Draw Sizing Box
                    </button>
                  )}

                  {/* BUTTON 2: Draw Step */}
                  {isScaleCalibrated && !isCropped && !activeItem.tempCropBounds && (
                    <button
                      style={{ padding: '10px', cursor: 'pointer', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px' }}
                      onClick={() => setAppMode('crop-item')}
                    >
                      ✂️ Draw Crop Area
                    </button>
                  )}

                  {/* BUTTON 3: NEW EXECUTE AND COMMIT CONFIRMATION TRIGGER STEP */}
                  {activeItem.tempCropBounds && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#e8f5e9', padding: '10px', borderRadius: '4px', border: '1px dashed #a5d6a7' }}>
                      <span style={{ fontSize: '11px', color: '#1b5e20', fontWeight: 'bold' }}>ℹ️ Fine tune the green handles, then confirm:</span>
                      <button
                        style={{ padding: '8px', cursor: 'pointer', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}
                        onClick={() => {
                          onUpdateItem({
                            ...activeItem,
                            cropBounds: activeItem.tempCropBounds,
                            tempCropBounds: undefined // Clear temporary staging cache
                          });
                        }}
                      >
                        ✔️ Apply Crop Mask
                      </button>
                      <button
                        style={{ padding: '6px', cursor: 'pointer', backgroundColor: '#transparent', color: '#d9534f', border: '1px solid #d9534f', borderRadius: '4px', fontSize: '11px' }}
                        onClick={() => onUpdateItem({ ...activeItem, tempCropBounds: undefined })}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Undo helper layout link */}
                  {isCropped && (
                    <button
                      style={{ background: 'none', border: 'none', color: '#007acc', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline', padding: 0, textAlign: 'left' }}
                      onClick={() => onUpdateItem({ ...activeItem, cropBounds: undefined, tempCropBounds: undefined })}
                    >
                      ↩ Reset / Undo Crop Mask
                    </button>
                  )}

                  <button
                    style={{ padding: '10px', cursor: 'pointer', backgroundColor: '#5d4485', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px' }}
                    onClick={() => setAppMode('pick-color')}
                  >
                    🧪 Remove Background Color
                  </button>

                  {activeItem.chromaKeyColor && (
                    <button
                      style={{ background: 'none', border: 'none', color: '#673ab7', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline', padding: 0, textAlign: 'left' }}
                      onClick={() => onUpdateItem({ ...activeItem, chromaKeyColor: undefined })}
                    >
                      ↩ Reset Background Mask
                    </button>
                  )}
                </div>
              )}

              <h3 className={styles.sectionTitle}>Transforms</h3>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Rotation</label>
                <div className={styles.rangeGroup}>
                  <input
                    type="range" min="0" max="360" value={activeItem.rotation}
                    onChange={(e) => onUpdateItem({ ...activeItem, rotation: Number(e.target.value) })}
                  />
                  <span className={styles.rangeValue}>{activeItem.rotation}°</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Visual Scale Alignment Override</label>
                <div className={styles.rangeGroup}>
                  <input
                    type="range" min="10" max="500" value={Math.round(activeItem.manualScaleMultiplier * 100)}
                    onChange={(e) => onUpdateItem({ ...activeItem, manualScaleMultiplier: Number(e.target.value) / 100 })}
                  />
                  <span className={styles.rangeValue}>{Math.round(activeItem.manualScaleMultiplier * 100)}%</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Transparency (Opacity)</label>
                <div className={styles.rangeGroup}>
                  <input
                    type="range" min="10" max="100" value={Math.round(activeItem.opacity * 100)}
                    onChange={(e) => onUpdateItem({ ...activeItem, opacity: Number(e.target.value) / 100 })}
                  />
                  <span className={styles.rangeValue}>{Math.round(activeItem.opacity * 100)}%</span>
                </div>
              </div>

              {activeItem.chromaKeyColor && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Color Dropper Tolerance</label>
                  <div className={styles.rangeGroup}>
                    <input
                      type="range" min="0" max="150" value={activeItem.chromaTolerance}
                      onChange={(e) => onUpdateItem({ ...activeItem, chromaTolerance: Number(e.target.value) })}
                    />
                    <span className={styles.rangeValue}>{activeItem.chromaTolerance}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#666' }}>
                    Active Key: RGB({activeItem.chromaKeyColor.r}, {activeItem.chromaKeyColor.g}, {activeItem.chromaKeyColor.b})
                  </span>
                </div>
              )}
            </>
          )}

          {activeRuler && (
            <>
              <h3 className={styles.sectionTitle}>Ruler Tool Options</h3>
              <div className={styles.formGroup}>
                <label>Ruler Physical Length (mm)</label>
                <input
                  type="number" className={styles.inputField}
                  value={activeRuler.lengthMm}
                  onChange={(e) => onUpdateRuler({ ...activeRuler, lengthMm: Math.min(2000, Math.max(20, Number(e.target.value))) })}
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