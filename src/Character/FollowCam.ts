import { Matrix4, Object3D, PerspectiveCamera, Quaternion, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from "three";
import { clamp } from "three/src/math/MathUtils.js";
import { Gyroscope } from "three/examples/jsm/Addons.js";
import type AttachPoint from "../Parts/AttachPoint";
import { Part } from "../Parts/Part";
import PartsList from "../Parts/PartsList";

export default class FollowCam {
	public camera: PerspectiveCamera;
	public pivot = new Object3D();
	public yaw = new Object3D();
	private pitch = new Object3D();
	private hand = new Hand();
	public cameraOffset: Vector3 = new Vector3(0.35, 0.75, 0);
	private raycaster: Raycaster = new Raycaster();
	private scene: Scene;
	private partsList: PartsList;

	constructor(scene: Scene, camera: PerspectiveCamera, renderer: WebGLRenderer) {
		this.scene = scene;
		this.camera = camera;
		this.raycaster.far = 100;

		this.partsList = new PartsList();
		this.partsList.position.set(0, -0.125, 4.5);
		this.partsList.scale.set(0.1, 0.1, 0.1);

		this.yaw.position.copy(this.cameraOffset.clone().applyQuaternion(this.camera.quaternion));

		document.addEventListener("pointerlockchange", () => {
			if (document.pointerLockElement === renderer.domElement) {
				renderer.domElement.addEventListener("mousemove", this.onDocumentMouseMove);
				renderer.domElement.addEventListener("wheel", this.onDocumentMouseWheel, { passive: false });
				renderer.domElement.addEventListener("pointerdown", this.onDocumentMouseClick);
			} else {
				renderer.domElement.removeEventListener("mousemove", this.onDocumentMouseMove);
				renderer.domElement.removeEventListener("wheel", this.onDocumentMouseWheel);
				renderer.domElement.removeEventListener("pointerdown", this.onDocumentMouseClick);
			}
		});

		scene.add(this.pivot);
		this.pivot.name = "FollowCam pivot";
		this.pivot.add(this.yaw);
		this.yaw.add(this.pitch);
		this.yaw.name = "FollowCam yaw";
		this.pitch.name = "FollowCam pitch";
		this.pitch.add(camera); // adding the perspective camera to the hierarchy
		this.pitch.add(this.hand);
		this.pitch.add(this.partsList);
	}

	onDocumentMouseMove = (e: MouseEvent) => {
		this.yaw.rotation.y -= e.movementX * 0.002;
		const v = this.pitch.rotation.x - e.movementY * 0.002;

		// limit range
		if (v > -1 && v < 1) {
			this.pitch.rotation.x = v;
		}

		if (this.hand.part && !this.hand.empty) {
			this.raycaster.setFromCamera(new Vector2(0, 0), this.camera);
			this.raycaster.layers.set(8);
			const intersections = this.raycaster.intersectObjects(this.scene.children);
			if (intersections.length > 0) {
				const intersection = intersections[0];
				const fantomeMesh = intersection.object;
				const pos = new Vector3();
				const quat = new Quaternion();
				const scale = new Vector3();
				const inverseMatrix = new Matrix4().copy(this.hand.matrixWorld).invert();
				fantomeMesh.matrixWorld.decompose(pos, quat, scale);
				pos.applyMatrix4(inverseMatrix);
				this.hand.part.position.copy(pos);
				this.hand.part.quaternion.copy(quat);

				if (fantomeMesh.parent?.parent) {
					this.hand.snapToPart = fantomeMesh.parent.parent as Part;
					this.hand.snapPoints = fantomeMesh.userData as { A: AttachPoint; B: AttachPoint };
				} else {
					this.hand.snapToPart = null;
					this.hand.snapPoints = null;
				}
			} else {
				this.hand.snapToPart = null;
				this.hand.snapPoints = null;
				this.hand.part.position.set(0, 0, 0);
			}
		}
	};

	onDocumentMouseWheel = (e: WheelEvent) => {
		e.preventDefault();
		if (e.altKey) {
			const v = this.camera.position.z + e.deltaY * 0.005;
			if (v >= 0 && v <= 10) {
				this.camera.position.z = v;
				this.partsList.position.z = v - 0.5;

				const y = 1.2 - (v / 10) * (1.2 - 0.75); // линейно уменьшается с ростом v
				this.cameraOffset.setY(clamp(y, 0.75, 1.2));
			}
		} else {
			if (e.deltaY > 0) this.partsList.selectNext();
			else this.partsList.selectPrev();
		}
	};

	onDocumentMouseClick = (e: PointerEvent) => {
		e.preventDefault();

		if (this.hand.empty) {
			this.raycaster.setFromCamera(new Vector2(0, 0), this.camera);
			this.raycaster.layers.set(10);
			const intersections = this.raycaster.intersectObjects(this.scene.children);
			if (intersections.length > 0) {
				const intersection = intersections[0];
				const part = intersection.object.parent;
				if (part instanceof Part) {
					if (e.buttons === 1) {
						part.position.set(0, 0, 0);
						part.deleteBody();
						this.hand.takePart(part);
						if (part.craft) part.craft.update();
						part.craft = null;
					} else if (e.buttons === 2) {
						const clone = new Part(part.partType);
						this.hand.takePart(clone);
					}
					part.detach();
					/*const crafts = this.scene.getObjectByName("Crafts") as Crafts;
					if (crafts) crafts.drawFantoms(part);
					return;*/
				}
			}
		}

		if (!this.hand.empty && this.hand.part) {
			console.log("do", this.hand.part);
			const part = this.hand.part;
			if (!part.craft) {
				/*const crafts = this.scene.getObjectByName("Crafts") as Crafts;
				if (crafts) {
					const craft = crafts.createCraft();
					const pos: Vector3 = new Vector3();
					this.hand.getWorldPosition(pos);
					part.position.copy(pos);
					craft.add(part);
					part.craft = craft;
					part.addPhysics();
					crafts.removeFantoms();
				}*/
			}
			if (this.hand.snapToPart && this.hand.snapPoints) {
				this.hand.snapToPart.craft?.add(part);
				part.craft?.update();
				this.hand.snapToPart.attachPart(part, this.hand.snapPoints.A, this.hand.snapPoints.B);
			}
		}
	};
}

class Hand extends Gyroscope {
	part: Part | null = null;
	snapToPart: Part | null = null;
	snapPoints: { A: AttachPoint; B: AttachPoint } | null = null;
	constructor() {
		super();
		this.name = "Hand";
		this.position.set(0, 0, -2);
	}

	takePart(part: Part) {
		this.add(part);
		this.part = part;
	}

	dropPart() {
		this.clear();
		this.part = null;
	}

	get empty() {
		return this.children.length === 0;
	}
}
