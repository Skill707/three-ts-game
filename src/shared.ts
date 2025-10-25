import { type QuaternionTuple, type Vector3Tuple } from "three";

export type EntityTypes = "wall" | "window" | "door" | "player" | "npc" | "floor" | "block" | "cone" | "sphere";

export interface EntityStateParameters {
	type: EntityTypes;
	ID?: string;
	position?: Vector3Tuple;
	rotation?: QuaternionTuple;
	velocity?: Vector3Tuple;
	angVelocity?: Vector3Tuple;
}

export class EntityState {
	readonly ID: string;
	type: EntityTypes;
	position: Vector3Tuple;
	rotation: QuaternionTuple;
	velocity: Vector3Tuple;
	angVelocity: Vector3Tuple;

	constructor(parameters: EntityStateParameters) {
		this.type = parameters.type;
		this.ID = parameters.ID || crypto.randomUUID();
		this.position = parameters.position || [0, 0, 0];
		this.rotation = parameters.rotation || [0, 0, 0, 1];
		this.velocity = parameters.velocity || [0, 0, 0];
		this.angVelocity = parameters.angVelocity || [0, 0, 0];
	}
}

export class PlayerState {
	readonly id: string;
	readonly nick: string;
	isHost = false;
	timestamp: number = 0;

	constructor(id: string, nick: string) {
		this.id = id;
		this.nick = nick;
	}
}

export interface GameState {
	players: PlayerState[];
	entities: EntityState[];
	timestamp: number;
}

export interface InputState {
	forward?: number;
	right?: number;
	jump?: boolean;
	hasInput: boolean;
}

export interface ServerMessage {
	type: "gameState" | "playerJoined" | "playerLeft" | "playerUpdate";
	data: any;
}

export interface ClientMessage {
	type: "input" | "ping";
	data: any;
}
