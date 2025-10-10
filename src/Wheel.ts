import RAPIER, { JointData, PrismaticImpulseJoint, RigidBody } from "@dimforge/rapier3d";
import { Quaternion, Vector2, Vector3 } from "three";
const zRot = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -Math.PI / 2);

export default class Wheel {
	wheelBody: RAPIER.RigidBody;
	size: Vector2;
	mass: number;
	private world: RAPIER.World;

	constructor(world: RAPIER.World, position: Vector3, size: Vector2 = new Vector2(0.25, 1), mass: number = 30) {
		this.wheelBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic());
		this.wheelBody.setTranslation(position, false);

		this.size = size;
		this.mass = mass;
		this.world = world;

		const wheelCollider = RAPIER.ColliderDesc.roundCylinder(size.x - 0.05, size.y, 0.05)
			.setCollisionGroups(262145)
			.setMass(mass * size.x * size.y)
			.setRotation(zRot);
		world.createCollider(wheelCollider, this.wheelBody);
	}

	attachTo(body: RigidBody, offset: Vector3) {

		const jointData = JointData.revolute(new Vector3(0, 0, 0), offset, new Vector3(1, 0, 0));
		const motor = this.world.createImpulseJoint(jointData, body, this.wheelBody, false);
		(motor as PrismaticImpulseJoint).configureMotorVelocity(-50, 2.0);

	}
}
