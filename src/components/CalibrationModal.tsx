import { useState, useRef } from 'react';
import styles from './CalibrationModal.module.css';

interface CalibrationModalProps {
  onSave: (pixelsPerMm: number) => void;
  onClose: () => void;
}

export default function CalibrationModal({ onSave, onClose }: CalibrationModalProps) {
  const [method, setMethod] = useState<'ruler' | 'card'>('ruler');
  const [lineWidth, setLineWidth] = useState(378);
  
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  
  // Reference hook targeted at tracking layout workspace sizes
  const areaRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = lineWidth;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !areaRef.current) return;
    
    const deltaX = e.clientX - startX.current;
    
    // Read the maximum available container width, minus outer margins/padding boundaries
    const maxAvailableWidth = areaRef.current.clientWidth - 80; 
    
    // Prevent resizing operations from going below 50px or overflowing past container bounds
    const computedWidth = Math.min(
      maxAvailableWidth, 
      Math.max(50, startWidth.current + deltaX)
    );
    
    setLineWidth(computedWidth);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleConfirm = () => {
    let computedPixelsPerMm: number;
    
    if (method === 'ruler') {
      computedPixelsPerMm = lineWidth / 100;
    } else {
      computedPixelsPerMm = lineWidth / 85.6;
    }

    onSave(computedPixelsPerMm);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Screen Calibration</h2>
        <p>To show items in true real-life size, we need to calibrate your monitor baseline dimensions.</p>

        <div className={styles.tabs}>
          <button 
            className={`${styles.tabButton} ${method === 'ruler' ? styles.activeTab : ''}`}
            onClick={() => setMethod('ruler')}
          >
            Physical Ruler Method
          </button>
          <button 
            className={`${styles.tabButton} ${method === 'card' ? styles.activeTab : ''}`}
            onClick={() => setMethod('card')}
          >
            Credit Card Method
          </button>
        </div>

        {/* Bound container ref hook attached right here */}
        <div className={styles.calibrationArea} ref={areaRef}>
          <div className={styles.resizableLine} style={{ width: `${lineWidth}px` }}>
            {/* Structural vertical tracking indicators added directly to the canvas block */}
            <div className={styles.leftAnchor} />
            <div className={styles.lineHandle} onMouseDown={handleMouseDown} />
          </div>
        </div>

        <div className={styles.controls}>
          {method === 'ruler' ? (
            <p><strong>Instructions:</strong> Align the left vertical line with the 0 mark on your physical ruler. Drag the right vertical line until it reaches exactly the <strong>10 cm (100 mm)</strong> mark.</p>
          ) : (
            <p><strong>Instructions:</strong> Hold any standard payment card against your screen. Align the vertical lines with the <strong>outer left and right edges</strong> of the card.</p>
          )}
          
          <div>
            <label>Fine Tune Width: </label>
            <input 
              type="number" 
              value={lineWidth} 
              onChange={(e) => {
                const maxW = areaRef.current ? areaRef.current.clientWidth - 80 : 1000;
                setLineWidth(Math.min(maxW, Math.max(50, Number(e.target.value))));
              }} 
            /> px
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button onClick={onClose}>Cancel</button>
          <button className={styles.saveButton} onClick={handleConfirm}>Apply Calibration</button>
        </div>
      </div>
    </div>
  );
}
