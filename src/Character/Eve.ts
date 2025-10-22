import { AnimationMixer, AnimationUtils, Mesh, Object3D } from "three";
import { resources } from "../main";
import type { ActionsGroup } from "../types";
import type { GLTF } from "three/examples/jsm/Addons.js";
import { SkeletonUtils } from "three/addons";

export default class Eve extends Object3D {
	private mixer: AnimationMixer;
	readonly animationActions: ActionsGroup = {};

	constructor() {
		super();
		this.name = "EveGroup";
		const eve = resources.get<GLTF>("eveWalk");
		const idle = resources.get<GLTF>("eveIdle");
		const run = resources.get<GLTF>("eveRun");
		const jump = resources.get<GLTF>("jump");
		const drive = resources.get<GLTF>("drive");
		const pose = resources.get<GLTF>("evePose");

		const armature = SkeletonUtils.clone(eve.scene);

		/*armature.traverse((m: Mesh) => {
			if (m.isMesh) {
				m.castShadow = true;
			}
		});*/

		this.mixer = new AnimationMixer(armature);
		this.animationActions["idle"] = this.mixer.clipAction(idle.animations[0]);
		this.animationActions["walk"] = this.mixer.clipAction(eve.animations[0]);
		this.animationActions["walk"] = this.mixer.clipAction(AnimationUtils.subclip(eve.animations[0], "walk", 0, 42));
		this.animationActions["run"] = this.mixer.clipAction(run.animations[0]);
		this.animationActions["run"] = this.mixer.clipAction(AnimationUtils.subclip(run.animations[0], "run", 0, 17));
		jump.animations[0].tracks = jump.animations[0].tracks.filter(function (e: any) {
			return !e.name.endsWith(".position");
		});
		//console.log(jump.animations[0].tracks);
		this.animationActions["jump"] = this.mixer.clipAction(jump.animations[0]);
		this.animationActions["pose"] = this.mixer.clipAction(pose.animations[0]);
		this.animationActions["drive"] = this.mixer.clipAction(drive.animations[0]);

		this.animationActions["idle"].play();

		this.add(armature);
	}

	update(delta: number) {
		this.mixer?.update(delta);
	}
}
