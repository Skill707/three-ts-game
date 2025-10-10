import RAPIER, { JointData,  RigidBody, World } from "@dimforge/rapier3d";
import { Quaternion, Vector3 } from "three";

const zAxe = new Vector3(0, 0, 1);
const zRot = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -Math.PI / 2);

export default class Suspension {
	private world: World;
	public wheelHubBody: RigidBody;
	private lowerArmBody: RigidBody;
	private upperArmBody: RigidBody;
	//private radiusRotBody: RigidBody;
	private size: Vector3;

	constructor(world: World, position: Vector3 = new Vector3(0, 0, 0), size: Vector3 = new Vector3(1, 0.5, 0.5), mass: number = 30) {
		this.world = world;
		this.size = size;

		// positions
		const wheelHubPos = new Vector3().setX(size.x).add(position);
		const lowerArmPos = new Vector3()
			.setX(size.x / 2)
			.setY(-size.y / 2)
			.add(position);
		const upperArmPos = new Vector3()
			.setX(size.x / 2)
			.setY(size.y / 2)
			.add(position);
		//const radiusRotPos = new Vector3().setX(size.x).setZ(-size.z).add(position);

		// bodies
		this.wheelHubBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic());
		this.wheelHubBody.setTranslation(wheelHubPos, false);
		this.lowerArmBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic());
		this.lowerArmBody.setTranslation(lowerArmPos, false);
		this.upperArmBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic());
		this.upperArmBody.setTranslation(upperArmPos, false);
		//this.radiusRotBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic());
		//this.radiusRotBody.setTranslation(radiusRotPos, false);

		// joints

		const lowerArmAndWheelHubJointData = JointData.revolute(new Vector3(size.x / 2, 0, 0), new Vector3(0, -size.y / 2, 0), zAxe);
		world.createImpulseJoint(lowerArmAndWheelHubJointData, this.lowerArmBody, this.wheelHubBody, false);

		const upperArmAndWheelHubJointData = JointData.revolute(new Vector3(size.x / 2, 0, 0), new Vector3(0, size.y / 2, 0), zAxe);
		world.createImpulseJoint(upperArmAndWheelHubJointData, this.upperArmBody, this.wheelHubBody, false);

		/*const wheelHubAndradiusRotJointData = JointData.fixed(
			new Vector3(0, 0, -size.z / 2),
			new Quaternion(),
			new Vector3(0, 0, size.z / 2),
			new Quaternion()
		);*/
		//world.createImpulseJoint(wheelHubAndradiusRotJointData, this.wheelHubBody, this.radiusRotBody, false);

		// colliders

		const lowerArmCollider = RAPIER.ColliderDesc.cylinder(Math.abs(size.x) / 2, 0.05)
			.setCollisionGroups(262145)
			.setMass((mass * Math.abs(size.x)) / 2)
			.setRotation(zRot);
		world.createCollider(lowerArmCollider, this.lowerArmBody);

		const upperArmCollider = RAPIER.ColliderDesc.cylinder(Math.abs(size.x) / 2, 0.05)
			.setCollisionGroups(262145)
			.setMass((mass * Math.abs(size.x)) / 2)
			.setRotation(zRot);
		world.createCollider(upperArmCollider, this.upperArmBody);

		const wheelHubCollider = RAPIER.ColliderDesc.cylinder(0.05, 0.25).setMass(mass).setRotation(zRot).setCollisionGroups(262145);
		world.createCollider(wheelHubCollider, this.wheelHubBody);

		/*const radiusRotCollider = RAPIER.ColliderDesc.cylinder(size.z / 2, 0.05)
			.setCollisionGroups(262145)
			.setMass((mass * size.z) / 2)
			.setRotation(xRot);*/
		//world.createCollider(radiusRotCollider, this.radiusRotBody);
	}

	attachTo(body: RigidBody, pos: Vector3) {
		const armAttachAndLowerArmJointData = JointData.revolute(new Vector3(0, -this.size.y / 2, 0).add(pos), new Vector3(-this.size.x / 2, 0, 0), zAxe);
		this.world.createImpulseJoint(armAttachAndLowerArmJointData, body, this.lowerArmBody, false);

		const armAttachAndUpperArmJointData = JointData.revolute(new Vector3(0, this.size.y / 2, 0).add(pos), new Vector3(-this.size.x / 2, 0, 0), zAxe);
		this.world.createImpulseJoint(armAttachAndUpperArmJointData, body, this.upperArmBody, false);

		const suspAttachAndWheelHubRopeJointData = JointData.rope(this.size.y / 2, new Vector3(this.size.x, 0, 0).add(pos), new Vector3(0, this.size.y / 2, 0));
		const suspAttachAndWheelHubSpringJointData = JointData.spring(
			this.size.y,
			20000,
			1000,
			new Vector3(this.size.x, this.size.y + 0.25, 0).add(pos),
			new Vector3(0, this.size.y / 2, 0)
		);
		this.world.createImpulseJoint(suspAttachAndWheelHubRopeJointData, body, this.wheelHubBody, false);
		this.world.createImpulseJoint(suspAttachAndWheelHubSpringJointData, body, this.wheelHubBody, false);
	}

	update(keyMap: { [key: string]: boolean }) {
		let targetSteer = 0;
		if (keyMap["KeyA"]) {
			targetSteer += 0.6;
		}
		if (keyMap["KeyD"]) {
			targetSteer -= 0.6;
		}
	}
}
