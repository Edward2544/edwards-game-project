import * as THREE from 'three';

export interface PlayerVisualRig {
  root: THREE.Group;
  torsoPivot: THREE.Group;
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  controlRing: THREE.Mesh;
  targetRing: THREE.Mesh;
}

export interface PitchDimensions {
  length: number; // X axis (-length/2 to +length/2)
  width: number; // Z axis (-width/2 to +width/2)
  goalWidth: number;
  goalHeight: number;
  goalDepth: number;
}

export const PITCH_DIMS: PitchDimensions = {
  length: 66,
  width: 44,
  goalWidth: 7.4,
  goalHeight: 2.7,
  goalDepth: 2.4,
};

export function createFootballerModel(options: {
  jerseyColor: string;
  shortsColor: string;
  skinTone: string;
  isGoalie?: boolean;
}): PlayerVisualRig {
  const root = new THREE.Group();

  const jerseyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(options.jerseyColor),
    roughness: 0.78,
    metalness: 0.04,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: options.isGoalie ? 0xfbbf24 : 0xf8fafc,
    roughness: 0.65,
    metalness: 0.08,
  });
  const shortsMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(options.shortsColor),
    roughness: 0.82,
    metalness: 0.03,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(options.skinTone),
    roughness: 0.68,
    metalness: 0.02,
  });
  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.34,
    metalness: 0.18,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.9,
    metalness: 0.02,
  });

  // Ground contact shadow disc (subtle dark oval at y=0.02)
  const shadowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.45, 20),
    new THREE.MeshBasicMaterial({
      color: 0x05080f,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    })
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.02;
  root.add(shadowDisc);

  // Active controlled player ring
  const controlRing = new THREE.Mesh(
    new THREE.RingGeometry(0.56, 0.72, 28),
    new THREE.MeshBasicMaterial({
      color: 0x2e86ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
    })
  );
  controlRing.rotation.x = -Math.PI / 2;
  controlRing.position.y = 0.03;
  controlRing.visible = false;
  root.add(controlRing);

  // Pass-target reticle ring
  const targetRing = new THREE.Mesh(
    new THREE.RingGeometry(0.52, 0.65, 24),
    new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    })
  );
  targetRing.rotation.x = -Math.PI / 2;
  targetRing.position.y = 0.032;
  targetRing.visible = false;
  root.add(targetRing);

  // Left Leg Pivot at hip (y = 0.86)
  const buildLeg = (xOffset: number): THREE.Group => {
    const legPivot = new THREE.Group();
    legPivot.position.set(xOffset, 0.86, 0);

    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.38, 0.24), shortsMat);
    thigh.position.y = -0.19;
    thigh.castShadow = true;
    legPivot.add(thigh);

    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.36, 10), jerseyMat);
    shin.position.y = -0.54;
    shin.castShadow = true;
    legPivot.add(shin);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.28), bootMat);
    boot.position.set(0, -0.78, 0.05);
    boot.castShadow = true;
    legPivot.add(boot);

    return legPivot;
  };

  const leftLegPivot = buildLeg(-0.14);
  const rightLegPivot = buildLeg(0.14);
  root.add(leftLegPivot, rightLegPivot);

  // Torso pivot at waist (y = 0.88)
  const torsoPivot = new THREE.Group();
  torsoPivot.position.set(0, 0.88, 0);
  root.add(torsoPivot);

  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.22, 0.28), shortsMat);
  pelvis.position.y = 0.05;
  pelvis.castShadow = true;
  torsoPivot.add(pelvis);

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.56, 0.3), jerseyMat);
  chest.position.y = 0.42;
  chest.castShadow = true;
  torsoPivot.add(chest);

  const chestStripe = new THREE.Mesh(new THREE.BoxGeometry(0.535, 0.12, 0.31), trimMat);
  chestStripe.position.y = 0.46;
  torsoPivot.add(chestStripe);

  // Arms
  const buildArm = (xOffset: number): THREE.Group => {
    const armPivot = new THREE.Group();
    armPivot.position.set(xOffset, 0.64, 0);

    const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.24, 0.16), jerseyMat);
    sleeve.position.y = -0.1;
    sleeve.castShadow = true;
    armPivot.add(sleeve);

    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.32, 8), skinMat);
    forearm.position.y = -0.35;
    forearm.castShadow = true;
    armPivot.add(forearm);

    return armPivot;
  };

  const leftArmPivot = buildArm(-0.34);
  const rightArmPivot = buildArm(0.34);
  torsoPivot.add(leftArmPivot, rightArmPivot);

  // Neck + Head
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.12, 10), skinMat);
  neck.position.y = 0.74;
  torsoPivot.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 12), skinMat);
  head.position.y = 0.92;
  head.castShadow = true;
  torsoPivot.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.186, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
    hairMat
  );
  hair.position.y = 0.94;
  torsoPivot.add(hair);

  return {
    root,
    torsoPivot,
    leftLegPivot,
    rightLegPivot,
    leftArmPivot,
    rightArmPivot,
    controlRing,
    targetRing,
  };
}

