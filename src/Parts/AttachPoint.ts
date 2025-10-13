import type { ImpulseJoint } from "@dimforge/rapier3d";
import { ConeGeometry, Euler, Mesh, MeshBasicMaterial, Object3D, Vector3, type EulerTuple, type Vector3Tuple } from "three";

export default class AttachPoint extends Object3D {
	used: boolean = false;
	joint: ImpulseJoint | null = null;

	constructor(position: Vector3 | Vector3Tuple, rotation: Euler | EulerTuple) {
		super();
		this.name = "AttachPoint";
		this.visible = true;
		this.position.copy(new Vector3(...position));
		this.rotation.copy(rotation instanceof Euler ? rotation : new Euler(...rotation));

		const geometry = new ConeGeometry(0.1, 0.1).rotateX(Math.PI / 2);
		const material = new MeshBasicMaterial({ color: "blue" });
		const mesh = new Mesh(geometry, material);
		this.add(mesh);
	}

	public use(joint: ImpulseJoint) {
		this.used = true;
		this.joint = joint;
		((this.children[0] as Mesh).material as MeshBasicMaterial).color.set("red");
	}

	public unuse() {
		this.used = false;
		this.joint = null;
		((this.children[0] as Mesh).material as MeshBasicMaterial).color.set("blue");
	}
}
