import { ResourceLoader } from "./ResourceLoader";
import { BufferAttribute, BufferGeometry, Clock, LineBasicMaterial, LineSegments, Quaternion, Vector3 } from "three";
import initScene from "./SceneInit";
import { EventQueue, JointData, RigidBody, World } from "@dimforge/rapier3d";
import { Wall } from "./Environment/Building";
import Keyboard from "./Keyboard";
import FollowCam from "./Character/FollowCam";
import { Entity } from "./Entity";
import { setupEnvironment } from "./Environment/Environment";
import { WorldGenerator } from "./Environment/WorldGenerator";
import { NetworkManager } from "./NetworkManager";
import { Player } from "./Character/Player";
import { NPC } from "./Character/NPC";
import type { EntityState, GameState, PlayerState } from "./shared";
import { LocalPlayer } from "./Character/LocalPlayer";
import Character from "./Character/Character";

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

const world = new World({ x: 0.0, y: -9.81, z: 0.0 });
world.numSolverIterations = 16;
const eventQueue = new EventQueue(true);

const { scene, camera, renderer, stats } = initScene();

const keyboard = new Keyboard(renderer);
const followCam = new FollowCam(scene, camera, renderer);
//const orbitControls = new OrbitControls(camera, renderer.domElement);

const environment = setupEnvironment();
scene.add(environment);

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

function fixedJoint(body1: RigidBody, body2: RigidBody, anchor1?: Vector3, anchor2?: Vector3, frame1?: Quaternion, frame2?: Quaternion) {
	const pos1W = new Vector3(body1.translation().x, body1.translation().y, body1.translation().z);
	const pos2W = new Vector3(body2.translation().x, body2.translation().y, body2.translation().z);
	const rot1W = new Quaternion(body1.rotation().x, body1.rotation().y, body1.rotation().z, body1.rotation().w);
	const rot2W = new Quaternion(body2.rotation().x, body2.rotation().y, body2.rotation().z, body2.rotation().w);

	// локальная позиция body2 относительно body1
	const pos2L = pos2W.clone().sub(pos1W).applyQuaternion(rot1W.clone().invert());
	// локальная ориентация body2 относительно body1
	const rot2L = rot1W.clone().invert().multiply(rot2W);

	if (anchor1 && anchor2) {
		//body1.setTranslation(body2pos.sub(anchor1).add(anchor2), false);
	} else {
		/*const delta = new Vector3().subVectors(body1pos, body2pos);
		anchor1 = delta.clone().multiplyScalar(0.5);
		anchor2 = delta.clone().multiplyScalar(-0.5);*/
		anchor1 = pos2L;
		anchor2 = new Vector3(0, 0, 0);
	}
	frame1 = frame1 ?? rot2L;
	frame2 = frame2 ?? new Quaternion();
	//const invBody2 = body2rot.clone().invert();
	//frame2 = invBody2.multiply(body1rot).multiply(frame1);
	const params = JointData.fixed(anchor1, frame1, anchor2, frame2);
	const joint = world.createImpulseJoint(params, body1, body2, false);
	return joint;
}

// ENTITIES
const entities: Map<string, Entity> = new Map();
//const players: Map<string, PlayerState> = new Map();

function addEntity(entityOrArray: Entity | Entity[] | undefined) {
	if (!entityOrArray) return;
	const list = Array.isArray(entityOrArray) ? entityOrArray : [entityOrArray];

	for (const entity of list) {
		entity.body = world.createRigidBody(entity.bodyDesc);
		entity.collider = world.createCollider(entity.colliderDesc, entity.body);
		scene.add(entity.object);
		entities.set(entity.ID, entity);
	}
}

function createEntityFromState(entityState: EntityState) {
	const position = new Vector3().fromArray(entityState.position);
	const rotation = new Quaternion().fromArray(entityState.rotation);
	switch (entityState.type) {
		case "player":
			let player;
			if (entityState.ID !== network.getSocketId()) player = new Player(entityState.ID, position, entityState.name);
			else player = new LocalPlayer(entityState.ID, position, entityState.name, keyboard);
			return player;
		case "npc":
			const npc = new NPC(entityState.ID, position);
			return npc;
		case "wall":
			const wall = new Wall(entityState.ID, position, rotation, new Vector3(0.25, 4, 10));
			return wall;
		default:
			break;
	}
}

// NETWORK
let localPlayer: Entity | null = null;
const network = new NetworkManager("http://localhost:3000");
await network.connect();

network.on("gameState", (data: GameState) => {
	data.entities.forEach((entityState) => {
		if (entities.has(entityState.ID)) {
			const entity = entities.get(entityState.ID);
			if (entity) {
				if (entity instanceof LocalPlayer) {
				} else {
					entity.updateFromState(entityState);
					if (entity.body) {
						const posDelta = entity.networkPosition.clone().sub(entity.body.translation());
						//console.log(entity.type, posDelta);
					}
				}
			}
		} else {
			addEntity(createEntityFromState(entityState));
		}
	});

	entities.forEach((entity) => {
		if (!data.entities.some((e) => e.ID === entity.ID)) {
			entity.object.removeFromParent();
			if (entity.body) world.removeRigidBody(entity.body);
			if (entity.collider) world.removeCollider(entity.collider, false);
			entities.delete(entity.ID);
		}
	});

	let pingStatsHtml = "Socket Ping Stats<br/><br/>";
	let timestamp = Date.now(); //performance.now();
	data.players.forEach((player) => {
		pingStatsHtml += player.nick + " " + (timestamp - player.timestamp) + "ms<br/>";
	});
	(document.getElementById("pingStats") as HTMLDivElement).innerHTML = pingStatsHtml;

	if (!localPlayer) {
		localPlayer = entities.get(network.getSocketId() as string) || null;
	} else {
		if (localPlayer.body?.isSleeping() === false) {
			localPlayer.sendNetworkState(network.socket);
		}
	}

});

/*for (let i = 1; i < ff.parts.length; i++) {
	const body1 = ff.parts[0].body;
	const body2 = ff.parts[i].body;
	if (body1 && body2) {
		fixedJoint(body1, body2);
	}
}*/

// DEBUG
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

	/*world.colliders.forEach((_collider) => {
		world.contactPairsWith(collider, (otherCollider) => {
			console.log(otherCollider);
		});
	});*/

	//eventQueue.drainContactForceEvents

	eventQueue.drainCollisionEvents((_handle1, _handle2, started) => {
		if (started && localPlayer) (localPlayer as LocalPlayer).setGrounded();
	});

	entities.forEach((entity) => {
		entity.updateFromPhysics();
		if (entity instanceof Character) (entity as Character).updateControls(delta);
		if (entity instanceof Player) entity.updateBodyFromNetwork();
	});

	//orbitControls.update();

	followCam.update(delta);
	if (localPlayer) {
		followCam.follow(delta, localPlayer.object.position);
		(localPlayer as LocalPlayer).followCamYaw = followCam.yaw.rotation.y;
	}

	renderRapierDebug(world);

	renderer.render(scene, camera);

	stats.update();
};

renderer.setAnimationLoop(gameLoop);
