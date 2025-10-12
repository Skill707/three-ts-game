import Stats from "three/examples/jsm/libs/stats.module.js";
import {
	ACESFilmicToneMapping,
	AmbientLight,
	DirectionalLight,
	EquirectangularReflectionMapping,
	PCFSoftShadowMap,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
} from "three";
import { resources } from "./main";

export default function initScene() {
	const scene = new Scene();
	scene.name = "Game";

	scene.environment = resources.get("spruit_sunrise");
	if (scene.environment) scene.environment.mapping = EquirectangularReflectionMapping;
	//scene.fog = new Fog(0x333333, 10, 1000);

	const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.z = 5;

	const stats = new Stats();
	document.body.appendChild(stats.dom);

	const renderer = new WebGLRenderer({
		antialias: true,
		alpha: true,
	});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = PCFSoftShadowMap;
	renderer.toneMapping = ACESFilmicToneMapping;
	renderer.toneMappingExposure = 0.85;

	const canvas = renderer.domElement;
	canvas.id = "Game";
	canvas.className = "canvas";
	document.body.appendChild(canvas);

	const ambientLight = new AmbientLight(0xffffff, 0.5);
	scene.add(ambientLight);

	const directionalLight = new DirectionalLight(0xffffff, 1);
	directionalLight.position.set(0, 150, 100);
	directionalLight.castShadow = true;
	directionalLight.shadow.camera.top = 2000;
	directionalLight.shadow.camera.bottom = -2000;
	directionalLight.shadow.camera.left = -2000;
	directionalLight.shadow.camera.right = 2000;
	directionalLight.shadow.camera.near = 1200;
	directionalLight.shadow.camera.far = 2500;
	directionalLight.shadow.bias = 0.0001;
	directionalLight.shadow.mapSize.width = 2048;
	directionalLight.shadow.mapSize.height = 2048;
	directionalLight.shadow.camera.far = 1000;
	scene.add(directionalLight);

	// events

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}

	window.addEventListener("resize", () => onWindowResize(), false);

	return { scene, camera, renderer, stats };
}
