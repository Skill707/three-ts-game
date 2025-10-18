import { BoxGeometry, Mesh, MeshBasicMaterial, Object3D, Quaternion, Vector3 } from "three";
import type Craft from "../Vehicle/Craft";
import { world } from "../main";
import { Collider, ColliderDesc, ImpulseJoint, RigidBodyDesc, type RigidBody } from "@dimforge/rapier3d";
import { fixedJoint } from "../basicUtils";
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";

type BuildingType = "HOUSE" | "APARTMENT" | "HANGAR" | "COTTAGE";

export class Building extends Object3D {
	craft: Craft | null = null;
	wallWidth = 0.25;
	floorWidth = 0.25;
	type: BuildingType;

	constructor(
		type: BuildingType = "HOUSE",
		position: Vector3 = new Vector3(),
		rotation: Quaternion = new Quaternion(),
		size: Vector3 = new Vector3(8, 4, 6)
	) {
		super();
		this.name = "Building";
		this.type = type;
		this.position.copy(position);
		this.quaternion.copy(rotation);

		switch (type) {
			case "HOUSE":
				this.buildHouse(size);
				break;
			case "APARTMENT":
				this.buildApartment(size);
				break;
			case "HANGAR":
				this.buildHangar(size);
				break;
			case "COTTAGE":
				this.buildCottage(size);
				break;
		}
	}

	// ===== BASIC ONE-STORY HOUSE =====
	private buildHouse(size: Vector3) {
		const { x, y, z } = size;
		const w = this.wallWidth;

		const floor = new FirstFloor(new Vector3(0, this.floorWidth / 2, 0), new Quaternion(), new Vector3(x - w * 2, this.floorWidth, z - w * 2));

		const walls = [
			new Wall(new Vector3(0, y / 2, z / 2 - w / 2), new Quaternion(), new Vector3(x, y, w)), // front
			new Wall(new Vector3(0, y / 2, -z / 2 + w / 2), new Quaternion(), new Vector3(x, y, w)), // back
			new Wall(new Vector3(-x / 2 + w / 2, y / 2, 0), new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2), new Vector3(z, y, w)),
			new Wall(new Vector3(x / 2 - w / 2, y / 2, 0), new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2), new Vector3(z, y, w)),
		];

		// Дверь в передней стене
		const door = new Wall(new Vector3(0, 1, z / 2 - w / 2 - 0.01), new Quaternion(), new Vector3(1, 2, 0.05));
		door.material = new MeshBasicMaterial({ color: 0x552200 });

		const roof = new Roof(new Vector3(0, y - this.floorWidth / 2, 0), new Quaternion(), new Vector3(x - w * 2, this.floorWidth, z - w * 2));

		this.add(floor, ...walls, door, roof);

		this.syncAll(floor, walls, roof);
	}

	// ===== MULTI-STORY APARTMENT =====
	private buildApartment(size: Vector3) {
		const floors = 3;
		const { x, y, z } = size;
		const h = y / floors;

		const baseFloor = new FirstFloor(new Vector3(0, this.floorWidth / 2, 0), new Quaternion(), new Vector3(x, this.floorWidth, z));
		this.add(baseFloor);

		for (let i = 0; i < floors; i++) {
			const yOffset = i * h;
			const front = new Wall(new Vector3(0, yOffset + h / 2, z / 2 - this.wallWidth / 2), new Quaternion(), new Vector3(x, h, this.wallWidth));
			const back = new Wall(new Vector3(0, yOffset + h / 2, -z / 2 + this.wallWidth / 2), new Quaternion(), new Vector3(x, h, this.wallWidth));
			this.add(front, back);

			// окна
			for (let j = -1; j <= 1; j++) {
				const window = new Wall(new Vector3(j * 2, yOffset + h * 0.6, z / 2 - this.wallWidth), new Quaternion(), new Vector3(1, 1, 0.05));
				window.material = new MeshBasicMaterial({ color: 0x88ccff });
				this.add(window);
			}
		}

		const roof = new Roof(
			new Vector3(0, y - this.floorWidth / 2, 0),
			new Quaternion(),
			new Vector3(x - this.wallWidth * 2, this.floorWidth, z - this.wallWidth * 2)
		);
		this.add(roof);
		this.syncAll(baseFloor);
	}

	// ===== HANGAR =====
	private buildHangar(size: Vector3) {
		const { x, y, z } = size;
		const w = this.wallWidth;

		const floor = new FirstFloor(new Vector3(0, this.floorWidth / 2, 0), new Quaternion(), new Vector3(x, this.floorWidth, z));

		const front = new Wall(new Vector3(0, y / 2, z / 2 - w / 2), new Quaternion(), new Vector3(x, y, w));
		const back = new Wall(new Vector3(0, y / 2, -z / 2 + w / 2), new Quaternion(), new Vector3(x, y, w));

		const leftRot = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2);
		const rightRot = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
		const left = new Wall(new Vector3(-x / 2 + w / 2, y / 2, 0), leftRot, new Vector3(z, y, w));
		const right = new Wall(new Vector3(x / 2 - w / 2, y / 2, 0), rightRot, new Vector3(z, y, w));

		// Ворота
		const gate = new Wall(new Vector3(0, y / 4, z / 2 - w / 2 - 0.01), new Quaternion(), new Vector3(x * 0.6, y / 2, 0.05));
		gate.material = new MeshBasicMaterial({ color: 0x333333 });

		const roof = new Roof(new Vector3(0, y - this.floorWidth / 2, 0), new Quaternion(), new Vector3(x, this.floorWidth, z));

		this.add(floor, front, back, left, right, gate, roof);
		this.syncAll(floor, [front, back, left, right, gate], roof);
	}

	// ===== COTTAGE =====
	private buildCottage(size: Vector3) {
		const { x, y, z } = size;
		this.buildHouse(new Vector3(x, y * 0.8, z));
	}

	private syncAll(floor: FirstFloor, walls?: Wall[], roof?: Roof) {
		this.updateWorldMatrix(true, true);
		floor.syncPhysics();
		if (walls) walls.forEach((w) => w.syncPhysics(floor.body));
		if (roof) roof.syncPhysics(floor.body);
	}
}

