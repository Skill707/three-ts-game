import { Group, Mesh, Quaternion, Scene, Vector2, Vector3 } from "three";
import { RigidBody, World, RigidBodyDesc, ColliderDesc } from "@dimforge/rapier3d";
import Wheel from "./Wheel";
import Suspension from "./Suspension";
import type { Part } from "../types";
import { getCar } from "./getCar";
import Keyboard from "../Keyboard";
import Engine from "./Engine";
import Steer from "./Steer";
import Transmission from "./Transmission";

export default class CarController {
	private dynamicBodies: [Part, RigidBody][] = [];
	public body: RigidBody;
	public carBodyPos: Vector3;
	private wheels: Wheel[] = [];
	private suspensions: Suspension[] = [];
	public driverSeatPos: Vector3 = new Vector3(0.3, 0.4, 0);
	private engine: Engine = new Engine();
	private transmission: Transmission = new Transmission();
	private steer: Steer = new Steer();

	/*
		if (!this.wait && this.keyboard.keyMap["KeyF"]) {
			if (this.drivingCar) {
				this.getOutOfCar();
			} else {
				this.getInCar();
			}
		}
		if (!this.wait && this.keyboard.keyMap["KeyF"]) {
			this.wait = true;
			if (!this.testJoint && this.test && this.test.body) {
				const anchor1 = new Vector3(0, 0, 0);
				const anchor2 = new Vector3(0, 0.25, 0);
				this.testJoint = fixedJoint(this.body, this.test.body, anchor1, anchor2);
			} else {
				world.removeImpulseJoint(this.testJoint as ImpulseJoint, true);
				this.testJoint = null;
			}
			setTimeout(() => (this.wait = false), 500);
		}

		if (this.drivingCar) {
			this.drivingCar.drive(this.keyboard);
			if (this.animationController) {
				this.animationController.setAction(this.animationController.animationActions["drive"]);

				this.followTarget.position.copy(this.body.translation());
				this.followTarget.getWorldPosition(this.vector);
				this.followCam.pivot.position.lerp(this.vector, delta * 10);

				this.animationController.model?.position.lerp(this.vector, delta * 20);

				this.animationController?.model?.quaternion.copy(this.body.rotation());

				this.animationController.update(delta);
			}
		} */

				/*private getCar() {
		for (let index = 0; index < this.cars.length; index++) {
			const car = this.cars[index];
			if (car.carBodyPos.distanceTo(this.body.translation()) < 2.5) {
				return car;
			}
		}
	}

	private getInCar() {
		console.log("get in car");
		const car = this.getCar();
		if (!car) return;
		this.drivingCar = car;
		this.wait = true;

		this.collider?.setEnabled(false);
		const jointData = JointData.fixed(car.driverSeatPos, new Quaternion(), new Vector3(), new Quaternion());
		this.seatJoint = this.world.createImpulseJoint(jointData, this.body, car.body, false);
		this.seatJoint.setContactsEnabled(false);

		this.body.setLinearDamping(0);
		this.body.setEnabledRotations(true, true, true, false);

		setTimeout(() => (this.wait = false), 500);
	}

	private getOutOfCar() {
		console.log("get out car");
		this.drivingCar?.setBrake();
		this.drivingCar = null;
		this.grounded = false;
		this.wait = true;
		this.world.removeImpulseJoint(this.seatJoint as ImpulseJoint, true);
		this.collider?.setEnabled(true);

		this.body.setLinearDamping(4);
		this.body.setEnabledRotations(false, false, false, true);
		this.body.setRotation(new Quaternion(), true);

		setTimeout(() => (this.wait = false), 500);
	}*/

