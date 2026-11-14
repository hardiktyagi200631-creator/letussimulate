# Let Us Simulate (letussimulate) 🏎️⚡
### Interactive 3D Four-Stroke Internal Combustion Engine Simulator & Virtual Laboratory

A high-fidelity, interactive engineering simulation of a single-cylinder four-stroke spark-ignition (petrol) engine. Built with **Astro.js**, **Three.js**, **HTML5 Canvas**, and **TypeScript**.

---

## 🌟 Key Features

- **Interactive 3D Mechanical Assembly (Three.js)**:
  - Real-time kinematics linking the crankshaft, connecting rod, and piston.
  - Transparent engine block and cutaway cylinder view.
  - Exploded view assembly slider with individual component isolation.
  - Dynamic spark plug electrical discharge and combustion flame expansion.
  - 2:1 camshaft timing drive synchronization.

- **Analytical Kinematics & Physics Engine**:
  - Exact trigonometric crank-slider kinematic formulations ($x(\theta)$, $v(\theta)$, $a(\theta)$).
  - No sinusoidal approximations — accurate connecting rod obliquity and secondary acceleration harmonics.

- **Live Thermodynamic Indicator & Valve Timing Diagrams**:
  - **P-V Diagram**: Real-time indicated pressure-volume loop comparing actual cycle against the theoretical ideal Otto cycle.
  - **Valve Timing Diagram (0°–720°)**: Valve lift profiles showing intake/exhaust timing and the valve overlap scavenging zone.

- **Live Engineering Telemetry**:
  - Instantaneous readout of crank angle, piston displacement, velocity, acceleration, cylinder volume, gas pressure, gas temperature, IMEP, brake power, and torque.

- **Component Inspector**:
  - Detailed engineering breakdown of all 17 primary components, including definitions, kinematic behaviors, and material specifications.

- **Interactive Engineering Quiz**:
  - Multiple-choice theory assessment and real-time stroke identification reflex challenge.

- **Multilingual Support**:
  - Interface available in 8 languages (English, Hindi, Spanish, French, German, Portuguese, Arabic, and Japanese).

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/hardiktyagi200631-creator/letussimulate.git

# Navigate into the project directory
cd letussimulate

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit [http://localhost:4321/](http://localhost:4321/) in your browser.

---

## 🛠️ Tech Stack

- **Framework**: [Astro.js](https://astro.build/)
- **3D Graphics**: [Three.js](https://threejs.org/)
- **Language**: TypeScript
- **Testing**: [Vitest](https://vitest.dev/)
- **Charts**: Custom HTML5 Canvas 2D renderers

---

## 🧪 Testing

Run unit tests covering crank-slider kinematics, 720° cycle transitions, valve lift timing, and thermodynamic calculations:

```bash
npm test
```

---

## 📜 License

MIT License. Designed for mechanical engineering students, technical educators, and automotive enthusiasts.
