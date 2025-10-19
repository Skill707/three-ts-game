import { BoxGeometry, Mesh, MeshBasicMaterial, Quaternion, Vector3 } from "three";
import { ColliderDesc, RigidBodyDesc } from "@dimforge/rapier3d";
import { Entity } from "../Entity";
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";
import type Craft from "../Vehicle/Craft";

type BuildingType = "HOUSE" | "APARTMENT" | "HANGAR" | "COTTAGE";

export class Building {
	craft: Craft | null = null;
	wallWidth = 0.25;
	floorWidth = 0.25;
	type: BuildingType;
	parts: BuildingPart[] = [];
	position: Vector3 = new Vector3();
	rotation: Quaternion = new Quaternion();

	constructor(
		type: BuildingType = "HOUSE",
		position: Vector3 = new Vector3(),
		rotation: Quaternion = new Quaternion(),
		size: Vector3 = new Vector3(8, 4, 6)
	) {
		this.type = type;
		this.position = position;
		this.rotation = rotation;

		switch (type) {
			case "HOUSE":
				this.buildHouse(size);
				break;
			case "APARTMENT":
				//this.buildApartment(size);
				break;
			case "HANGAR":
				//this.buildHangar(size);
				break;
			case "COTTAGE":
				//this.buildCottage(size);
				break;
		}
	}

	private buildHouse(size: Vector3) {
		const { x, y, z } = size;
		const w = this.wallWidth;

		const floor = new FirstFloor(
			this.position.add(new Vector3(0, this.floorWidth / 2, 0)),
			new Quaternion(),
			new Vector3(x - w * 2, this.floorWidth, z - w * 2)
		);

		const walls = [
			new Wall(new Vector3(0, y / 2, z / 2 - w / 2).add(this.position), new Quaternion(), new Vector3(x, y, w)), // front
			new Wall(new Vector3(0, y / 2, -z / 2 + w / 2).add(this.position), new Quaternion(), new Vector3(x, y, w)), // back
			new Wall(
				new Vector3(-x / 2 + w / 2, y / 2, 0).add(this.position),
				new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2),
				new Vector3(z, y, w)
			),
			new Wall(
				new Vector3(x / 2 - w / 2, y / 2, 0).add(this.position),
				new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2),
				new Vector3(z, y, w)
			),
		];

		const roof = new Wall(
			this.position.add(new Vector3(0, y - this.floorWidth / 2, 0)),
			new Quaternion(),
			new Vector3(x - w * 2, this.floorWidth, z - w * 2)
		);

		this.parts = [floor, ...walls, roof];
	}
}

abstract class BuildingPart extends Entity {
	constructor() {
		super("buildingPart");
	}
	update(_delta: number): void {}
}

export class FirstFloor extends BuildingPart {
	constructor(position: Vector3 = new Vector3(), rotation = new Quaternion(), size: Vector3) {
		super();
		this.bodyDesc = RigidBodyDesc.fixed()
			.setTranslation(...position.toArray())
			.setRotation(rotation);

		const geometry = new BoxGeometry(...size);
		const material = new MeshBasicMaterial();

		this.object = new Mesh(geometry, material);
		this.object.name = "Wall";
		this.colliderDesc = ColliderDesc.cuboid(...size.multiplyScalar(0.5).toArray());
	}
}

export class Wall extends BuildingPart {
	constructor(position: Vector3 = new Vector3(), rotation = new Quaternion(), size: Vector3) {
		super();
		this.bodyDesc = RigidBodyDesc.dynamic()
			.setTranslation(...position.toArray())
			.setRotation(rotation);

		const geometry = new BoxGeometry(...size);
		const material = new MeshBasicMaterial();
		this.object = new Mesh(geometry, material);
		this.object.name = "Wall";
		this.colliderDesc = ColliderDesc.cuboid(...size.multiplyScalar(0.5).toArray());
	}
}

export class WallWithWindow extends BuildingPart {
	constructor(position: Vector3 = new Vector3(), rotation = new Quaternion(), size: Vector3) {
		super();
		this.bodyDesc = RigidBodyDesc.dynamic()
			.setTranslation(...position.toArray())
			.setRotation(rotation);

		const wall = new Brush(new BoxGeometry(...size), new MeshBasicMaterial());

		const window = new Window(new Vector3(0, 0, 0), rotation, new Vector3(0.3, 2, 2));
		window.position.y = 0;

		const evaluator = new Evaluator();
		const result = evaluator.evaluate(wall, window, SUBTRACTION);
		result.geometry.computeVertexNormals();

		const vertices = result.geometry.attributes.position.array as Float32Array;
		const indices = result.geometry.index
			? (result.geometry.index.array as Uint32Array)
			: new Uint32Array(Array.from({ length: vertices.length / 3 }, (_, i) => i));

		this.colliderDesc = ColliderDesc.trimesh(vertices, indices);
		this.object = result;
	}
}

class Window extends Brush {
	constructor(position: Vector3 = new Vector3(), rotation = new Quaternion(), size: Vector3) {
		super();
		this.geometry = new BoxGeometry(...size);
		this.material = new MeshBasicMaterial();
		this.position.copy(position);
		this.quaternion.copy(rotation);
	}
}
