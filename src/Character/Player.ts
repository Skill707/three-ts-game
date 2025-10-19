import { Vector3 } from "three";
import Character from "./Character";
import type Keyboard from "../Keyboard";

export class Player extends Character {
	readonly name: string;
	constructor(position: Vector3 = new Vector3(), keyboard?: Keyboard, nickname?: string) {
		super("player", position, keyboard);
		this.name = nickname || "Guest";
	}
}
