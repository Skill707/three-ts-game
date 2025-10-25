import {
	BoxGeometry,
	ConeGeometry,
	Group,
	Mesh,
	MeshBasicMaterial,
	Quaternion,
	SphereGeometry,
	Vector3,
	type EulerTuple,
	type QuaternionTuple,
	type Vector3Tuple,
} from "three";
import AttachPoint from "./AttachPoint";
import { Entity } from "../Entity";
import { ColliderDesc, RigidBodyDesc } from "@dimforge/rapier3d";

type PartType = "block" | "cone" | "sphere";

const rotationPresets: Record<string, EulerTuple> = {
	front: [0, 0, 0, "XYZ"], // +Z
	back: [0, Math.PI, 0, "XYZ"], // -Z
	top: [-Math.PI / 2, 0, 0, "XYZ"], // +Y
	bottom: [Math.PI / 2, 0, 0, "XYZ"], // -Y
	right: [0, -Math.PI / 2, 0, "XYZ"], // +X
	left: [0, Math.PI / 2, 0, "XYZ"], // -X
};

interface AttachPoints extends Group {
	children: AttachPoint[];
}

export class Part extends Entity {
	//craft: Craft | null = null;
	attachPoints: AttachPoints = new Group() as AttachPoints;

	constructor(
		id: string,
		position: Vector3 | Vector3Tuple = new Vector3(),
		rotation: Quaternion | QuaternionTuple = new Quaternion(),
		partType: PartType,
		visual = false
	) {
		super(partType, true);
		this.ID = id;
		position = new Vector3(...position);
		rotation = new Quaternion(...rotation);

		if (!visual) {
			this.bodyDesc = RigidBodyDesc.dynamic()
				.setTranslation(...position.toArray())
				.setRotation(rotation);

			if (partType === "block") {
				this.colliderDesc = ColliderDesc.cuboid(0.25, 0.25, 0.25);
			} else if (partType === "cone") {
				this.colliderDesc = ColliderDesc.cone(0.25, 0.25);
			} else if (partType === "sphere") {
				this.colliderDesc = ColliderDesc.ball(0.25);
			}
		}
		this.attachPoints.name = "attachPoints";

		let geometry;
		if (partType === "block") {
			geometry = new BoxGeometry(0.5, 0.5, 0.5);
			this.attachPoints.add(
				new AttachPoint([0, 0, 0.25], rotationPresets.front),
				new AttachPoint([0, 0, -0.25], rotationPresets.back),
				new AttachPoint([0, 0.25, 0], rotationPresets.top),
				new AttachPoint([0, -0.25, 0], rotationPresets.bottom),
				new AttachPoint([0.25, 0, 0], rotationPresets.left),
				new AttachPoint([-0.25, 0, 0], rotationPresets.right)
			);
		} else if (partType === "cone") {
			geometry = new ConeGeometry(0.25, 0.5);
			this.attachPoints.add(new AttachPoint([0, -0.25, 0], rotationPresets.bottom));
		} else if (partType === "sphere") {
			geometry = new SphereGeometry(0.25);
			this.attachPoints.add(
				new AttachPoint([0, 0, 0.25], rotationPresets.front),
				new AttachPoint([0, 0, -0.25], rotationPresets.back),
				new AttachPoint([0, 0.25, 0], rotationPresets.top),
				new AttachPoint([0, -0.25, 0], rotationPresets.bottom),
				new AttachPoint([0.25, 0, 0], rotationPresets.left),
				new AttachPoint([-0.25, 0, 0], rotationPresets.right)
			);
		}
		const material = new MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
		this.object = new Mesh(geometry, material);
		this.object.name = partType;
		this.object.position.copy(position);
		this.object.quaternion.copy(rotation);
		//this.object.layers.enable(10);

		this.object.add(this.attachPoints);
	}

	deleteBody() {}

	attachPart(part: Part, A: AttachPoint, B: AttachPoint) {}

	detach() {
		this.attachPoints.children.forEach((child) => child.unuse());
	}
}
