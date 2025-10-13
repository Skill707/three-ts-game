import { BackSide, BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, RepeatWrapping, Texture } from "three";
import { createNoise2D } from "simplex-noise";
import { clamp } from "three/src/math/MathUtils.js";

function generateGround(width = 10, height = 10, segX = 50, segY = 50, amplitude = 2, frequency = 2) {
	const positions = [];
	const uvs = [];
	const halfW = width / 2;
	const halfH = height / 2;

	for (let iy = 0; iy <= segY; iy++) {
		const v = iy / segY;
		const yPos = v * height - halfH;

		for (let ix = 0; ix <= segX; ix++) {
			const u = ix / segX;
			const xPos = u * width - halfW;

			// плавные холмы через simplex noise
			const noise = createNoise2D();
			const z = clamp(noise(u * frequency, v * frequency) * amplitude, 0, ix < segX / 2 && iy < segY / 2 ? 0 : 1000);

			positions.push(xPos, z, yPos);
			uvs.push(u, v);
		}
	}

	// индексы треугольников
	const indices = [];
	for (let iy = 0; iy < segY; iy++) {
		for (let ix = 0; ix < segX; ix++) {
			const a = iy * (segX + 1) + ix;
			const b = iy * (segX + 1) + ix + 1;
			const c = (iy + 1) * (segX + 1) + ix;
			const d = (iy + 1) * (segX + 1) + ix + 1;

			indices.push(a, b, c);
			indices.push(b, d, c);
		}
	}

	const geo = new BufferGeometry();
	geo.setIndex(indices);
	geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
	geo.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
	geo.computeVertexNormals();

	return geo;
}

export default class Ground extends Group {
	constructor(width: number, height: number, segX: number, segY: number, amplitude: number, frequency: number, texture: Texture) {
		super();
		this.name = "Ground";
		texture.wrapS = texture.wrapT = RepeatWrapping;
		texture.repeat.set(1000, 1000);
		texture.wrapS = texture.wrapT = RepeatWrapping;
		texture.repeat.set(1000, 1000);
		const geometry = generateGround(width, height, segX, segY, amplitude, frequency);
		const material = new MeshStandardMaterial({ map: texture, side: BackSide });
		const mesh = new Mesh(geometry, material);
		this.add(mesh);
	}
}
