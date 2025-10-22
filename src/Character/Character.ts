import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import { ActiveEvents, ColliderDesc, RigidBodyDesc } from "@dimforge/rapier3d";
import { Entity } from "../Entity";
import type Keyboard from "../Keyboard";
import AnimationController from "./AnimationController";
import Eve from "./Eve";
import type { EntityTypes } from "../shared";

const euler = new Euler();
const quaternion = new Quaternion();

export default abstract class Character extends Entity {
	private animationController: AnimationController;
	readonly inputVelocity = new Vector3();
	private grounded = true;
	public followCamYaw: number = 0;
	private keyboard: Keyboard | null = null;
	private wait = false;
	readonly object: Eve;

	constructor(type: EntityTypes, position: Vector3 = new Vector3(), keyboard?: Keyboard) {
		super(type, false);

		this.keyboard = keyboard || null;

		this.bodyDesc = RigidBodyDesc.dynamic()
			.setTranslation(...position.toArray())
			.enabledRotations(false, false, false)
			.setLinearDamping(4);

		//this.body.setEnabledRotations(false, false, false, true);

		this.colliderDesc = ColliderDesc.capsule(0.5, 0.15)
			.setTranslation(0, 0.645, 0)
			.setMass(1)
			.setFriction(0)
			.setActiveEvents(ActiveEvents.COLLISION_EVENTS);

		this.object = new Eve();
		this.animationController = new AnimationController(this.object.animationActions, this.keyboard);
	}

	setGrounded() {
		if (!this.body) return;
		this.body.setLinearDamping(4);
		this.body.setEnabledRotations(false, false, false, true);
		this.body.setRotation(new Quaternion(), true);
		this.grounded = true;
		setTimeout(() => (this.wait = false), 250);
	}

	updateControls(delta: number) {
		if (this.keyboard) {
			this.inputVelocity.set(0, 0, 0);

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
				this.inputVelocity.setLength(delta * this.animationController.speed || 1); // limit horizontal movement based on walking or running speed

				if (!this.wait && this.keyboard.keyMap["Space"]) {
					this.wait = true;
					if (this.body) this.body.setLinearDamping(0);
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
			euler.y = this.followCamYaw; //this.followCam.yaw.rotation.y;
			quaternion.setFromEuler(euler);
			this.inputVelocity.applyQuaternion(quaternion);
		}

		if (this.body) {
			// now move the capsule body based on inputVelocity
			this.body.applyImpulse(this.inputVelocity, true);
			// Получаем линейную скорость
			const linVel = new Vector3(this.body.linvel().x, this.body.linvel().y, this.body.linvel().z);
			if (linVel.length() > 0.0001) {
				// Нормализуем направление скорости
				const dir = new Vector3(linVel.x, 0, linVel.z).normalize().negate(); // negate

				// Определяем целевую позицию на основании направления
				const targetPos = new Vector3().copy(this.object.position).add(dir);

				// Строим матрицу вращения и кватернион
				const rotationMatrix = new Matrix4();
				rotationMatrix.lookAt(this.object.position, targetPos, this.object.up);

				const targetQuaternion = new Quaternion().setFromRotationMatrix(rotationMatrix);

				// Обнуляем наклон по X и Z, чтобы вращение было только по Y
				targetQuaternion.x = 0;
				targetQuaternion.z = 0;
				targetQuaternion.normalize();

				// Плавно поворачиваем объект к целевому кватерниону
				this.object.quaternion.rotateTowards(targetQuaternion, delta * 20);
			}
		}

		// update which animationAction Eve should be playing
		const speed = this.body ? new Vector3(this.body.linvel().x, this.body.linvel().y, this.body.linvel().z).length() : 0;
		this.animationController.update(speed);

		// update the Eve models animation mixer
		this.object.update(delta);
	}
}
