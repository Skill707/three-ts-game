import { Object3D, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from "three";
import { clamp } from "three/src/math/MathUtils.js";

export default class FollowCam {
	private camera: PerspectiveCamera;
	public pivot = new Object3D();
	public yaw = new Object3D();
	private pitch = new Object3D();
	public cameraOffset: Vector3 = new Vector3(0, 0.75, 0);

	constructor(scene: Scene, camera: PerspectiveCamera, renderer: WebGLRenderer) {
		this.camera = camera;

		this.yaw.position.copy(this.cameraOffset);

		document.addEventListener("pointerlockchange", () => {
			if (document.pointerLockElement === renderer.domElement) {
				renderer.domElement.addEventListener("mousemove", this.onDocumentMouseMove);
				renderer.domElement.addEventListener("wheel", this.onDocumentMouseWheel);
			} else {
				renderer.domElement.removeEventListener("mousemove", this.onDocumentMouseMove);
				renderer.domElement.removeEventListener("wheel", this.onDocumentMouseWheel);
			}
		});

		scene.add(this.pivot);
		this.pivot.name = "FollowCam pivot";
		this.pivot.add(this.yaw);
		this.yaw.add(this.pitch);
		this.yaw.name = "FollowCam yaw";
		this.pitch.name = "FollowCam pitch";
		this.pitch.add(camera); // adding the perspective camera to the hierarchy
	}

	onDocumentMouseMove = (e: MouseEvent) => {
		this.yaw.rotation.y -= e.movementX * 0.002;
		const v = this.pitch.rotation.x - e.movementY * 0.002;

		// limit range
		if (v > -1 && v < 1) {
			this.pitch.rotation.x = v;
		}
	};

	onDocumentMouseWheel = (e: WheelEvent) => {
		e.preventDefault();
		const v = this.camera.position.z + e.deltaY * 0.005;

		// limit range
		if (v >= 0 && v <= 10) {
			this.camera.position.z = v;

			const y = 1.2 - (v / 10) * (1.2 - 0.75); // линейно уменьшается с ростом v
			this.cameraOffset.setY(clamp(y, 0.75, 1.2));
		}
	};
}
