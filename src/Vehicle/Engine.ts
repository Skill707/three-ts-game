import { clamp } from "three/src/math/MathUtils.js";
import type Keyboard from "../Keyboard";

export default class Engine {
	outputRPM: number = 0;
	maxRPM: number = 5000;
	throttleInput: number = 0;
	constructor() {}

	drive(keyboard: Keyboard) {
		if (keyboard.keyMap["KeyW"]) this.throttleInput = 1;
		else this.throttleInput = 0;
	}

	update(delta: number) {
		this.outputRPM = clamp(this.outputRPM + this.throttleInput * delta, 0, this.maxRPM);
		if (this.throttleInput === 0) this.outputRPM = clamp(this.outputRPM - delta, 0, this.maxRPM);
	}
}
