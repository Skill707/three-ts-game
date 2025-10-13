import type Keyboard from "../Keyboard";

export default class Transmission {
	inputRPM: number = 0;
	outputRPM: number = 0;
	gearRatio: number = 3;

	constructor() {}

	drive(keyboard: Keyboard) {
		if (keyboard.keyMap["1"]) this.gearRatio = 3;
		else if (keyboard.keyMap["2"]) this.gearRatio = 2;
		else if (keyboard.keyMap["3"]) this.gearRatio = 1;
		else if (keyboard.keyMap["4"]) this.gearRatio = 0.5;
		else if (keyboard.keyMap["5"]) this.gearRatio = 0.33;
		else if (keyboard.keyMap["6"]) this.gearRatio = 0.25;
		else if (keyboard.keyMap["7"]) this.gearRatio = 0.2;
		else if (keyboard.keyMap["`"]) this.gearRatio = -2;
	}

	update() {
		this.outputRPM = this.inputRPM / this.gearRatio;
	}
}
