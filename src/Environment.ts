import { MathUtils, Object3D, PlaneGeometry, Vector3 } from "three";
import { Sky, Water2, type Water2Options } from "three/examples/jsm/Addons.js";
import type SceneInit from "./SceneInit";
import { resources } from "./main";

export function setupEnvironment(game: SceneInit) {
	const sky = new Sky();
	sky.name = "Sky";
	sky.scale.setScalar(450000);
	const phi = MathUtils.degToRad(75);
	const theta = MathUtils.degToRad(90);
	const sunPosition = new Vector3().setFromSphericalCoords(1, phi, theta);
	sky.material.uniforms.sunPosition.value = sunPosition;
	game.scene.add(sky);
	game.directionalLight.position.copy(sunPosition);

	const water = new Water2(new PlaneGeometry(1000, 1000), {
		textureWidth: 512,
		textureHeight: 512,
		sunDirection: sunPosition.normalize(),
		sunColor: 0xffffff,
		waterColor: 0x001e0f,
		distortionScale: 3.7,
		fog: true,
	} as Water2Options);
	water.rotation.x = -Math.PI / 2;
	water.position.y = -1;
	water.name = "Water";
	game.scene.add(water);

    const racetrackGLB = resources.get("racetrack");
    const racetrack = racetrackGLB.scene.children[0];
    racetrack.name = "racetrack";
    game.scene.add(racetrack);
    (racetrack as Object3D).traverse((o) => {
        o.castShadow = true;
        o.receiveShadow = true;
    });
    
}
