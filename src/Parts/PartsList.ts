import { Object3D } from "three";
import { Part } from "./Part";

export default class PartsList extends Object3D {
	children: Part[];
	selectedPart: Part;

	constructor() {
		super();
		this.name = "PartsList";
		this.children = [];

		const block = new Part("block");
		block.position.set(0, 0, 0);
		this.add(block);

		const cone = new Part("cone");
		cone.position.set(2, 0, 0);
		this.add(cone);

		const sphere = new Part("sphere");
		sphere.position.set(-2, 0, 0);
		this.add(sphere);

		this.selectedPart = block;
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
