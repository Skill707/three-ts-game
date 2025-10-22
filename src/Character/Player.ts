import { Vector3 } from "three";
import Character from "./Character";

export class Player extends Character {
	readonly name: string;
	constructor(id: string, position: Vector3 = new Vector3(), nickname: string) {
		super("player", position);
		this.ID = id;
		this.name = nickname || "Guest";
		this.object.name = "Player " + nickname;
	}
}
