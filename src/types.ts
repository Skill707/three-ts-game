import type { ColliderDesc } from "@dimforge/rapier3d";
import type { Object3D, Vector3 } from "three";

export interface KeyMap {
	[key: string]: boolean;
}

export interface Part {
	model: Object3D;
	collider: ColliderDesc;
}

export interface CarParts {
	rootPos: Vector3;
	main: Part;
	wheels: Part[];
}

