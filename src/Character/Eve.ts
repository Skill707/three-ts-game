import { AnimationAction, AnimationMixer, AnimationUtils, Group, Mesh } from "three";
import { resources } from "../main";

export default class Eve extends Group {
	mixer?: AnimationMixer;

	constructor() {
		super();
		this.name = "EveGroup";
	}

	async init(animationActions: { [key: string]: AnimationAction }) {
		const eve = resources.get("eveWalk");
		const idle = resources.get("eveIdle");
		const run = resources.get("eveRun");
		const jump = resources.get("jump");
		const drive = resources.get("drive");
		const pose = resources.get("evePose");

		eve.scene.traverse((m: Mesh) => {
			if (m.isMesh) {
				m.castShadow = true;
			}
		});

		this.mixer = new AnimationMixer(eve.scene);
		animationActions["idle"] = this.mixer.clipAction(idle.animations[0]);
		animationActions["walk"] = this.mixer.clipAction(eve.animations[0]);
		animationActions["walk"] = this.mixer.clipAction(AnimationUtils.subclip(eve.animations[0], "walk", 0, 42));
		animationActions["run"] = this.mixer.clipAction(run.animations[0]);
		animationActions["run"] = this.mixer.clipAction(AnimationUtils.subclip(run.animations[0], "run", 0, 17));
		jump.animations[0].tracks = jump.animations[0].tracks.filter(function (e: any) {
			return !e.name.endsWith(".position");
		});
		//console.log(jump.animations[0].tracks);
		animationActions["jump"] = this.mixer.clipAction(jump.animations[0]);
		animationActions["pose"] = this.mixer.clipAction(pose.animations[0]);
		animationActions["drive"] = this.mixer.clipAction(drive.animations[0]);

		animationActions["idle"].play();

		this.add(eve.scene);
	}

	update(delta: number) {
		this.mixer?.update(delta);
	}
}
