import { Object3D, Mesh, BoxGeometry, MeshStandardMaterial, Vector3 } from "three";
import { RigidBody, ColliderDesc, RigidBodyDesc, World } from "@dimforge/rapier3d";
import { Socket } from "socket.io-client";

export interface EntityState {
	ID: string;
	position: [number, number, number];
	rotation: [number, number, number, number];
	velocity?: [number, number, number];
}

export class EntityObject extends Object3D {
	ID: string;
	body: RigidBody;
	socket: Socket | null = null;
	world: World;
	HP: number = 100;

	constructor(world: World, socket: Socket | null, id?: string, size = new Vector3(1, 1, 1)) {
		super();
		this.ID = id ?? crypto.randomUUID();
		this.world = world;
		this.socket = socket;

		// физическая часть
		this.body = this.world.createRigidBody(RigidBodyDesc.dynamic().setTranslation(0, 5, 0));
		const colliderDesc = ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2);
		this.world.createCollider(colliderDesc, this.body);

		// при наличии сети — подписка на обновления
		if (this.socket) {
			this.socket.on("entity-update", (data: EntityState) => {
				if (data.ID === this.ID) this.applyNetworkState(data);
			});
		}
	}

	// === обновление из физики ===
	updateFromPhysics() {
		const t = this.body.translation();
		const r = this.body.rotation();
		this.position.set(t.x, t.y, t.z);
		this.quaternion.set(r.x, r.y, r.z, r.w);
	}

	// === синхронизация по сети ===
	sendNetworkState() {
		if (!this.socket) return;
		const t = this.body.translation();
		const r = this.body.rotation();
		this.socket.emit("entity-update", {
			ID: this.ID,
			position: [t.x, t.y, t.z],
			rotation: [r.x, r.y, r.z, r.w],
		} as EntityState);
	}

	applyNetworkState(state: EntityState) {
		this.position.fromArray(state.position);
		this.quaternion.fromArray(state.rotation);
		this.body.setTranslation(this.position, false);
		this.body.setRotation(this.quaternion, false);
	}
}

export class EntityMesh extends Mesh {
	ID: string;
	body: RigidBody;
	socket: Socket | null = null;
	world: World;
	HP: number = 100;
	geometry: BoxGeometry;
	material: MeshStandardMaterial;

	constructor(world: World, socket: Socket | null, id?: string, size = new Vector3(1, 1, 1)) {
		super();
		this.ID = id ?? crypto.randomUUID();
		this.world = world;
		this.socket = socket;

		// визуальная часть
		this.geometry = new BoxGeometry(...size.toArray());
		this.material = new MeshStandardMaterial({ color: 0x2288ff });
		const mesh = new Mesh(this.geometry, this.material);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		this.add(mesh);

		// физическая часть
		this.body = this.world.createRigidBody(RigidBodyDesc.dynamic().setTranslation(0, 5, 0));
		const colliderDesc = ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2);
		this.world.createCollider(colliderDesc, this.body);

		// при наличии сети — подписка на обновления
		if (this.socket) {
			this.socket.on("entity-update", (data: EntityState) => {
				if (data.ID === this.ID) this.applyNetworkState(data);
			});
		}
	}

	// === обновление из физики ===
	updateFromPhysics() {
		const t = this.body.translation();
		const r = this.body.rotation();
		this.position.set(t.x, t.y, t.z);
		this.quaternion.set(r.x, r.y, r.z, r.w);
	}

	// === синхронизация по сети ===
	sendNetworkState() {
		if (!this.socket) return;
		const t = this.body.translation();
		const r = this.body.rotation();
		this.socket.emit("entity-update", {
			ID: this.ID,
			position: [t.x, t.y, t.z],
			rotation: [r.x, r.y, r.z, r.w],
		} as EntityState);
	}

	applyNetworkState(state: EntityState) {
		this.position.fromArray(state.position);
		this.quaternion.fromArray(state.rotation);
		this.body.setTranslation(this.position, false);
		this.body.setRotation(this.quaternion, false);
	}
}
