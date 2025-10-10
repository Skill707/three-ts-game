import { Object3D, Quaternion, Vector3 } from "three";
import RAPIER, { RigidBody, ImpulseJoint, World, RigidBodyDesc, ColliderDesc, JointData, PrismaticImpulseJoint, MotorModel } from "@dimforge/rapier3d";

interface Part {
	model: Object3D;
	collider: ColliderDesc;
}

interface CarParts {
	rootPos: Vector3;
	main: Part;
	wheels: Part[];
}

//floor = 0
//car = 1
//steer = 2
//susp = 3
//wheel = 4

export default class CarController {
	dynamicBodies: [Object3D, RigidBody][] = [];
	carBody: RigidBody;
	wheelAxels: ImpulseJoint[] = [];
	wheelSprings: ImpulseJoint[] = [];
	wheelMotors: ImpulseJoint[] = [];
	carParts: CarParts;
	keyMap: { [key: string]: boolean } = {};

	constructor(world: World, carParts: CarParts) {
		this.carParts = carParts;

		const pos = carParts.rootPos.clone().add(carParts.main.model.position);
		const carBody = world.createRigidBody(
			RigidBodyDesc.dynamic()
				.setTranslation(...pos.toArray())
				.setCanSleep(false)
		);
		this.carBody = carBody;
		world.createCollider(carParts.main.collider, carBody);
		carParts.main.model.visible = false;
		this.dynamicBodies.push([carParts.main.model, carBody]);

		const up = new Vector3(0, 1, 0);
		const right = new Vector3(1, 0, 0);
		const anchor2 = new Vector3(0, 0, 0);

		carParts.wheels.forEach((wheel) => {
			const pos = carParts.rootPos.clone().add(wheel.model.position);
			const anchor1 = wheel.model.position.clone().sub(carParts.main.model.position);

			wheel.model.visible = true;

			// bodies
			const steerBody = world.createRigidBody(
				RigidBodyDesc.dynamic()
					.setTranslation(...pos.toArray())
					.setCanSleep(false)
			);

			const suspBody = world.createRigidBody(
				RigidBodyDesc.dynamic()
					.setTranslation(...pos.toArray())
					.setCanSleep(false)
			);

			const wheelBody = world.createRigidBody(
				RigidBodyDesc.dynamic()
					.setTranslation(...pos.toArray())
					.setCanSleep(false)
			);
			const vel = new Vector3(10, 0, 0);
			wheelBody.setLinvel(vel, true);

			// colliders
			const steerCollider = RAPIER.ColliderDesc.ball(0.1).setRestitution(0).setFriction(2).setMass(30).setCollisionGroups(262145);
			const suspCollider = RAPIER.ColliderDesc.cylinder(0.05, 0.05).setRestitution(0).setFriction(2).setMass(30).setCollisionGroups(262145);

			// joints
			const steerRevolute = JointData.revolute(anchor1, anchor2, up);
			const steerJoint = world.createImpulseJoint(steerRevolute, carBody, steerBody, true);
			(steerJoint as PrismaticImpulseJoint).configureMotorModel(MotorModel.ForceBased);

			const axesMask =
				RAPIER.JointAxesMask.LinX | RAPIER.JointAxesMask.LinY | RAPIER.JointAxesMask.AngX | RAPIER.JointAxesMask.AngY | RAPIER.JointAxesMask.AngZ;
			world.createImpulseJoint(JointData.generic(anchor2, anchor2, right, axesMask), steerBody, suspBody, true).setContactsEnabled(false);

			//const params = JointData.fixed(anchor1, new Quaternion(), anchor2, new Quaternion())
			//const joint = world.createImpulseJoint(params, carBody, suspBody, true);
			//joint.setContactsEnabled(false)

			//const rope = JointData.rope(0.5, anchor1, anchor2);
			//world.createImpulseJoint(rope, carBody, suspBody, true);

			const spring = JointData.spring(0.5, 100000, 1, anchor2, anchor2);
			world.createImpulseJoint(spring, steerBody, suspBody, true);

			const revolute = JointData.revolute(anchor2, anchor2, new Vector3(1, 0, 0));
			const motorJoint = world.createImpulseJoint(revolute, suspBody, wheelBody, true);
			//const axesMask2 = RAPIER.JointAxesMask.LinX
			//world.createImpulseJoint(JointData.generic(anchor2, anchor2, right, axesMask2), suspBody, wheelBody, true);

			world.createCollider(steerCollider, steerBody);
			world.createCollider(suspCollider, suspBody);
			world.createCollider(wheel.collider, wheelBody);

			this.dynamicBodies.push([wheel.model, wheelBody]);
			this.wheelAxels.push(steerJoint);
			this.wheelMotors.push(motorJoint);
		});

		console.log(world.impulseJoints);
	}

	update() {
		for (let i = 0, n = this.dynamicBodies.length; i < n; i++) {
			const translation = this.dynamicBodies[i][1].translation();
			const rbPos = new Vector3(translation.x, translation.y, translation.z);
			rbPos.add(this.carParts.rootPos.clone().negate());
			this.dynamicBodies[i][0].position.copy(rbPos);

			const rotation = this.dynamicBodies[i][1].rotation();
			const rapierQuat = new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
			const newQuaternion = rapierQuat.clone();
			if (i === 0) {
				const fixX = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2);
				const fixY = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2);
				newQuaternion.multiply(fixY);
				newQuaternion.multiply(fixX);
			}
			this.dynamicBodies[i][0].quaternion.copy(newQuaternion);
		}

		let targetSteer = 0;
		if (this.keyMap["KeyA"]) {
			targetSteer += 0.6;
		}
		if (this.keyMap["KeyD"]) {
			targetSteer -= 0.6;
		}

		this.wheelAxels.forEach((axel, index) => {
			if (index > 1) (axel as PrismaticImpulseJoint).configureMotorPosition(targetSteer, 10000, 100);
			else (axel as PrismaticImpulseJoint).configureMotorPosition(0, 10000, 100);
		});

		let targetVelocity = 0;
		if (this.keyMap["KeyW"]) {
			targetVelocity = -5000;
		}
		if (this.keyMap["KeyS"]) {
			targetVelocity = 2000;
		}
		this.wheelMotors.forEach((motor) => {
			(motor as PrismaticImpulseJoint).configureMotorVelocity(targetVelocity, 2.0);
		});
	}
}
