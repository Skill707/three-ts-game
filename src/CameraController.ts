import * as THREE from "three";

export class CameraController {
	public enabled: boolean = true;
	private camera: THREE.PerspectiveCamera;
	private cameraClone: THREE.PerspectiveCamera;
	public target: THREE.Vector3;
	private offset: THREE.Vector3;
	private lookAtOffset: THREE.Vector3;
	private lerpSpeed: number;
	private yaw: number = Math.PI;
	private pitch: number = -Math.PI / 6;
	private sensitivity: number = 0.005;
	private fpv: boolean = false;

	constructor(camera: THREE.PerspectiveCamera) {
		this.camera = camera;
		this.cameraClone = this.camera.clone();
		this.target = new THREE.Vector3()
		this.offset = new THREE.Vector3(0, 0, 15); // смещение камеры
		this.lookAtOffset = new THREE.Vector3(0, 1, 0); // куда смотреть
		this.lerpSpeed = 0.1;
		document.addEventListener("pointermove", this.handlePointerMove);
		document.addEventListener("pointerdown", this.handlePointerDown);
		document.addEventListener("contextmenu", this.onContextMenu);
		document.addEventListener("wheel", this.handleMouseWheel);
		document.addEventListener("keydown", this.handleCkey);
	}

	private handlePointerMove = (e: MouseEvent) => {
		if (this.enabled && e.buttons === 1) {
			this.yaw -= e.movementX * this.sensitivity;
			this.pitch -= e.movementY * this.sensitivity;
			this.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.pitch));
			if (this.fpv) this.yaw = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.yaw));
		}
	};

	private handlePointerDown = (e: MouseEvent) => {
		e.preventDefault();
	};

	private onContextMenu = (e: MouseEvent) => {
		e.preventDefault();
	};

	private handleMouseWheel = (e: WheelEvent) => {
		this.offset.z += e.deltaY * 0.01;
		this.offset.clamp(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 30));
	};

	private handleCkey = (e: KeyboardEvent) => {
		switch (e.code) {
			case "KeyC":
				this.fpv = !this.fpv;
				if (this.fpv) {
					this.camera.near = 0;
					this.camera.fov = 90;
					this.lookAtOffset = new THREE.Vector3(-0.35, 0.9, -0.2);
				} else {
					this.camera.fov = 45;
					this.camera.near = this.cameraClone.near;
					this.lookAtOffset = new THREE.Vector3(0, 1, 0);
					this.offset = new THREE.Vector3(0, 0, 15);
				}
				break;
		}
	};

	update() {
		const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, "YXZ"));
		const targetPos = this.target.clone().add(this.lookAtOffset);
		const offset = this.fpv ? new THREE.Vector3(0, 0, 0) : this.offset.clone();
		const camOffset = targetPos.add(offset.applyQuaternion(rotation));
		this.camera.position.lerp(camOffset, this.lerpSpeed);
		this.camera.quaternion.slerp(rotation, this.lerpSpeed);
	}
}
