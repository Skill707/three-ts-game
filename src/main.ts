import { ResourceLoader } from "./ResourceLoader";
import { BufferAttribute, BufferGeometry, Clock, LineBasicMaterial, LineSegments, Vector3 } from "three";
import initScene from "./SceneInit";
import { EventQueue, World } from "@dimforge/rapier3d";
import Player from "./Character/Player";
import CarController from "./Vehicle/CarController";
import { setupEnvironment } from "./Environment/Environment";
import PartsList, { Part } from "./Parts/PartsList";
//import { JoystickControls } from 'three-joystick';

const loading = document.getElementById("loading");
export const resources = new ResourceLoader();
resources.onProgress = (p, url) => {
	if (loading) loading.innerText = `Loading: ${(p * 100).toFixed(0)}%\n${url}`;
};
resources.onLoad = () => {
	console.log("✅ All resources loaded");
};
await resources.loadManifest();
await resources.loadAll();
loading?.remove();

document.addEventListener(
	"click",
	() => {
		renderer.domElement.requestPointerLock();
	},
	false
);

export const collisionGroups = ["floor", "car", "steer", "susp", "wheel"];

export const world = new World({ x: 0.0, y: -9.81, z: 0.0 });
world.numSolverIterations = 16;

const eventQueue = new EventQueue(true);

const { scene, camera, renderer, stats } = initScene();

/*const joystickControls = new JoystickControls(
  camera,
  scene,
);*/

const partsList = new PartsList();
partsList.position.set(0, 1, 2);
scene.add(partsList);

const cars: CarController[] = [];
const player = new Player(scene, camera, renderer, world, cars, new Vector3(2, 4, 0));
await player.init();

//const controls = new OrbitControls(camera, renderer.domElement);

setupEnvironment(scene, world);

const debugLines = new LineSegments(new BufferGeometry(), new LineBasicMaterial({ vertexColors: true }));
debugLines.name = "DebugLines";
scene.add(debugLines);

function renderRapierDebug(world: World) {
	const { vertices, colors } = world.debugRender();
	const positions = new Float32Array(vertices.length);
	const colorArray = new Float32Array(colors.length);

	for (let i = 0; i < vertices.length; i++) positions[i] = vertices[i];
	for (let i = 0; i < colors.length; i++) colorArray[i] = colors[i];

	debugLines.geometry.setAttribute("position", new BufferAttribute(positions, 3));
	debugLines.geometry.setAttribute("color", new BufferAttribute(colorArray, 4));
	debugLines.geometry.computeBoundingSphere();
}

const clock = new Clock();

const gameLoop = () => {
	const delta = clock.getDelta();

	world.timestep = Math.min(delta, 0.1);
	world.step(eventQueue);

	world.bodies.forEach((body) => {
		if (body.isMoving() && body.userData && body.userData instanceof Part) {
			const part = body.userData as Part;
			part.quaternion.copy(body.rotation());
			part.position.copy(body.translation());
		}
	});

	world.colliders.forEach((collider) => {
		/*world.contactPairsWith(collider, (otherCollider) => {
			console.log(otherCollider);
		});*/
	});

	/*eventQueue.drainContactForceEvents((event) => {
		let handle1 = event.collider1(); // Handle of the first collider involved in the event.
		let handle2 = event.collider2(); // Handle of the second collider involved in the event.
		console.log(handle1, handle2, event);
	});*/

	eventQueue.drainCollisionEvents((_handle1, _handle2, started) => {
		//console.log(handle1, handle2, started);
		if (started) player.setGrounded();
	});

	cars.forEach((car) => car.update(delta));

	player.update(delta);

	//controls.update();

	renderRapierDebug(world);

	renderer.render(scene, camera);

	stats.update();
};

renderer.setAnimationLoop(gameLoop);