export function createGoalModel(): THREE.Group {
  const goal = new THREE.Group();
  const { goalWidth, goalHeight, goalDepth } = PITCH_DIMS;
  const halfW = goalWidth / 2;

  const postMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.28,
    metalness: 0.42,
  });

  const postRadius = 0.085;
  const leftPost = new THREE.Mesh(
    new THREE.CylinderGeometry(postRadius, postRadius, goalHeight, 12),
    postMat
  );
  leftPost.position.set(0, goalHeight / 2, -halfW);
  leftPost.castShadow = true;

  const rightPost = new THREE.Mesh(
    new THREE.CylinderGeometry(postRadius, postRadius, goalHeight, 12),
    postMat
  );
  rightPost.position.set(0, goalHeight / 2, halfW);
  rightPost.castShadow = true;

  const crossbar = new THREE.Mesh(
    new THREE.CylinderGeometry(postRadius, postRadius, goalWidth + postRadius * 2, 12),
    postMat
  );
  crossbar.rotation.x = Math.PI / 2;
  crossbar.position.set(0, goalHeight, 0);
  crossbar.castShadow = true;

  // Back frame stanchions
  const backBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, goalWidth, 10),
    postMat
  );
  backBar.rotation.x = Math.PI / 2;
  backBar.position.set(goalDepth, 0.06, 0);

  const topBackBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, goalWidth, 10),
    postMat
  );
  topBackBar.rotation.x = Math.PI / 2;
  topBackBar.position.set(goalDepth * 0.82, goalHeight - 0.18, 0);

  [-halfW, halfW].forEach((zPos) => {
    const sideBottom = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, goalDepth, 8),
      postMat
    );
    sideBottom.rotation.z = Math.PI / 2;
    sideBottom.position.set(goalDepth / 2, 0.05, zPos);
    goal.add(sideBottom);

    const sideTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, goalDepth * 0.85, 8),
      postMat
    );
    sideTop.rotation.z = Math.PI / 2;
    sideTop.position.set(goalDepth * 0.41, goalHeight - 0.09, zPos);
    goal.add(sideTop);

    const backVertical = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, goalHeight, 8),
      postMat
    );
    backVertical.position.set(goalDepth * 0.9, goalHeight / 2 - 0.08, zPos);
    backVertical.rotation.z = 0.14;
    goal.add(backVertical);
  });

  // Wireframe net enclosure
  const netMat = new THREE.MeshBasicMaterial({
    color: 0xe2e8f0,
    wireframe: true,
    transparent: true,
    opacity: 0.34,
  });

  const backNet = new THREE.Mesh(
    new THREE.PlaneGeometry(goalWidth, goalHeight, 16, 8),
    netMat
  );
  backNet.rotation.y = Math.PI / 2;
  backNet.position.set(goalDepth * 0.9, goalHeight / 2, 0);

  const topNet = new THREE.Mesh(
    new THREE.PlaneGeometry(goalDepth * 0.9, goalWidth, 6, 16),
    netMat
  );
  topNet.rotation.x = -Math.PI / 2;
  topNet.position.set(goalDepth * 0.45, goalHeight - 0.08, 0);

  const leftSideNet = new THREE.Mesh(
    new THREE.PlaneGeometry(goalDepth * 0.9, goalHeight, 6, 8),
    netMat
  );
  leftSideNet.position.set(goalDepth * 0.45, goalHeight / 2, -halfW);

  const rightSideNet = new THREE.Mesh(
    new THREE.PlaneGeometry(goalDepth * 0.9, goalHeight, 6, 8),
    netMat
  );
  rightSideNet.position.set(goalDepth * 0.45, goalHeight / 2, halfW);

  goal.add(
    leftPost,
    rightPost,
    crossbar,
    backBar,
    topBackBar,
    backNet,
    topNet,
    leftSideNet,
    rightSideNet
  );

  return goal;
}

