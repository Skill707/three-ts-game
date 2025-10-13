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
import { degToRad } from "three/src/math/MathUtils.js";
import { resources } from "../main";

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
	private roadCircle: boolean = false;

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
		this.roadCircle = false;
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

	endCircle() {
		this.roadCircle = true;
	}

	endRoad() {
		/*
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
*/
		const geometry = buildRoadGeometry(this.roadPositions, this.roadWidth, this.roadAngles, this.roadCircle);
		geometry.name = "Road" + this.roadNextID++;

		const texture = (resources.get("asphalt") as Texture).clone();
		/*texture.wrapS = texture.wrapT = RepeatWrapping;
		texture.repeat.set(100, 100);
		texture.wrapS = texture.wrapT = RepeatWrapping;
		texture.repeat.set(100, 100);*/
		const materialParameters: MeshStandardMaterialParameters = { map: texture, side: 2 };
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

function buildRoadGeometry(roadPositions: Vector3[], roadWidth: number, roadAngles: number[], closed: boolean) {
	const half = roadWidth / 2;
	const N = roadPositions.length;
	if (N < 2) return new BufferGeometry();

	const lefts: Vector3[] = [];
	const rights: Vector3[] = [];
	const eps = 1e-6;

	// предварительно вычисляем направления сегментов
	const dirs: Vector3[] = [];
	for (let i = 0; i < N; i++) {
		const nextIdx = (i + 1) % N;
		const dir = new Vector3().subVectors(roadPositions[nextIdx], roadPositions[i]).setY(0).normalize();
		dirs.push(dir);
	}

	for (let i = 0; i < N; i++) {
		const prevDir = dirs[(i - 1 + N) % N];
		const nextDir = dirs[i];

		// если дорога не замкнута
		if (!closed) {
			if (i === 0) prevDir.copy(nextDir);
			if (i === N - 1) nextDir.copy(prevDir);
		}

		// усреднение направлений (биссектриса)
		const normalPrev = new Vector3(-prevDir.z, 0, prevDir.x);
		const normalNext = new Vector3(-nextDir.z, 0, nextDir.x);

		const miter = new Vector3().addVectors(normalPrev, normalNext);
		if (miter.lengthSq() < eps) miter.copy(normalNext);
		miter.normalize();

		// масштаб митера
		let denom = miter.dot(normalNext);
		if (Math.abs(denom) < eps) denom = eps;
		let scale = half / denom;
		scale = Math.min(scale, half * 3); // ограничение для острых углов

		const p = roadPositions[i];
		const left = new Vector3().copy(p).addScaledVector(miter, -scale);
		const right = new Vector3().copy(p).addScaledVector(miter, scale);

		// наклон
		const tiltM = new Matrix4().makeRotationZ(degToRad(roadAngles[i] || 0));
		left.applyMatrix4(tiltM);
		right.applyMatrix4(tiltM);

		lefts.push(left);
		rights.push(right);
	}

	// ЖЁСТКО СВЯЗЫВАЕМ начало и конец, если дорога замкнута
	if (closed) {
		lefts[lefts.length - 1] = lefts[0].clone();
		rights[rights.length - 1] = rights[0].clone();
	}

	// построение сегментов
	const points: Vector3[] = [];
	const indices: number[] = [];
	let vc = 0;
	const end = closed ? N : N - 1;

	for (let i = 0; i < end; i++) {
		const a = i;
		const b = (i + 1) % N;

		const l0 = lefts[a];
		const r0 = rights[a];
		const l1 = lefts[b];
		const r1 = rights[b];

		points.push(l1.clone(), r1.clone(), r0.clone(), l0.clone());
		indices.push(vc, vc + 1, vc + 2, vc, vc + 2, vc + 3);
		vc += 4;
	}

	const geom = new BufferGeometry();
	geom.setFromPoints(points);
	geom.setIndex(indices);
	geom.computeVertexNormals();
	return geom;
}
