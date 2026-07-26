> [!IMPORTANT]
> **Disclaimer:** AI made this, I just encouraged it and praised its work.

# 📐 TrueScaleCanvas

A functional, lightweight web utility designed to stack, layer, and visually compare real-world items at their exact physical sizes directly on your computer monitor.

---

## 🚀 Key Features

* **Dual-Method Screen Calibration:** Calibrate your display baseline using a physical ruler or a standard credit card to achieve true `1:1` real-world pixel scaling.
* **Unified Object Alignment:** Drag selection frames over *any* known element in an uploaded photo, input its real-world width/height in millimeters, and the rest of the image automatically rescales itself proportionally.
* **Infinite Panning Canvas:** Arrange, drag, and sort layered objects across an expansive workspace that resizes automatically when interface sidebars fold away.
* **Target Item Isolation (Cropping):** Mask and discard messy backgrounds or reference objects once alignment is complete, keeping your workspace neat.
* **Visual Layer Control & Transparency:** Shuffle the stacking order (Z-Index) of assets from the left tray and apply alpha-opacity adjustments to align overlapping parts perfectly.
* **Movable Measurement Ruler:** Place a movable, rotatable draftsman's rule directly onto the canvas to manually verify item lengths.
* **Portable Workspace Save/Load:** Save your fully compiled project data (embedded Base64 image payloads, crops, scales, positions) to a single portable `.json` file.

---

## 🛠️ Tech Stack

* **Build Tool & Framework:** React (TypeScript) + Vite
* **Canvas Framework:** HTML5 Canvas via `react-konva` & `konva`
* **Styling Layouts:** Isolated CSS Modules

---

## 📐 The Math Engine

The layout scaling works via a two-part pixel density translation formula.

1. **Monitor Pixel Factor:** Evaluated once via the baseline calibration window step:
   $$\text{screenPixelsPerMm} = \frac{\text{Length of resizable screen bar (pixels)}}{\text{Physical length of real tool (mm)}}$$

2. **Asset Density Factor:** Computes real space dimensions inside your specific image coordinates:
   $$\text{imageScale} = \frac{\text{User Input Box Dimension (mm)} \times \text{screenPixelsPerMm}}{\text{Drawn box boundary size (pixels)}}$$

---

## 💻 Local Development Setup

To run this side project locally on your machine, ensure you have **Node.js** installed, then execute these commands in your terminal:

```bash
# 1. Install dependencies
npm install

# 2. Launch the developer local server
npm run dev
```

Open `http://localhost:5173` in your browser to start matching your items to true-to-life scale.

## 💾 Project Portability
Because project configurations are saved as JSON structures embedding full base64 strings, you can easily backup your workspace locally or email the `.json` file to a friend to share your calibrated layout instantly.