export function createSoccerBall(texture: THREE.Texture): {
  group: THREE.Group;
  mesh: THREE.Mesh;
  shadow: THREE.Mesh;
} {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 18, 14),
    new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.35,
      metalness: 0.05,
    })
  );
  mesh.castShadow = true;
  mesh.position.y = 0.24;

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.28, 16),
    new THREE.MeshBasicMaterial({
      color: 0x05080f,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;

  group.add(shadow, mesh);
  return { group, mesh, shadow };
}

export function createStadiumEnvironment(textures: {
  pitchTex: THREE.CanvasTexture;
  adBoardTex: THREE.CanvasTexture;
  crowdTex: THREE.CanvasTexture;
}): THREE.Group {
  const env = new THREE.Group();
  const { length, width } = PITCH_DIMS;

  // Outer stadium ground apron (so horizon & stands blend cleanly, never a floating void)
  const apron = new THREE.Mesh(
    new THREE.PlaneGeometry(240, 200),
    new THREE.MeshStandardMaterial({
      color: 0x0d1522,
      roughness: 0.94,
      metalness: 0.04,
    })
  );
  apron.rotation.x = -Math.PI / 2;
  apron.position.y = -0.02;
  apron.receiveShadow = true;
  env.add(apron);

  // Perimeter athletic track surround
  const track = new THREE.Mesh(
    new THREE.PlaneGeometry(length + 14, width + 12),
    new THREE.MeshStandardMaterial({
      color: 0x162436,
      roughness: 0.88,
      metalness: 0.05,
    })
  );
  track.rotation.x = -Math.PI / 2;
  track.position.y = -0.008;
  track.receiveShadow = true;
  env.add(track);

  // Main playable stadium pitch (with border apron inside canvas texture)
  const pitchMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(length + 6.4, width + 4.4),
    new THREE.MeshStandardMaterial({
      map: textures.pitchTex,
      roughness: 0.9,
      metalness: 0.02,
    })
  );
  pitchMesh.rotation.x = -Math.PI / 2;
  pitchMesh.position.y = 0;
  pitchMesh.receiveShadow = true;
  env.add(pitchMesh);

  // LED Ad Boards along touchlines & goal-line flanks
  const adMat = new THREE.MeshStandardMaterial({
    map: textures.adBoardTex,
    emissive: new THREE.Color(0x1e293b),
    emissiveIntensity: 0.35,
    roughness: 0.45,
    metalness: 0.1,
  });

  const northAds = new THREE.Mesh(new THREE.BoxGeometry(length + 4, 1.05, 0.25), adMat);
  northAds.position.set(0, 0.525, -(width / 2 + 2.8));
  const southAds = new THREE.Mesh(new THREE.BoxGeometry(length + 4, 1.05, 0.25), adMat);
  southAds.position.set(0, 0.525, width / 2 + 2.8);
  const westAds = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.05, width + 4), adMat);
  westAds.position.set(-(length / 2 + 3.8), 0.525, 0);
  const eastAds = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.05, width + 4), adMat);
  eastAds.position.set(length / 2 + 3.8, 0.525, 0);
  env.add(northAds, southAds, westAds, eastAds);

  // 4 Tiered Grandstands around pitch
  const standConcreteMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.85,
    metalness: 0.08,
  });
  const crowdMat = new THREE.MeshStandardMaterial({
    map: textures.crowdTex,
    roughness: 0.82,
    metalness: 0.04,
  });

  const buildStand = (w: number, d: number, h: number, px: number, pz: number, rotY: number) => {
    const standGroup = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), standConcreteMat);
    base.position.y = h / 2;

    const slope = new THREE.Mesh(new THREE.PlaneGeometry(w - 1, d * 1.15), crowdMat);
    slope.rotation.x = -Math.PI / 2 + 0.46;
    slope.position.set(0, h * 0.55, 0);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 1, 0.45, d * 0.92), standConcreteMat);
    roof.position.set(0, h + 3.2, -d * 0.08);

    standGroup.add(base, slope, roof);
    standGroup.position.set(px, 0, pz);
    standGroup.rotation.y = rotY;
    return standGroup;
  };

  env.add(
    buildStand(length + 10, 12, 7.5, 0, -(width / 2 + 12), 0),
    buildStand(length + 10, 12, 7.5, 0, width / 2 + 12, Math.PI),
    buildStand(width + 10, 11, 7.5, -(length / 2 + 12.5), 0, Math.PI / 2),
    buildStand(width + 10, 11, 7.5, length / 2 + 12.5, 0, -Math.PI / 2)
  );

  // 4 Stadium Floodlight Towers at corners
  const pylonMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.42,
    metalness: 0.55,
  });
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff8e7 });

  const towerPositions: [number, number][] = [
    [-(length / 2 + 11), -(width / 2 + 10)],
    [length / 2 + 11, -(width / 2 + 10)],
    [-(length / 2 + 11), width / 2 + 10],
    [length / 2 + 11, width / 2 + 10],
  ];

  for (const [tx, tz] of towerPositions) {
    const tower = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.72, 24, 8), pylonMat);
    pole.position.y = 12;

    const head = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.2, 0.8), pylonMat);
    head.position.y = 24.4;
    head.lookAt(-tx, 10, -tz);

    const lampFace = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.7), lampMat);
    lampFace.position.set(0, 0, 0.43);
    head.add(lampFace);

    tower.position.set(tx, 0, tz);
    tower.add(pole, head);
    env.add(tower);
  }

  return env;
}
