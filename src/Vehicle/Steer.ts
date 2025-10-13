import type Keyboard from "../Keyboard";

export default class Steer {
	input: number = 0;
	constructor() {}

	drive(keyboard: Keyboard) {
		if (keyboard.keyMap["KeyA"]) this.input = -1;
		else if (keyboard.keyMap["KeyD"]) this.input = 1;
		else this.input = 0;
	}

	update(_delta: number) {}
}
