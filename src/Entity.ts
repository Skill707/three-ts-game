import { Object3D, Quaternion, Vector3, type QuaternionTuple, type Vector3Tuple } from "three";
import { RigidBody, ColliderDesc, RigidBodyDesc, Collider } from "@dimforge/rapier3d";
import { Socket } from "socket.io-client";
import { EntityState, type EntityTypes, type PlayerState } from "./shared";

export abstract class Entity {
	ID: string;
	name: string = "Entity";
	bodyDesc: RigidBodyDesc;
	colliderDesc: ColliderDesc;
	object: Object3D = new Object3D();
	HP: number = 100;
	body: RigidBody | null = null;
	collider: Collider | null = null;
	type: EntityTypes;
	bodyRotationEnabled: boolean;
	networkPosition: Vector3 = new Vector3();
	networkRotation: Quaternion = new Quaternion();

	constructor(type: EntityTypes, bodyRotationEnabled: boolean) {
		this.type = type;
		this.ID = "none";
		this.bodyDesc = RigidBodyDesc.dynamic().setTranslation(0, 5, 0);
		this.colliderDesc = ColliderDesc.cuboid(1, 1, 1);
		this.bodyRotationEnabled = bodyRotationEnabled;
	}

	public updateFromState(state: EntityState): void {
		this.networkPosition = new Vector3().fromArray(state.position);
		this.networkRotation = new Quaternion().fromArray(state.rotation);
	}

	public updateBodyFromNetwork(): void {
		if (this.body) {
			const posDelta = this.networkPosition.clone().sub(this.body.translation());
			if (posDelta.length() > 0.1) {
				this.body.applyImpulse(posDelta.multiplyScalar(0.1), true);
			}

			if (this.bodyRotationEnabled) {
				const bodyQuaternion = new Quaternion(this.body.rotation().x, this.body.rotation().y, this.body.rotation().z, this.body.rotation().w);
				const rotDelta = this.networkRotation.clone().invert().multiply(bodyQuaternion);
				const vector = new Vector3(rotDelta.x, rotDelta.y, rotDelta.z);
				this.body.addTorque(vector, true);
			} else {
				this.object.quaternion.slerp(this.networkRotation, 0.1);
			}
		}
	}

	// === обновление из физики ===
	updateFromPhysics() {
		if (!this.body || !this.object) return;
		const t = this.body.translation();
		const r = this.body.rotation();
		this.object.position.set(t.x, t.y, t.z);
		if (this.bodyRotationEnabled) this.object.quaternion.set(r.x, r.y, r.z, r.w);
	}

	// === синхронизация по сети ===
	sendNetworkState(socket: Socket) {
		if (!socket || !this.body || !this.object) return;
		const t = this.body.translation();
		let r: any;
		if (this.bodyRotationEnabled) r = this.body.rotation();
		else r = this.object.quaternion;

		socket.emit("entity-update", {
			position: [t.x, t.y, t.z],
			rotation: [r.x, r.y, r.z, r.w],
		} as {
			position: Vector3Tuple;
			rotation: QuaternionTuple;
		});
	}
}
