import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import type { CameraController } from "./CameraController";

export default class SceneInit {
	private sceneName: string;
	scene: THREE.Scene;
	fov: number;
	camera: THREE.PerspectiveCamera;
	renderer: THREE.WebGLRenderer;
	nearPlane: number;
	farPlane: number;
	clock: THREE.Clock;
	private stats: Stats | null;
	controls: OrbitControls | CameraController | null = null;
	ambientLight: THREE.AmbientLight;
	directionalLight: THREE.DirectionalLight;

	constructor(parameters: { sceneName: string; stats?: boolean; camera?: THREE.PerspectiveCamera; orbitControls?: boolean }) {
		
		this.scene = new THREE.Scene();
		this.sceneName = parameters.sceneName;
		this.scene.name = this.sceneName;

		//this.scene.environment = resources.get("spruit_sunrise");
		if (this.scene.environment) this.scene.environment.mapping = THREE.EquirectangularReflectionMapping;
		this.scene.fog = new THREE.Fog(0x333333, 10, 1000);

		this.fov = 45;
		this.nearPlane = 0.1;
		this.farPlane = 1000;
		this.camera = parameters.camera
			? parameters.camera
			: new THREE.PerspectiveCamera(this.fov, window.innerWidth / window.innerHeight, this.nearPlane, this.farPlane);
		if (this.camera) this.camera.position.z = 5;

		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
		});
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = 0.85;

		const canvas = this.renderer.domElement;
		canvas.id = this.sceneName;
		canvas.className = "canvas";
		document.body.appendChild(canvas);

		this.clock = new THREE.Clock();
		this.stats = parameters.stats ? new Stats() : null;
		if (this.stats) document.body.appendChild(this.stats.dom);

		this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		this.scene.add(this.ambientLight);

		this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
		this.directionalLight.position.set(0, 1500, 1000);
		this.directionalLight.castShadow = true;
		this.directionalLight.shadow.camera.top = 2000;
		this.directionalLight.shadow.camera.bottom = -2000;
		this.directionalLight.shadow.camera.left = -2000;
		this.directionalLight.shadow.camera.right = 2000;
		this.directionalLight.shadow.camera.near = 1200;
		this.directionalLight.shadow.camera.far = 2500;
		this.directionalLight.shadow.bias = 0.0001;
		this.directionalLight.shadow.mapSize.width = 2048;
		this.directionalLight.shadow.mapSize.height = 2048;
		this.scene.add(this.directionalLight);

		// events
		window.addEventListener("resize", () => this.onWindowResize(), false);

		this.renderer.setAnimationLoop(this.animate);
	}


	private animate = () => {
		this.render();
		if (this.stats) this.stats.update();
		if (this.controls) this.controls.update();
	};

	private render() {
		this.renderer.render(this.scene, this.camera);
	}

	private onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

	public dispose() {
		this.scene.name = "deleted" + this.scene.name;
		this.camera.clear();
		this.ambientLight.dispose();
		this.scene.clear();
		this.directionalLight.dispose();
		this.scene.removeFromParent();
		this.renderer.setAnimationLoop(null);
		this.renderer.dispose();
	}
}
