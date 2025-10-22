import { Mesh, MeshBasicMaterial, ShapeGeometry, Vector3 } from "three";
import Character from "./Character";

export class NPC extends Character {
    readonly name: string;
    constructor(id: string, position: Vector3 = new Vector3(), nickname?: string) {
        super("npc", position);
        this.ID = id
        this.name = nickname || "NPC";
        this.object.name = "NPC";
    }
}