export class FirstFloor extends Mesh {
	body: RigidBody;
	collider: Collider;
	worldBodyJoint: ImpulseJoint | null = null;
	HP: number = 100;

	constructor(position: Vector3 = new Vector3(), rotation = new Quaternion(), size: Vector3) {
		super();
		this.name = "Floor";
		this.castShadow = true;
		this.receiveShadow = true;

		this.geometry = new BoxGeometry(...size);
		this.material = new MeshBasicMaterial({ color: 0x00ff00 });

		this.position.copy(position);
		this.quaternion.copy(rotation);

		this.body = world.createRigidBody(RigidBodyDesc.dynamic());

		const colliderDesc = ColliderDesc.cuboid(...size.multiplyScalar(0.5).toArray());
		this.collider = world.createCollider(colliderDesc, this.body);
		this.body.userData = this;
	}

	syncPhysics(): void {
		const pos = new Vector3();
		const rot = new Quaternion();
		this.getWorldPosition(pos);
		this.getWorldQuaternion(rot);
		this.body.setTranslation(pos, false);
		this.body.setRotation(rot, false);
	}
}

export class Wall extends Mesh {
	body: RigidBody;
	collider: Collider;
	bodyJoint: ImpulseJoint | null = null;
	HP: number = 100;

	constructor(position: Vector3 = new Vector3(), rotation = new Quaternion(), size: Vector3) {
		super();
		this.name = "Wall";
		this.castShadow = true;
		this.receiveShadow = true;

		this.geometry = new BoxGeometry(...size);
		this.material = new MeshBasicMaterial();

		this.position.copy(position);
		this.quaternion.copy(rotation);

		this.body = world.createRigidBody(RigidBodyDesc.dynamic());
		const colliderDesc = ColliderDesc.cuboid(...size.multiplyScalar(0.5).toArray());
		this.collider = world.createCollider(colliderDesc, this.body);
		this.body.userData = this;
	}

	syncPhysics(body: RigidBody): void {
		const pos = new Vector3();
		const rot = new Quaternion();
		this.getWorldPosition(pos);
		this.getWorldQuaternion(rot);
		this.body.setTranslation(pos, false);
		this.body.setRotation(rot, false);
		this.bodyJoint = fixedJoint(body, this.body);
	}

	update() {
		if (this.bodyJoint && this.HP <= 0) {
			world.removeImpulseJoint(this.bodyJoint, true);
			this.bodyJoint = null;
		}
	}
}