	constructor(scene: Scene, world: World, name: string, position: Vector3 = new Vector3()) {
		//const pos = carParts.rootPos.clone().add(carParts.main.model.position);
		const body = world.createRigidBody(
			RigidBodyDesc.dynamic()
				.setTranslation(...position.toArray())
				.setCanSleep(false)
		);
		this.body = body;
		this.carBodyPos = new Vector3().copy(body.translation());

		const objectGroup = new Group();
		objectGroup.name = "Car" + name;
		scene.add(objectGroup);

		const carParts = getCar(name);

		objectGroup.add(carParts.main.model);
		//carParts.main.model.visible = false;

		const bodyMesh = carParts.main.model.children.find((o) => o.name === "body") as Mesh;
		const geometry = bodyMesh.geometry;

		//const collider = geometry.index ? ColliderDesc.trimesh(geometry.attributes.position.array as Float32Array, geometry.index.array as Uint32Array) : null
		const collider = ColliderDesc.convexHull(geometry.attributes.position.array as Float32Array);
		if (collider) {
			collider.setCollisionGroups(131073).setMass(1000);
			collider.setRotation(carParts.main.rotation.clone());
			world.createCollider(collider, body);
		} else {
			geometry.computeBoundingBox();
			const box = geometry.boundingBox;
			if (box) {
				const size = new Vector3(box.max.x, box.max.y, box.max.z);
				size.applyQuaternion(carParts.main.rotation);
				const collider = ColliderDesc.cuboid(size.x, size.y, size.z).setCollisionGroups(131073).setMass(1000);
				world.createCollider(collider, body);
			}
		}

		this.dynamicBodies.push([carParts.main, body]);

		// chasis
		carParts.wheels.forEach((wheelPart) => {
			// wheel
			objectGroup.add(wheelPart.model);
			const bodyMesh = wheelPart.model.children.find((o) => o.name.includes("wheel")) as Mesh;
			const geometry = bodyMesh.geometry;
			geometry.computeBoundingBox();
			const box = geometry.boundingBox;
			const wheelPos = wheelPart.position.clone().add(position).sub(carParts.main.position);
			let wheelSize = new Vector2(0.15, 0.36);
			if (box) wheelSize = new Vector2(box.max.x, box.max.y);

			const wheel = new Wheel(world, wheelPos, wheelSize, 30);
			this.wheels.push(wheel);
			this.dynamicBodies.push([wheelPart, wheel.wheelBody]);

			// Suspension
			const side = wheelPos.x > 0 ? 1 : -1;
			const size = new Vector3(0, 0.3, 0.25).setX(0.3 * side);
			const wheelWidth = (wheelSize.x + 0.02) * side;
			const suspPos = wheelPos.clone().sub(new Vector3().setX(size.x + wheelWidth));
			const susp = new Suspension(world, suspPos, size, 30, wheelPart.maxAngle);
			this.suspensions.push(susp);

			// attachment

			const offset = new Vector3(-wheelWidth, 0, 0);
			wheel.attachTo(susp.wheelHubBody, offset);
			const pos = wheelPart.position.clone().sub(carParts.main.position);
			pos.sub(new Vector3().setX(size.x + wheelWidth));
			susp.attachTo(body, pos);
		});
	}

	drive(keyboard: Keyboard) {
		this.engine.drive(keyboard);
		this.steer.drive(keyboard);
		this.transmission.drive(keyboard);
	}

	setBrake() {
		this.wheels.forEach((wheel) => wheel.update(0, 0));
	}

	update(delta: number) {
		this.engine.update(delta);
		this.steer.update(delta);
		this.transmission.inputRPM = this.engine.outputRPM;
		this.transmission.update();
		this.wheels.forEach((wheel) => wheel.update(this.transmission.outputRPM, delta));
		this.suspensions.forEach((suspension) => suspension.update(this.steer.input, delta));

		this.carBodyPos = new Vector3().copy(this.body.translation());
		for (let i = 0, n = this.dynamicBodies.length; i < n; i++) {
			const translation = this.dynamicBodies[i][1].translation();
			const rbPos = new Vector3(translation.x, translation.y, translation.z);
			this.dynamicBodies[i][0].model.position.copy(rbPos);

			const rotation = this.dynamicBodies[i][1].rotation();
			const rbQuat = new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
			rbQuat.multiply(this.dynamicBodies[i][0].rotation.clone());
			this.dynamicBodies[i][0].model.quaternion.copy(rbQuat);
		}
	}
}
