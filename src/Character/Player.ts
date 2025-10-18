import { Euler, Matrix4, Object3D, PerspectiveCamera, Quaternion, Vector3, WebGLRenderer, type Scene } from "three";
import Keyboard from "../Keyboard";
import AnimationController from "./AnimationController";
import FollowCam from "./FollowCam";
import { ActiveEvents,  ColliderDesc,  RigidBodyDesc, type RigidBody } from "@dimforge/rapier3d";
import type CarController from "../Vehicle/CarController";
import { world } from "../main";

export default class Player {
	private scene: Scene;
	private body: RigidBody;
	private animationController?: AnimationController;
	private vector = new Vector3();
	private inputVelocity = new Vector3();
	private euler = new Euler();
	private quaternion = new Quaternion();
	private followTarget = new Object3D(); //new Mesh(new SphereGeometry(0.1), new MeshNormalMaterial())
	private grounded = true;
	private rotationMatrix = new Matrix4();
	private targetQuaternion = new Quaternion();
	private followCam: FollowCam;
	private keyboard: Keyboard;
	private wait = false;
	private drivingCar: CarController | null = null;
	//private collider: Collider;
	protected colliderDesc: ColliderDesc;
	//private cars: CarController[];
	//private seatJoint?: ImpulseJoint | null;
	/*private test: Part | null = null;
	private testJoint?: ImpulseJoint | null = null;*/

	constructor(scene: Scene, camera: PerspectiveCamera, renderer: WebGLRenderer, position: Vector3 = new Vector3()) {
		this.scene = scene;
		this.keyboard = new Keyboard(renderer);
		this.followCam = new FollowCam(this.scene, camera, renderer);

		this.followTarget.name = "followTarget";
		scene.add(this.followTarget); // the followCam will lerp towards this object3Ds world position.

		this.body = world.createRigidBody(
			RigidBodyDesc.dynamic()
				.setTranslation(...position.toArray())
				//.enabledRotations(false, false, false)
				.setLinearDamping(4)
				.setCanSleep(false)
		);
		this.body.setEnabledRotations(false, false, false, true);

		this.colliderDesc = ColliderDesc.capsule(0.5, 0.15)
			.setTranslation(0, 0.645, 0)
			.setMass(1)
			.setFriction(0)
			.setActiveEvents(ActiveEvents.COLLISION_EVENTS);

		//this.collider = world.createCollider(this.colliderDesc, this.body);

		/*this.test = new Part("block");
		this.test.position.set(0, 2, 0);
		this.test.addPhysics();*/
	}

	async init() {
		this.animationController = new AnimationController(this.scene, this.keyboard);
		await this.animationController.init();
	}

	setGrounded() {
		console.log("grounded");

		this.body.setLinearDamping(4);
		//this.body.setEnabledRotations(false, false, false, true);
		this.body.setRotation(new Quaternion(), true);

		this.grounded = true;
		setTimeout(() => (this.wait = false), 250);
	}

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

	update(delta: number) {
		this.inputVelocity.set(0, 0, 0);

		/*if (!this.wait && this.keyboard.keyMap["KeyF"]) {
			if (this.drivingCar) {
				this.getOutOfCar();
			} else {
				this.getInCar();
			}
		}*/



		/*if (!this.wait && this.keyboard.keyMap["KeyF"]) {
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
		}*/

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
		} else {
			if (this.grounded) {
				if (this.keyboard.keyMap["KeyW"]) {
					this.inputVelocity.z = -1;
				}
				if (this.keyboard.keyMap["KeyS"]) {
					this.inputVelocity.z = 1;
				}
				if (this.keyboard.keyMap["KeyA"]) {
					this.inputVelocity.x = -1;
				}
				if (this.keyboard.keyMap["KeyD"]) {
					this.inputVelocity.x = 1;
				}

				this.inputVelocity.setLength(delta * (this.animationController?.speed || 1)); // limit horizontal movement based on walking or running speed

				if (!this.wait && this.keyboard.keyMap["Space"]) {
					this.wait = true;
					this.body.setLinearDamping(0);
					if (this.keyboard.keyMap["ShiftLeft"]) {
						this.inputVelocity.multiplyScalar(15); // if running, add more boost
					} else {
						this.inputVelocity.multiplyScalar(10);
					}
					this.inputVelocity.y = 5; //give jumping some height
					this.grounded = false;
				}
			}

			// apply the followCam yaw to inputVelocity so the capsule moves forward based on cameras forward direction
			this.euler.y = this.followCam.yaw.rotation.y;
			this.quaternion.setFromEuler(this.euler);
			this.inputVelocity.applyQuaternion(this.quaternion);

			// now move the capsule body based on inputVelocity
			this.body.applyImpulse(this.inputVelocity, true);

			// The followCam will lerp towards the followTarget position.
			this.followTarget.position.copy(this.body.translation()); // Copy the capsules position to followTarget
			this.followTarget.getWorldPosition(this.vector); // Put followTargets new world position into a vector
			this.followCam.pivot.position.lerp(this.vector, delta * 10); // lerp the followCam pivot towards the vector
			this.followCam.yaw.position.lerp(this.followCam.cameraOffset.clone().applyQuaternion(this.followCam.yaw.quaternion), delta * 10); // just update

			// Eve model also lerps towards the capsules position, but independently of the followCam
			this.animationController?.model?.position.lerp(this.vector, delta * 20);

			// Also turn Eve to face the direction of travel.
			// First, construct a rotation matrix based on the direction from the followTarget to Eve
			this.rotationMatrix.lookAt(
				this.followTarget.position,
				this.animationController?.model?.position as Vector3,
				this.animationController?.model?.up as Vector3
			);
			this.targetQuaternion.setFromRotationMatrix(this.rotationMatrix); // creating a quaternion to rotate Eve, since eulers can suffer from gimbal lock

			// Next, get the distance from the Eve model to the followTarget
			const distance = this.animationController?.model?.position.distanceTo(this.followTarget.position);

			// If distance is higher than some espilon, and Eves quaternion isn't the same as the targetQuaternion, then rotate towards the targetQuaternion.
			if ((distance as number) > 0.0001 && !this.animationController?.model?.quaternion.equals(this.targetQuaternion)) {
				this.targetQuaternion.z = 0; // so that it rotates around the Y axis
				this.targetQuaternion.x = 0; // so that it rotates around the Y axis
				this.targetQuaternion.normalize(); // always normalise quaternions before use.
				this.animationController?.model?.quaternion.rotateTowards(this.targetQuaternion, delta * 20);
			}

			// update which animationAction Eve should be playing
			this.animationController?.update(delta);
		}
	}
}