export class WallWithWindow extends Brush {
	body: RigidBody;
	collider: Collider | null = null;
	bodyJoint: ImpulseJoint | null = null;
	HP: number = 100;

	constructor(position: Vector3 = new Vector3(), rotation = new Quaternion(), size: Vector3) {
		super();
		this.name = "Wall";
		this.castShadow = true;
		this.receiveShadow = true;

		this.geometry = new BoxGeometry(...size);
		console.log("do", this.geometry);

		this.material = new MeshBasicMaterial();

		this.updateMatrixWorld();

		const window = new Window(new Vector3(0, 0, 0), rotation, new Vector3(0.3, 2, 2));
		window.position.y = 0;
		window.updateMatrixWorld();

		const evaluator = new Evaluator();

		const result = evaluator.evaluate(this, window, SUBTRACTION);

		this.geometry = result.geometry;
		console.log("posle", this.geometry);

		this.geometry.computeVertexNormals();

		this.position.copy(position);
		this.quaternion.copy(rotation);

		this.body = world.createRigidBody(RigidBodyDesc.dynamic());

		const vertices = this.geometry.attributes.position.array as Float32Array;
		const indices = this.geometry.index
			? (this.geometry.index.array as Uint32Array)
			: new Uint32Array(Array.from({ length: vertices.length / 3 }, (_, i) => i));

		const colliderDesc = ColliderDesc.trimesh(vertices, indices);
		if (colliderDesc) this.collider = world.createCollider(colliderDesc, this.body);

		this.body.userData = this;
	}

	syncPhysics(body?: RigidBody): void {
		const pos = new Vector3();
		const rot = new Quaternion();
		this.getWorldPosition(pos);
		this.getWorldQuaternion(rot);
		this.body.setTranslation(pos, false);
		this.body.setRotation(rot, false);
		if (body) this.bodyJoint = fixedJoint(body, this.body);
	}

	update() {
		if (this.bodyJoint && this.HP <= 0) {
			world.removeImpulseJoint(this.bodyJoint, true);
			this.bodyJoint = null;
		}
	}
}

export class Window extends Brush {
	//body: RigidBody;
	//collider: Collider;
	//bodyJoint: ImpulseJoint | null = null;
	HP: number = 100;

	constructor(position: Vector3 = new Vector3(), rotation = new Quaternion(), size: Vector3) {
		super();
		this.name = "Wall";
		this.castShadow = true;
		this.receiveShadow = true;

		this.geometry = new BoxGeometry(...size);
		this.material = new MeshBasicMaterial();

		this.position.copy(position);
		this.quaternion.copy(rotation);

		/*this.body = world.createRigidBody(RigidBodyDesc.dynamic());
		const colliderDesc = ColliderDesc.cuboid(...size.multiplyScalar(0.5).toArray());
		this.collider = world.createCollider(colliderDesc, this.body);
		this.body.userData = this;*/
	}
}

export class Roof extends Mesh {
	body: RigidBody;
	collider: Collider;
	bodyJoint: ImpulseJoint | null = null;
	HP: number = 100;

	constructor(position: Vector3 = new Vector3(), rotation = new Quaternion(), size: Vector3) {
		super();
		this.name = "Floor";
		this.castShadow = true;
		this.receiveShadow = true;

		this.geometry = new BoxGeometry(...size);
		this.material = new MeshBasicMaterial({ color: 0x00ff00 });

		this.position.copy(position);
		this.quaternion.copy(rotation);

		this.body = world.createRigidBody(RigidBodyDesc.dynamic());

		const colliderDesc = ColliderDesc.cuboid(...size.multiplyScalar(0.5).toArray());
		this.collider = world.createCollider(colliderDesc, this.body);
		this.body.userData = this;
	}

	syncPhysics(body: RigidBody): void {
		const pos = new Vector3();
		const rot = new Quaternion();
		this.getWorldPosition(pos);
		this.getWorldQuaternion(rot);
		this.body.setTranslation(pos, false);
		this.body.setRotation(rot, false);

		this.bodyJoint = fixedJoint(body, this.body);
	}

	update() {
		if (this.bodyJoint && this.HP <= 0) {
			world.removeImpulseJoint(this.bodyJoint, true);
			this.bodyJoint = null;
		}
	}
}
