import { Collider, ColliderDesc, type World } from "@dimforge/rapier3d";
import {
	BufferGeometry,
	Group,
	Matrix4,
	Mesh,
	MeshStandardMaterial,
	PlaneGeometry,
	RepeatWrapping,
	Texture,
	Vector3,
	type MeshStandardMaterialParameters,
	type Scene,
	type Side,
	type Vector3Tuple,
} from "three";
import { resources } from "./main";
import { degToRad } from "three/src/math/MathUtils.js";

interface Road {
	collider: Collider;
	geometry: BufferGeometry;
	mesh: Mesh;
	position: Vector3;
	width: number;
}

type GenerationType = "Road" | "none";

export class WorldGenerator {
	private group: Group;
	private currentGenerationType: GenerationType;
	private world: World;
	private roadNextID = 1;
	private roadPositions: Vector3[] = [];
	private roadAngles: number[] = [];
	private roadWidth: number = 20;
	private roads: Road[] = [];
	private lastRoadPosition: Vector3 = new Vector3();
	public roadLeftSide: Vector3[] = [];
	public roadRightSide: Vector3[] = [];

	constructor(scene: Scene, world: World) {
		this.currentGenerationType = "none";
		this.group = new Group();
		this.group.name = "WorldGenerator";
		scene.add(this.group);
		this.world = world;
	}

	private create(geometry: BufferGeometry, materialParameters: MeshStandardMaterialParameters, position: Vector3 = new Vector3()) {
		const material = new MeshStandardMaterial(materialParameters);
		const mesh = new Mesh(geometry, material);
		mesh.name = geometry.name;
		mesh.position.copy(position);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		this.group.add(mesh);

		//const colliderDesc = ColliderDesc.convexHull(geometry.attributes.position.array as Float32Array);
		const colliderDesc = geometry.index
			? ColliderDesc.trimesh(geometry.attributes.position.array as Float32Array, geometry.index.array as Uint32Array)
			: null;
		if (colliderDesc) {
			const collider = this.world.createCollider(colliderDesc);
			collider.setTranslation(position);
			this.roads.push({ collider, geometry, mesh, position, width: this.roadWidth });
		}
	}

	createPlain() {
		const geometry = new PlaneGeometry(200, 200);
		geometry.rotateX(-Math.PI / 2);
		geometry.name = "Plain";

		const texture = (resources.get("grass") as Texture).clone();
		texture.wrapS = texture.wrapT = RepeatWrapping;
		texture.repeat.set(100, 100);
		texture.wrapS = texture.wrapT = RepeatWrapping;
		texture.repeat.set(100, 100);

		const materialParameters = { map: texture };

		this.create(geometry, materialParameters);
	}

	startRoad(position: Vector3 | Vector3Tuple, angle: number = 0, width: number = 20) {
		this.currentGenerationType = "Road";
		this.roadWidth = width;
		this.lastRoadPosition = new Vector3(...position);
		this.roadPositions = [];
		this.roadAngles = [];
		this.roadLeftSide = [];
		this.roadRightSide = [];
		this.roadPositions.push(this.lastRoadPosition.clone());
		this.roadAngles.push(angle);
	}

	moveTo(position: Vector3 | Vector3Tuple, angle: number = 0) {
		if (this.currentGenerationType === "Road") {
			this.lastRoadPosition.add(new Vector3(...position));
			this.roadPositions.push(this.lastRoadPosition.clone());
			this.roadAngles.push(angle);
		}
	}

