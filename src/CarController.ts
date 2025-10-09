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
			RigidBodyDesc.fixed()
				.setTranslation(...pos.toArray())
				.setCanSleep(false)
		);
		this.carBody = carBody;
		world.createCollider(carParts.main.collider, carBody);
		this.dynamicBodies.push([carParts.main.model, carBody]);
		const vehicleController = world.createVehicleController(carBody);
		
		console.log(vehicleController);
		//world.createPidController()

		carParts.wheels.forEach((wheel) => {
			const pos = carParts.rootPos.clone().add(wheel.model.position);
			const anchor1 = wheel.model.position.clone().sub(carParts.main.model.position);
			const anchor2 = new Vector3(0, 0, 0);

			const axeBody = world.createRigidBody(
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

			const axeCollider = RAPIER.ColliderDesc.ball(0.1).setRestitution(0).setFriction(2).setMass(30).setCollisionGroups(262145);
			const springCollider = RAPIER.ColliderDesc.cylinder(0.25, 0.05).setRestitution(0).setFriction(2).setMass(30).setCollisionGroups(262145);

			const axeRevolute = JointData.revolute(anchor1, anchor2, new Vector3(0, 1, 0));
			const axeJoint = world.createImpulseJoint(axeRevolute, carBody, axeBody, true);
			(axeJoint as PrismaticImpulseJoint).configureMotorModel(MotorModel.ForceBased);

			const spring = JointData.prismatic(new Vector3(), anchor2, new Vector3(0, 1, 0));
			const springJoint = world.createImpulseJoint(spring, axeBody, suspBody, true);

			const revolute = JointData.revolute(new Vector3(0, 0, 0), anchor2, new Vector3(1, 0, 0));
			const motorJoint = world.createImpulseJoint(revolute, suspBody, wheelBody, true);

			world.createCollider(axeCollider, axeBody);
			world.createCollider(springCollider, suspBody);
			world.createCollider(wheel.collider, wheelBody);

			this.dynamicBodies.push([wheel.model, wheelBody]);
			this.wheelAxels.push(axeJoint);
			this.wheelSprings.push(springJoint);
			this.wheelMotors.push(motorJoint);
		});

		document.addEventListener("keydown", this.handleKeyboardEvent);
		document.addEventListener("keyup", this.handleKeyboardEvent);
	}

	private handleKeyboardEvent = (e: KeyboardEvent) => {
		this.keyMap[e.code] = e.type === "keydown";
	};

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

		this.wheelAxels.forEach((axel) => {
			(axel as PrismaticImpulseJoint).configureMotorPosition(targetSteer, 10000, 1000);
		});

		let targetVelocity = 0;
		if (this.keyMap["KeyW"]) {
			targetVelocity = -500;
		}
		if (this.keyMap["KeyS"]) {
			targetVelocity = 200;
		}
		this.wheelMotors.forEach((motor) => {
			(motor as PrismaticImpulseJoint).configureMotorVelocity(targetVelocity, 2.0);
		});
	}
}
