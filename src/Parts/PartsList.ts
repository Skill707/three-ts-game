import { Object3D } from "three";
import { Part } from "./Part";

export default class PartsList extends Object3D {
	//children: Part[];
	selectedPart: Object3D;

	constructor() {
		super();
		this.name = "PartsList";
		this.children = [];

		const block = new Part("block", [0, 0, 0], [0, 0, 0, 0], "block", true);
		this.add(block.object);

		const cone = new Part("cone", [1, 0, 0], [0, 0, 0, 0], "cone", true);
		this.add(cone.object);

		const sphere = new Part("sphere", [-1, 0, 0], [0, 0, 0, 0], "sphere", true);
		this.add(sphere.object);

		this.selectedPart = block.object;
		this.selectedPart.scale.set(1.5, 1.5, 1.5);
	}

	selectNext() {
		const index = this.children.indexOf(this.selectedPart);
		if (index < this.children.length - 1) {
			this.selectedPart.scale.set(1, 1, 1);
			this.selectedPart = this.children[index + 1];
			this.selectedPart.scale.set(1.5, 1.5, 1.5);
		}
	}

	selectPrev() {
		const index = this.children.indexOf(this.selectedPart);
		if (index > 0) {
			this.selectedPart.scale.set(1, 1, 1);
			this.selectedPart = this.children[index - 1];
			this.selectedPart.scale.set(1.5, 1.5, 1.5);
		}
	}
}
