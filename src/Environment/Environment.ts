import { type World } from "@dimforge/rapier3d";
import { Group, MathUtils, PlaneGeometry, Quaternion, Scene, Vector3 } from "three";
import { Sky, Water2, type Water2Options } from "three/examples/jsm/Addons.js";
import { WorldGenerator } from "./WorldGenerator";
import {  WallWithWindow } from "./Building";

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
	water.position.y = -5;
	water.name = "Water";
	environment.add(water);

	const generator = new WorldGenerator(scene, world);
	generator.createPlain();

	generator.startRoad([0, 0.25, -50], 0, 15);
	generator.moveTo([0, 0, 90], 0);
	generator.endRoad();

	generator.startRoad([50, 0.25, 90], 0, 15);
	generator.moveTo([-90, 0, 0], 0);
	generator.moveTo([-30, 0, -30], 0);
	generator.moveTo([0, 0, -90], 0);
	generator.moveTo([30, 0, -30], 0);
	generator.moveTo([90, 0, 0], 0);
	generator.moveTo([30, 0, 30], 0);
	generator.moveTo([0, 0, 90], 0);
	generator.moveTo([-30, 0, 30], 0);
	generator.endCircle();
	generator.endRoad();

	//const rotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 4);
	//const angar = new Building("HOUSE",new Vector3(20, 0, 0), rotation, new Vector3(10, 4, 10));
	//scene.add(angar);

	const wall = new WallWithWindow(new Vector3(15, 2, 0), new Quaternion(), new Vector3(0.25, 4, 10));
	scene.add(wall);
	wall.syncPhysics();
	//generator.addBordersToRoad(generator.roadLeftSide, -1);
	//generator.addBordersToRoad(generator.roadRightSide, 1);
}
