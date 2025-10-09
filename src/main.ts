import SceneInit from "./SceneInit";
import { ResourceLoader } from "./ResourceLoader";
import RAPIER from "@dimforge/rapier3d";
import {
	BufferAttribute,
	BufferGeometry,
	Color,
	LineBasicMaterial,
	LineSegments,
	MathUtils,
	Mesh,
	MeshPhysicalMaterial,
	MeshStandardMaterial,
	Object3D,
	PlaneGeometry,
	Quaternion,
	Vector3,
} from "three";

import { CameraController } from "./CameraController";
import CarController from "./CarController";
import { Sky, Water2, type Water2Options } from "three/examples/jsm/Addons.js";

const loading = document.getElementById("loading");
export const resources = new ResourceLoader();
resources.onProgress = (p, url) => {
	if (loading) loading.innerText = `Loading1111: ${(p * 100).toFixed(0)}%\n${url}`;
};
resources.onLoad = () => {
	console.log("✅ All resources loaded");
};
await resources.loadManifest();
await resources.loadAll();
loading?.remove();

const game = new SceneInit({ sceneName: "game", stats: true });
game.scene.background = new Color(0x333333);

let world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });

const racetrack = resources.get("racetrack");

/*racetrack.scene.children[0].children.forEach((mesh: Mesh) => {
	const geometry = mesh.geometry;
	if (geometry.index) {
		const groundColliderDesc = RAPIER.ColliderDesc.convexMesh(geometry.attributes.position.array as Float32Array);
		if (groundColliderDesc) world.createCollider(groundColliderDesc);
		console.log(groundColliderDesc);
	}
});*/

game.scene.add(racetrack.scene.children[0]);
racetrack.name = "racetrack";

const sky = new Sky();
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
water.name = "water";
game.scene.add(water);

let groundColliderDesc = RAPIER.ColliderDesc.cuboid(1000.0, 0.1, 1000.0).setTranslation(0, 0, 0);
world.createCollider(groundColliderDesc);

const ferrari = resources.get("ferrari");
const ferrari_model_root = ferrari.scene.children[0];

(ferrari_model_root as Object3D).position.set(3, 0, 0);

const carModel = (ferrari_model_root as Object3D).clone();

carModel.traverse((o) => {
	o.castShadow = true;
});

const bodyMaterial = new MeshPhysicalMaterial({
	color: 0xff0000,
	metalness: 1.0,
	roughness: 0.5,
	clearcoat: 1.0,
	clearcoatRoughness: 0.03,
});

const detailsMaterial = new MeshStandardMaterial({
	color: 0xffffff,
	metalness: 1.0,
	roughness: 0.5,
});

const glassMaterial = new MeshPhysicalMaterial({
	color: 0xffffff,
	metalness: 0.25,
	roughness: 0,
	transmission: 1.0,
});

(carModel.getObjectByName("body") as Mesh).material = bodyMaterial;
(carModel.getObjectByName("rim_fl") as Mesh).material = detailsMaterial;
(carModel.getObjectByName("rim_fr") as Mesh).material = detailsMaterial;
(carModel.getObjectByName("rim_rr") as Mesh).material = detailsMaterial;
(carModel.getObjectByName("rim_rl") as Mesh).material = detailsMaterial;
(carModel.getObjectByName("trim") as Mesh).material = detailsMaterial;
(carModel.getObjectByName("glass") as Mesh).material = glassMaterial;

carModel.position.set(0, 2.5, 0);
carModel.name = "carModel";
game.scene.add(carModel);

const carMesh = carModel.getObjectByName("main") as Object3D;
const wheelBLMesh = carModel.getObjectByName("wheel_rl") as Object3D;
const wheelBRMesh = carModel.getObjectByName("wheel_rr") as Object3D;
const wheelFLMesh = carModel.getObjectByName("wheel_fl") as Object3D;
const wheelFRMesh = carModel.getObjectByName("wheel_fr") as Object3D;
const steering_wheel = carModel.getObjectByName("steering_wheel") as Object3D;

const body_geometry = (carModel.getObjectByName("body") as Mesh).geometry;
let body_collider = RAPIER.ColliderDesc.convexHull(body_geometry.attributes.position.array as Float32Array);

if (body_collider) {
	const newQuaternion = new Quaternion();
	const fixX = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2);
	const fixY = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2);
	newQuaternion.multiply(fixY);
	newQuaternion.multiply(fixX);
	body_collider.setCollisionGroups(131073).setMass(1000).setRotation(newQuaternion);
}

body_collider = null;

const carParts = {
	rootPos: carModel.position.clone(),
	main: {
		model: carMesh,
		collider: body_collider ? body_collider : RAPIER.ColliderDesc.cuboid(1, 0.5, 2.3).setCollisionGroups(131073).setMass(1000),
	},
	wheels: [
		{
			model: wheelBLMesh,
			collider: RAPIER.ColliderDesc.roundCylinder(0.08, 0.3, 0.06)
				.setRotation(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -Math.PI / 2))
				.setRestitution(0)
				.setFriction(2)
				.setMass(30)
				.setCollisionGroups(262145),
		},
		{
			model: wheelBRMesh,
			collider: RAPIER.ColliderDesc.roundCylinder(0.08, 0.3, 0.06)
				.setRotation(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -Math.PI / 2))
				.setRestitution(0)
				.setFriction(2)
				.setMass(30)
				.setCollisionGroups(262145),
		},
		{
			model: wheelFLMesh,
			collider: RAPIER.ColliderDesc.roundCylinder(0.08, 0.3, 0.06)
				.setRotation(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -Math.PI / 2))
				.setRestitution(0)
				.setFriction(2)
				.setMass(30)
				.setCollisionGroups(262145),
		},
		{
			model: wheelFRMesh,
			collider: RAPIER.ColliderDesc.roundCylinder(0.08, 0.3, 0.06)
				.setRotation(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -Math.PI / 2))
				.setRestitution(0)
				.setFriction(2)
				.setMass(30)
				.setCollisionGroups(262145),
		},
		{
			model: steering_wheel,
			collider: RAPIER.ColliderDesc.roundCylinder(0.01, 0.15, 0.01)
				.setRestitution(0)
				.setFriction(2)
				.setMass(30)
				.setCollisionGroups(262145),
		},
	],
};

game.controls = new CameraController(game.camera, carParts.main.model);

const debugLines = new LineSegments(new BufferGeometry(), new LineBasicMaterial({ vertexColors: true }));
game.scene.add(debugLines);

/*const dragControls = new DragControls({
	objects: game.scene.children,
	camera: game.camera,
	domElement: game.renderer.domElement,
	cameraController: game.controls,
});*/

function renderRapierDebug(world: RAPIER.World) {
	const { vertices, colors } = world.debugRender();
	const positions = new Float32Array(vertices.length);
	const colorArray = new Float32Array(colors.length);

	for (let i = 0; i < vertices.length; i++) positions[i] = vertices[i];
	for (let i = 0; i < colors.length; i++) colorArray[i] = colors[i];

	debugLines.geometry.setAttribute("position", new BufferAttribute(positions, 3));
	debugLines.geometry.setAttribute("color", new BufferAttribute(colorArray, 4));
	debugLines.geometry.computeBoundingSphere();
}

let gameLoop = () => {
	world.step();
	renderRapierDebug(world);
	setTimeout(gameLoop, 16);
};

gameLoop();
