import { ResourceLoader } from "./ResourceLoader";
import { BufferAttribute, BufferGeometry, Clock, LineBasicMaterial, LineSegments } from "three";
import initScene from "./SceneInit";
import { ColliderDesc, EventQueue, World } from "@dimforge/rapier3d";
import { Part } from "./Parts/Part";
import { Wall } from "./Environment/Building";
import Keyboard from "./Keyboard";
import FollowCam from "./Character/FollowCam";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import type { Entity } from "./Entity";
import { NetworkManager } from "./NetworkManager";
import type { PlayerState } from "./shared";

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
		//renderer.domElement.requestPointerLock();
	},
	false
);

const world = new World({ x: 0.0, y: -9.81, z: 0.0 });
world.numSolverIterations = 16;
const eventQueue = new EventQueue(true);

const { scene, camera, renderer, stats } = initScene();

const params = new URLSearchParams(window.location.search);
const nick = params.get("nick");
console.log(nick);

const networkManager = new NetworkManager();
await networkManager.connect("http://localhost:3000", nick || "");

//networkManager.on("gameState", onGameState.bind(this));
networkManager.on("playerJoined", onPlayerJoined);
networkManager.on("playerLeft", onPlayerLeft);
//networkManager.on("playerUpdate", onPlayerUpdate.bind(this));

const entities: Map<string, Entity> = new Map();

/*
function createPlayer(playerState: PlayerState): void {
	const isLocal = playerState.id === networkManager.getSocketId();
	const player = new Player();
	player.updateFromState(playerState);

	players.set(playerState.id, player);

	addEntity(player);

	if (isLocal) {
		//localPlayer = player;
	}

	console.log(`Player ${playerState.id} ${isLocal ? "(local)" : "(remote)"} joined the game`);
}
*/

function onPlayerJoined(playerState: PlayerState): void {
	console.log("PlayerJoined", playerState);

	//createPlayer(playerState);
}

function onPlayerLeft(_playerId: string): void {
	//this.removePlayer(playerId);
}

const keyboard = new Keyboard(renderer);
const followCam = new FollowCam(scene, camera, renderer);

//const localPlayer = new Player(new Vector3(2, 2, 0), keyboard, nick || "");
//await player.init();

const controls = new OrbitControls(camera, renderer.domElement);

//setupEnvironment();
const colliderDesc = ColliderDesc.cuboid(100, 1, 100);
world.createCollider(colliderDesc);

function addEntity(entity: Entity) {
	entity.body = world.createRigidBody(entity.bodyDesc);
	entity.collider = world.createCollider(entity.colliderDesc, entity.body);
	scene.add(entity.object);
}

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
		if (body.isMoving() && body.userData) {
			if (body.userData instanceof Part) {
				const part = body.userData as Part;
				part.quaternion.copy(body.rotation());
				part.position.copy(body.translation());
			} else if (body.userData instanceof Wall) {
				/*const wall = body.userData as Wall;
				wall.quaternion.copy(body.rotation());
				wall.position.copy(body.translation());*/
			}
		}
	});

	world.colliders.forEach((_collider) => {
		/*world.contactPairsWith(collider, (otherCollider) => {
			console.log(otherCollider);
		});*/
	});

	/*eventQueue.drainContactForceEvents((event) => {
		let handle1 = event.collider1(); // Handle of the first collider involved in the event.
		let handle2 = event.collider2(); // Handle of the second collider involved in the event.
		console.log(handle1, handle2, event);
	});*/

	eventQueue.drainCollisionEvents((_handle1, _handle2, _started) => {
		//console.log(handle1, handle2, started);
		//if (started) localPlayer.setGrounded();
	});

	//localPlayer.update(delta);

	//localPlayer.updateFromPhysics();

	controls.update();

	followCam.update(delta);

	renderRapierDebug(world);

	renderer.render(scene, camera);

	stats.update();
};

renderer.setAnimationLoop(gameLoop);