	endRoad() {
		const geometry = new BufferGeometry();
		geometry.name = "Road" + this.roadNextID++;

		const points = [] as Vector3[];
		const indices = [] as number[];
		let vertexCount = 0;

		let prevTL: Vector3 | null = null;
		let prevTR: Vector3 | null = null;

		for (let i = 0; i < this.roadPositions.length - 1; i++) {
			const pos0 = this.roadPositions[i];
			const pos1 = this.roadPositions[i + 1];

			const radTo = Math.atan2(pos1.z - pos0.z, pos1.x - pos0.x) - Math.PI / 2;
			const halfWidth = this.roadWidth / 2;

			const cos = Math.cos(radTo) * halfWidth;
			const sin = Math.sin(radTo) * halfWidth;

			const tiltMatrix0 = new Matrix4().makeRotationZ(degToRad(this.roadAngles[i]));
			const tiltMatrix1 = new Matrix4().makeRotationZ(degToRad(this.roadAngles[i + 1]));

			const bl = prevTL ? prevTL.clone() : new Vector3(pos0.x - cos, pos0.y, pos0.z - sin).applyMatrix4(tiltMatrix0);
			const br = prevTR ? prevTR.clone() : new Vector3(pos0.x + cos, pos0.y, pos0.z + sin).applyMatrix4(tiltMatrix0);

			const tl = new Vector3(pos1.x - cos, pos1.y, pos1.z - sin).applyMatrix4(tiltMatrix1);
			const tr = new Vector3(pos1.x + cos, pos1.y, pos1.z + sin).applyMatrix4(tiltMatrix1);

			points.push(tl, tr, br, bl); // polygon
			indices.push(vertexCount, vertexCount + 1, vertexCount + 2, vertexCount, vertexCount + 2, vertexCount + 3);
			vertexCount += 4;

			prevTL = tl;
			prevTR = tr;
			this.roadLeftSide.push(bl);
			this.roadRightSide.push(br);
		}

		geometry.setFromPoints(points);
		geometry.setIndex(indices);

		const texture = (resources.get("asphalt") as Texture).clone();

		/*texture.wrapS = texture.wrapT = RepeatWrapping;
		texture.repeat.set(100, 100);
		texture.wrapS = texture.wrapT = RepeatWrapping;
		texture.repeat.set(100, 100);*/
		const materialParameters: MeshStandardMaterialParameters = { map: texture, side: 0 };
		this.create(geometry, materialParameters);
		this.currentGenerationType = "none";
	}

	addBordersToRoad(roadSidePositions: Vector3[], angle: number = 0, side: number = 2) {
		const geometry = new BufferGeometry();
		geometry.name = "Road" + this.roadNextID + "Side";

		const points = [] as Vector3[];
		const indices = [] as number[];
		let vertexCount = 0;

		let prevTL: Vector3 | null = null;
		let prevTR: Vector3 | null = null;

		for (let i = 0; i < roadSidePositions.length - 1; i++) {
			const pos0 = roadSidePositions[i];
			const pos1 = roadSidePositions[i + 1];

			const radTo = Math.atan2(pos1.z - pos0.z, pos1.x - pos0.x) - Math.PI / 2;
			const halfWidth = this.roadWidth / 2;

			const cos = Math.cos(radTo) * halfWidth;
			const sin = Math.sin(radTo) * halfWidth;

			const bl = prevTL ? prevTL.clone() : new Vector3(pos0.x, pos0.y, pos0.z);
			const br = prevTR ? prevTR.clone() : new Vector3(pos0.x, 0, pos0.z);
			const tl = new Vector3(pos1.x, pos1.y, pos1.z);
			const tr = new Vector3(pos1.x + pos1.y * cos * angle, 0, pos1.z + pos1.y * sin * angle);

			points.push(tl, tr, br, bl); // polygon
			indices.push(vertexCount, vertexCount + 1, vertexCount + 2, vertexCount, vertexCount + 2, vertexCount + 3);
			vertexCount += 4;

			prevTL = tl;
			prevTR = tr;
		}

		geometry.setFromPoints(points);
		geometry.setIndex(indices);

		const texture = (resources.get("grass") as Texture).clone();
		texture.wrapS = texture.wrapT = RepeatWrapping;
		texture.repeat.set(100, 100);
		texture.wrapS = texture.wrapT = RepeatWrapping;
		texture.repeat.set(100, 100);
		const materialParameters: MeshStandardMaterialParameters = { map: texture, side: side as Side };
		this.create(geometry, materialParameters);
	}
}
