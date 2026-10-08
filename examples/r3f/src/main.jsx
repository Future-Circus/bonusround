import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { BonusRound } from 'bonusround';
import { BonusRoundAttach } from './BonusRoundAttach.jsx';

function Spinner({ paused }) {
  const ref = useRef();
  useFrame((_, dt) => { if (!paused) ref.current.rotation.y += dt; });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#ff7043" />
    </mesh>
  );
}

function App() {
  const [paused, setPaused] = useState(false);
  // a natural break, from the game's own state (here a button): pause, await the round, resume
  const gameOver = async () => { setPaused(true); await BonusRound.break('intermission'); setPaused(false); };
  return (
    <>
      <button onClick={gameOver}>Game over → break()</button>
      <Canvas camera={{ position: [0, 3, 8], fov: 60 }}>
        <BonusRoundAttach />
        <color attach="background" args={['#87ceeb']} />
        <hemisphereLight args={['#ffffff', '#445566', 2]} />
        <Spinner paused={paused} />
      </Canvas>
    </>
  );
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
