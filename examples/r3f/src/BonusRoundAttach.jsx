// Bonus Round for React Three Fiber: render <BonusRoundAttach /> inside <Canvas>.
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BonusRound } from 'bonusround';

BonusRound.init({ pub: 'pub_XXXXXXXX' });   // your publisher id from https://bonusround.io/app/games/

export function BonusRoundAttach() {
  const { scene, camera, gl } = useThree();
  useEffect(() => { BonusRound.attach({ THREE, scene, camera, renderer: gl }); }, [scene, camera, gl]);
  return null;
}
