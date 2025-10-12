import { ColliderDesc, type World } from "@dimforge/rapier3d";
import { Group, MathUtils,  PlaneGeometry, Scene, Vector3 } from "three";
import { Sky, Water2, type Water2Options } from "three/examples/jsm/Addons.js";

export function setupEnvironment(scene: Scene, world: World) {
	const environment = new Group();
	environment.name = "Environment";
	scene.add(environment);

	const sky = new Sky();
	sky.name = "Sky";
	sky.scale.setScalar(450000);
	const phi = MathUtils.degToRad(75);
	const theta = MathUtils.degToRad(90);
	const sunPosition = new Vector3().setFromSphericalCoords(1, phi, theta);
	sky.material.uniforms.sunPosition.value = sunPosition;
	environment.add(sky);
	//directionalLight.position.copy(sunPosition);

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
	environment.add(water);

	world.createCollider(ColliderDesc.cuboid(1000.0, 0.1, 1000.0).setTranslation(0, 0, 0));
	
}
