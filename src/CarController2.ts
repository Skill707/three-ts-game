import { Object3D, Vector3 } from "three";
import { RigidBody, ImpulseJoint, World, RigidBodyDesc } from "@dimforge/rapier3d";
import Suspension from "./Suspension";
import Wheel from "./Wheel";
import { getCar } from "./getCar";
import type { KeyMap } from "./types";

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
	carBodyPos: Vector3;
	keyMap: { [key: string]: boolean } = {};

	constructor(world: World, keyMap: KeyMap, position: Vector3 = new Vector3()) {
		this.keyMap = keyMap;

		//const pos = carParts.rootPos.clone().add(carParts.main.model.position);
		const carBody = world.createRigidBody(
			RigidBodyDesc.dynamic()
				.setTranslation(...position.toArray())
				.setCanSleep(false)
		);
		this.carBody = carBody;
		this.carBodyPos = new Vector3().copy(carBody.translation());

		const carParts = getCar();

		world.createCollider(carParts.main.collider, carBody);
		//carParts.main.model.visible = false;
		//this.dynamicBodies.push([carParts.main.model, carBody]);

		// Suspension

		const susp1 = new Suspension(world, new Vector3(1.2, -0.5, -2).add(position), new Vector3(1, 1, 0.5));
		const wheel1 = new Wheel(world, new Vector3(2.5, -0.5, -2).add(position));
		wheel1.attachTo(susp1.wheelHubBody, new Vector3(-0.35, 0, 0));
		susp1.attachTo(carBody, new Vector3(1.2, -0.5, -2));

		const susp2 = new Suspension(world, new Vector3(-1.2, -0.5, -2).add(position), new Vector3(-1, 1, 0.5));
		const wheel2 = new Wheel(world, new Vector3(-2.5, -0.5, -2).add(position));
		wheel2.attachTo(susp2.wheelHubBody, new Vector3(0.35, 0, 0));
		susp2.attachTo(carBody, new Vector3(-1.2, -0.5, -2));

		const susp3 = new Suspension(world, new Vector3(-1.2, -0.5, 2).add(position), new Vector3(-1, 1, 0.5));
		const wheel3 = new Wheel(world, new Vector3(-2.5, -0.5, 2).add(position));
		wheel3.attachTo(susp3.wheelHubBody, new Vector3(0.35, 0, 0));
		susp3.attachTo(carBody, new Vector3(-1.2, -0.5, 2));

		const susp4 = new Suspension(world, new Vector3(1.2, -0.5, 2).add(position), new Vector3(1, 1, 0.5));
		const wheel4 = new Wheel(world, new Vector3(2.5, -0.5, 2).add(position));
		wheel4.attachTo(susp4.wheelHubBody, new Vector3(-0.35, 0, 0));
		susp4.attachTo(carBody, new Vector3(1.2, -0.5, 2));
	}

	update() {
		this.carBodyPos = new Vector3().copy(this.carBody.translation());
		/*
		for (let i = 0, n = this.dynamicBodies.length; i < n; i++) {
			const translation = this.dynamicBodies[i][1].translation();
			const rbPos = new Vector3(translation.x, translation.y, translation.z);
			//rbPos.add(this.carParts.rootPos.clone().negate());
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
		*/
	}
}
