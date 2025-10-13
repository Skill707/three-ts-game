import { BoxGeometry, ConeGeometry, Group, Mesh, MeshBasicMaterial, Object3D, Quaternion, SphereGeometry, Vector3, type EulerTuple } from "three";
import type Craft from "../Vehicle/Craft";
import { world } from "../main";
import { Collider, ColliderDesc, JointData, RigidBodyDesc, type RigidBody } from "@dimforge/rapier3d";
import AttachPoint from "./AttachPoint";

type PartType = "block" | "cone" | "sphere";

const rotationPresets: Record<string, EulerTuple> = {
	front: [0, 0, 0, "XYZ"], // +Z
	back: [0, Math.PI, 0, "XYZ"], // -Z
	top: [-Math.PI / 2, 0, 0, "XYZ"], // +Y
	bottom: [Math.PI / 2, 0, 0, "XYZ"], // -Y
	right: [0, -Math.PI / 2, 0, "XYZ"], // +X
	left: [0, Math.PI / 2, 0, "XYZ"], // -X
};

export default class PartsList extends Object3D {
	children: Part[];
	constructor() {
		super();
		this.name = "PartsList";
		this.children = [];

		const block = new Part("block");
		block.position.set(0, 0, 0);
		this.add(block);

		const cone = new Part("cone");
		cone.position.set(2, 0, 0);
		this.add(cone);

		const sphere = new Part("sphere");
		sphere.position.set(-2, 0, 0);
		this.add(sphere);
	}
}

interface AttachPoints extends Group {
	children: AttachPoint[];
}

export class Part extends Object3D {
	partType: PartType;
	craft: Craft | null = null;
	body: RigidBody | null = null;
	collider: Collider | null = null;
	mesh: Mesh | null = null;
	attachPoints: AttachPoints = new Group() as AttachPoints;

	constructor(partType: PartType) {
		super();
		this.partType = partType;
		this.name = partType + this.id;
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
			geometry = new ConeGeometry(0.5, 0.5);
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
		this.mesh = new Mesh(geometry, material);
		this.mesh.name = partType;
		this.mesh.layers.enable(10);
		this.add(this.mesh);
		this.add(this.attachPoints);
	}

	addPhysics() {
		this.body = world.createRigidBody(RigidBodyDesc.dynamic());

		const position: Vector3 = new Vector3();
		this.getWorldPosition(position);
		this.body.setTranslation(position, false);
		let colliderDesc: ColliderDesc | null;

		if (this.partType === "block") {
			colliderDesc = ColliderDesc.cuboid(0.25, 0.25, 0.25);
		} else if (this.partType === "cone") {
			colliderDesc = ColliderDesc.cone(0.25, 0.5);
		} else if (this.partType === "sphere") {
			colliderDesc = ColliderDesc.ball(0.25);
		} else {
			colliderDesc = null;
		}

		if (colliderDesc) {
			colliderDesc.setMass(1); //.setTranslation(...this.position.toArray())
			this.collider = world.createCollider(colliderDesc, this.body);
		}

		this.body.userData = this;
	}

	deleteBody() {
		if (this.body) {
			world.removeRigidBody(this.body);
		}
		//this.removeFromParent();
	}

	showAttachPoints() {
		this.add(this.attachPoints);
	}

	hideAttachPoints() {
		this.remove(this.attachPoints);
	}

	attachPart(part: Part, A: AttachPoint, B: AttachPoint) {
		if (this.collider && part.collider) {
			this.collider.setCollisionGroups(131073);
			part.collider.setCollisionGroups(131073);
		}
		if (this.body && part.body) {
			const jointData = JointData.fixed(B.position, new Quaternion(), A.position, new Quaternion());
			const joint = world.createImpulseJoint(jointData, this.body, part.body, false);
			joint.setContactsEnabled(false);
			A.use(joint);
			B.use(joint);
			this.body.setAngvel(new Vector3(), false);
			part.body.setAngvel(new Vector3(), false);
			this.body.setLinvel(new Vector3(), false);
			part.body.setLinvel(new Vector3(), false);
		}
	}

	detach() {
		this.attachPoints.children.forEach((child) => child.unuse());
	}
}
