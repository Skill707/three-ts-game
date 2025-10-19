import { Object3D } from "three";
import { RigidBody, ColliderDesc, RigidBodyDesc, Collider } from "@dimforge/rapier3d";
import { Socket } from "socket.io-client";
import type { PlayerState } from "./shared";
import type { EntityTypes } from "./types";

export interface EntityState {
	ID: string;
	position: [number, number, number];
	rotation: [number, number, number, number];
	velocity?: [number, number, number];
}

export abstract class Entity {
	ID: string;
	bodyDesc: RigidBodyDesc;
	colliderDesc: ColliderDesc;
	object: Object3D = new Object3D();
	HP: number = 100;
	body: RigidBody | null = null;
	collider: Collider | null = null;
	socket: Socket | null = null;
	type: EntityTypes;

	constructor(type: EntityTypes) {
		this.type = type;
		this.ID = crypto.randomUUID();

		// физическая часть
		this.bodyDesc = RigidBodyDesc.dynamic().setTranslation(0, 5, 0);
		this.colliderDesc = ColliderDesc.cuboid(1, 1, 1);

		// при наличии сети — подписка на обновления
		if (this.socket) {
			this.socket.on("entity-update", (data: EntityState) => {
				if (data.ID === this.ID) this.applyNetworkState(data);
			});
		}
	}

	public updateFromState(state: PlayerState): void {
		//this.targetPosition.set(state.position.x, state.position.y, state.position.z);
		//this.targetRotation = state.rotation.y;

		// For local player, we might want to apply server corrections
		if (this.body) {
			const currentPos = this.body.translation();
			const distance = Math.sqrt(Math.pow(currentPos.x - state.position.x, 2) + Math.pow(currentPos.z - state.position.z, 2));

			// If we're too far from server position, snap to it (server reconciliation)
			if (distance > 2) {
				this.body.setTranslation(state.position, true);
				console.log("Server correction applied");
			}
		}
	}

	// === обновление из физики ===
	updateFromPhysics() {
		if (!this.body || !this.object) return;
		const t = this.body.translation();
		const r = this.body.rotation();
		this.object.position.set(t.x, t.y, t.z);
		if (this.type !== "player") this.object.quaternion.set(r.x, r.y, r.z, r.w);
	}

	// === синхронизация по сети ===
	sendNetworkState() {
		if (!this.socket || !this.body) return;
		const t = this.body.translation();
		const r = this.body.rotation();
		this.socket.emit("entity-update", {
			ID: this.ID,
			position: [t.x, t.y, t.z],
			rotation: [r.x, r.y, r.z, r.w],
		} as EntityState);
	}

	applyNetworkState(_state: EntityState) {
		/*this.position.fromArray(state.position);
		this.quaternion.fromArray(state.rotation);
		this.body.setTranslation(this.position, false);
		this.body.setRotation(this.quaternion, false);*/
	}

	update(delta: number) {
		console.log("Entity class update", delta);
	}
}
