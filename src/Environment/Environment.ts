import { type World } from "@dimforge/rapier3d";
import { Group, MathUtils, PlaneGeometry, Scene, Vector3 } from "three";
import { Sky, Water2, type Water2Options } from "three/examples/jsm/Addons.js";
import { WorldGenerator } from "./WorldGenerator";
import Craft from "../Vehicle/Craft";
import type { Part } from "../Parts/PartsList";

export class Crafts extends Group {
	nextID = 1;
	children: Craft[];

	constructor() {
		super();
		this.name = "Crafts";
		this.children = [];
	}

	createCraft() {
		const craft = new Craft();
		craft.name = "craft" + this.nextID++;
		this.add(craft);
		return craft;
	}

	drawFantoms(selectedPart: Part) {
		this.children.forEach((child) => {
			if (child instanceof Craft) child.drawFantoms(selectedPart);
		});
	}

	removeFantoms() {
		this.children.forEach((child) => {
			if (child instanceof Craft) child.removeFantoms();
		});
	}
}

export function setupEnvironment(scene: Scene, world: World) {
	const crafts = new Crafts();
	scene.add(crafts);

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

	//generator.addBordersToRoad(generator.roadLeftSide, -1);
	//generator.addBordersToRoad(generator.roadRightSide, 1);
}
