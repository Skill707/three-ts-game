import type { AnimationAction, Object3D, Quaternion, Vector3 } from "three";

export interface Part {
	model: Object3D;
	position: Vector3;
	rotation: Quaternion;
}

export interface WheelPart extends Part {
	maxAngle: number;
	maxSpeed: number;
	suspStiffnes: number;
	suspDamping: number;
	wheelFriction: number;
}

export interface CarParts {
	rootPos: Vector3;
	main: Part;
	wheels: WheelPart[];
}

export interface ActionsGroup {
	[key: string]: AnimationAction;
}

