import SceneInit from "./SceneInit";
import { ResourceLoader } from "./ResourceLoader";
import RAPIER from "@dimforge/rapier3d";
import { BufferAttribute, BufferGeometry, Color, LineBasicMaterial, LineSegments, Vector3 } from "three";
import CarController from "./CarController2";
import { setupEnvironment } from "./Environment";
import type { KeyMap } from "./types";
import { CameraController } from "./CameraController";

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

const keyMap: KeyMap = {};
const handleKeyboardEvent = (e: KeyboardEvent) => (keyMap[e.code] = e.type === "keydown");
document.addEventListener("keydown", handleKeyboardEvent);
document.addEventListener("keyup", handleKeyboardEvent);

const world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
world.numSolverIterations = 16;

const game = new SceneInit({ sceneName: "game", stats: true });
game.scene.background = new Color(0x333333);

world.createCollider(RAPIER.ColliderDesc.cuboid(1000.0, 0.1, 1000.0).setTranslation(0, 0, 0));

setupEnvironment(game);

const car = new CarController(world, keyMap, new Vector3(0, 4, 0));

game.controls = new CameraController(game.camera)

const debugLines = new LineSegments(new BufferGeometry(), new LineBasicMaterial({ vertexColors: true }));
game.scene.add(debugLines);

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
	car.update()
	game.controls?.target.copy(car.carBodyPos);
	setTimeout(gameLoop, 16);
};

gameLoop();
