import * as THREE from "three";
import { PlayerState } from "../types/GameTypes";
import { Collider, ColliderDesc, RigidBody, RigidBodyDesc, World } from "@dimforge/rapier3d";

export class Player {
	private id: string;
	private scene: THREE.Scene;
	private world: World;
	private isLocal: boolean;

	private mesh: THREE.Mesh;
	private rigidBody: RigidBody;
	private collider: Collider;

	private targetPosition = new THREE.Vector3();
	private targetRotation = 0;

	constructor(id: string, scene: THREE.Scene, world: World, isLocal: boolean = false) {
		this.id = id;
		this.scene = scene;
		this.world = world;
		this.isLocal = isLocal;

		// createVisuals();

		// Create a box geometry for the player
		const geometry = new THREE.BoxGeometry(1, 2, 1);
		const material = new THREE.MeshLambertMaterial({
			color: this.isLocal ? 0x00ff00 : 0xff0000, // Green for local player, red for others
		});

		this.mesh = new THREE.Mesh(geometry, material);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;
		this.scene.add(this.mesh);

		// Add a simple name tag
		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d")!;
		canvas.width = 256;
		canvas.height = 64;
		context.fillStyle = "rgba(0, 0, 0, 0.8)";
		context.fillRect(0, 0, 256, 64);
		context.fillStyle = "white";
		context.font = "24px Arial";
		context.textAlign = "center";
		context.fillText(this.isLocal ? "You" : `Player ${this.id.slice(-4)}`, 128, 40);

		const texture = new THREE.CanvasTexture(canvas);
		const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
		const sprite = new THREE.Sprite(spriteMaterial);
		sprite.position.set(0, 1.5, 0);
		sprite.scale.set(2, 0.5, 1);
		this.mesh.add(sprite);

		// createPhysics();

		// Create physics body
		const bodyDesc = RigidBodyDesc.dynamic();
		bodyDesc.setTranslation(0, 5, 0); // Start above ground
		this.rigidBody = this.world.createRigidBody(bodyDesc);

		// Create collider
		const colliderDesc = ColliderDesc.cuboid(0.5, 1, 0.5);
		colliderDesc.setFriction(0.8);
		colliderDesc.setRestitution(0.1);
		this.collider = this.world.createCollider(colliderDesc, this.rigidBody);

		// Lock rotation to prevent tipping over
		this.rigidBody.lockRotations(true, false);
	}

	public update(deltaTime: number): void {
		// For remote players, smoothly interpolate to target position
		if (this.mesh && this.rigidBody) {
			if (!this.isLocal) {
				const currentPos = this.mesh.position;
				currentPos.lerp(this.targetPosition, deltaTime * 10);

				// Update physics body to match visual position for remote players
				this.rigidBody.setTranslation(currentPos, true);
			} else {
				// For local player, sync visual with physics
				const position = this.rigidBody.translation();
				this.mesh.position.set(position.x, position.y, position.z);
			}
			// Handle rotation
			const currentRotation = this.mesh.rotation.y;
			const rotationDiff = this.targetRotation - currentRotation;
			if (Math.abs(rotationDiff) > 0.01) {
				this.mesh.rotation.y += rotationDiff * deltaTime * 5;
			}
		}
	}

	public updateFromState(state: PlayerState): void {
		this.targetPosition.set(state.position.x, state.position.y, state.position.z);
		this.targetRotation = state.rotation.y;

		// For local player, we might want to apply server corrections
		if (this.isLocal) {
			const currentPos = this.rigidBody.translation();
			const distance = Math.sqrt(Math.pow(currentPos.x - state.position.x, 2) + Math.pow(currentPos.z - state.position.z, 2));

			// If we're too far from server position, snap to it (server reconciliation)
			if (distance > 2) {
				this.rigidBody.setTranslation(state.position, true);
				console.log("Server correction applied");
			}
		}
	}

	public applyMovement(forward: number, right: number, jump: boolean): void {
		if (!this.isLocal) return;

		const velocity = this.rigidBody.linvel();
		const newVelocity = new THREE.Vector3(
			right * 5, // Side movement
			jump && Math.abs(velocity.y) < 0.1 ? 8 : velocity.y, // Jump only if on ground
			-forward * 5 // Forward/backward movement
		);

		this.rigidBody.setLinvel(newVelocity, true);

		// Update rotation based on movement
		if (Math.abs(forward) > 0.1 || Math.abs(right) > 0.1) {
			this.targetRotation = Math.atan2(right, -forward);
		}
	}

	public getPosition(): THREE.Vector3 {
		return this.mesh.position.clone();
	}

	public getState(): PlayerState {
		const position = this.rigidBody.translation();
		const rotation = { x: 0, y: this.mesh.rotation.y, z: 0 };

		return {
			id: this.id,
			position: { x: position.x, y: position.y, z: position.z },
			rotation: rotation,
		};
	}

	public getId(): string {
		return this.id;
	}

	public destroy(): void {
		this.scene.remove(this.mesh);
		this.world.removeCollider(this.collider, true);
		this.world.removeRigidBody(this.rigidBody);
	}
}
