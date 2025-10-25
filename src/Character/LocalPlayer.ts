import { Vector3 } from "three";
import Character from "./Character";
import type Keyboard from "../Keyboard";

export class LocalPlayer extends Character {
	public name: string;
	constructor(id: string, position: Vector3 = new Vector3(), nickname: string, keyboard: Keyboard ) {
		super("player", position, keyboard);
		this.ID = id;
		this.name = nickname || "LocalPlayer";
		this.object.name = "LocalPlayer " + nickname;
	}
}
