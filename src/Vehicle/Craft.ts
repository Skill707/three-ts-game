import { BackSide, Color, Group, Mesh, Object3D, Quaternion, ShaderMaterial, Vector3 } from "three";
import { Part } from "../Parts/PartsList";
import type AttachPoint from "../Parts/AttachPoint";

const GlowMaterial = {
	uniforms: {
		glowColor: { value: new Color(0x00ffff) },
		strength: { value: 0 }, // насколько растянуть наружу
		opacity: { value: 0.1 }, // максимальная яркость
	},
	vertexShader: `
                        uniform float strength;
                        varying vec3 vNormal;
                        void main() {
                            vNormal = normalize(normalMatrix * normal);
                           vec3 scaledPosition = position * (1.0 + strength);
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(scaledPosition, 1.0);
                        }
                    `,
	fragmentShader: `
                            uniform vec3 glowColor;
                            uniform float opacity;
                            varying vec3 vNormal;
                            void main() {
                                float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                                gl_FragColor = vec4(glowColor, intensity * opacity);
                            }
                        `,
	transparent: true,
	side: BackSide, // важный момент — рисуем с обратной стороны
	depthWrite: false,
};

export default class Craft extends Object3D {
	rootPart: Part | null = null;
	children: Part[] = [];

	constructor() {
		super();
		this.name = "Craft";
	}

	add(part: Part): this {
		if (!this.rootPart) this.rootPart = part;
		if (part instanceof Part) return super.add(part);
		return this;
	}

	drawFantoms(selectedPart: Part) {
		this.children.forEach((part: Part) => {
			if (selectedPart && part instanceof Part && part.id !== selectedPart.id) {
				const fantomsGroup = new Group();
				fantomsGroup.name = "fantoms";
				part.add(fantomsGroup);
				selectedPart.attachPoints.children.forEach((attachPointA: AttachPoint) => {
					if (!attachPointA.used) {
						part.attachPoints.children.forEach((attachPointB: AttachPoint) => {
							if (!attachPointB.used) {
								const forward = new Vector3(0, 0, 1); // допустим, attach смотрит вдоль Z
								const qA = new Quaternion().setFromEuler(attachPointA.rotation);
								const qB = new Quaternion().setFromEuler(attachPointB.rotation);

								// Вектора направлений каждой точки
								const dirA = forward.clone().applyQuaternion(qA).normalize();
								const dirB = forward.clone().applyQuaternion(qB).normalize();

								// Угол между ними
								const dot = dirA.dot(dirB);

								if (dot === -1) {
									const mesh = selectedPart.children.find((chil) => chil.name === selectedPart.partType) as Mesh;

									const newMesh = mesh.clone();
									newMesh.layers.set(8);
									newMesh.geometry = mesh.geometry.clone();
									newMesh.material = new ShaderMaterial(GlowMaterial);
									const newPos = new Vector3();
									newPos.copy(attachPointB.position.clone().sub(attachPointA.position.clone()));
									newMesh.position.set(newPos.x, newPos.y, newPos.z);
									newMesh.name = "fantome" + mesh.name;
									newMesh.userData = {
										A: attachPointA,
										B: attachPointB,
									};
									fantomsGroup.add(newMesh);
								}
							}
						});
					}
				});
			}
		});
	}

	removeFantoms() {
		this.children.forEach((part) => {
			if (part instanceof Part) {
				const fantoms = part.children.find((part) => part.name === "fantoms");
				if (fantoms) part.remove(fantoms);

				//const mesh = child.children.find((chil) => chil.name === child.partType) as Mesh;
				//(mesh.material as MeshStandardMaterial).color.set("white");
			}
		});
	}

	update() {
		console.log("update craft", this.name);
		if (this.children.length === 0) {
			console.log("remove craft", this.name);
			this.removeFromParent();
		}
	}
}
