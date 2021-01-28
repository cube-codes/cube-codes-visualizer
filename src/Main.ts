import { Scene, PerspectiveCamera, Color, WebGLRenderer, MeshBasicMaterial, Mesh, Group, Quaternion, Vector3 } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RoundedBoxBufferGeometry } from './RoundedBoxBufferGeometry';

export class CubeState {

	constructor(readonly edgeLength: number) {

	}

}

export class CubeHighlighting {

	constructor() {

	}

}

export class CubeVisualizer {

	constructor(initialState: CubeState, initialHighlighting: CubeHighlighting) {

	}

	private rotateSlices(dimension: CubeDimension, sliceCoordinates: Array<number>, angle: number): void {
		
	}

}

function createCubelet(xLimit: number, yLimit: number, zLimit: number) {

	const cubeletBaseEdgeLength = 1;
	const cubeletBaseEdgeRadius = 0.06;
	const cubeletBaseColor = 0x000000;

	const stickerEdgeLength = cubeletBaseEdgeLength - (2 * cubeletBaseEdgeRadius);
	const stickerEdgeRadius = 0.01;

	const cubeletBaseGeometry = new RoundedBoxBufferGeometry(cubeletBaseEdgeLength, cubeletBaseEdgeLength, cubeletBaseEdgeLength, cubeletBaseEdgeRadius, 10);
	const cubeletBaseMaterial = new MeshBasicMaterial({ color: cubeletBaseColor });
	const cubeletBase = new Mesh(cubeletBaseGeometry, cubeletBaseMaterial);

	const stickerGeometry = new RoundedBoxBufferGeometry(stickerEdgeLength, stickerEdgeLength, 2 * stickerEdgeRadius, stickerEdgeRadius, 10);

	const cubelet = new Group();
	cubelet.add(cubeletBase);

	if (xLimit !== 0) {
		const stickerMaterial = new MeshBasicMaterial({ color: xLimit === 1 ? 0xba0c2f : 0xfe5000 });
		const sticker = new Mesh(stickerGeometry, stickerMaterial);
		cubelet.add(sticker);
		sticker.rotateY(Math.PI / 2);
		sticker.position.set(0.5 * xLimit, 0, 0);
	}

	if (yLimit !== 0) {
		const stickerMaterial = new MeshBasicMaterial({ color: yLimit === 1 ? 0xffffff : 0x003da5 });
		const sticker = new Mesh(stickerGeometry, stickerMaterial);
		cubelet.add(sticker);
		sticker.rotateX(Math.PI / 2);
		sticker.position.set(0, 0.5 * yLimit, 0);
	}

	if (zLimit !== 0) {
		const stickerMaterial = new MeshBasicMaterial({ color: zLimit === 1 ? 0x009a44 : 0xffd700 });
		const sticker = new Mesh(stickerGeometry, stickerMaterial);
		cubelet.add(sticker);
		sticker.position.set(0, 0, 0.5 * zLimit);
	}

	return cubelet;

}

export function run() {

	const scene = new Scene();
	scene.background = new Color(0xdddddd);
	const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

	const renderer = new WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	window.document.body.appendChild(renderer.domElement);

	const top: Array<Group> = [];
	const edgeLength = 5
	const f = (edgeLength / 2) - 0.5
	const explodeFactor = 1;
	for (let x = -f; x <= f; x++) {
		for (let y = -f; y <= f; y++) {
			for (let z = -f; z <= f; z++) {
				const xLimit = x === f ? 1 : x === -f ? -1 : 0;
				const yLimit = y === f ? 1 : y === -f ? -1 : 0;
				const zLimit = z === f ? 1 : z === -f ? -1 : 0;
				if (xLimit === 0 && yLimit === 0 && zLimit === 0) {
					continue;
				}
				const c = createCubelet(xLimit, yLimit, zLimit);
				if(yLimit === 1) {
					top.push(c)
				}
				scene.add(c);
				c.position.set(x * explodeFactor, y * explodeFactor, z * explodeFactor)
			}
		}
	}

	camera.position.set(7, 2, 2);

	const controls = new OrbitControls(camera, renderer.domElement);

	function animate() {

		requestAnimationFrame(animate);

		controls.update();

		const axis = new Vector3(0, 1, 0)
		const angle = 0.02
		const point = new Vector3(0, 0, 0)

		const q = new Quaternion();
		q.setFromAxisAngle(axis, angle);

		for(let c of top) {
			c.applyQuaternion(q);
			c.position.sub(point);
			c.position.applyQuaternion(q);
			c.position.add(point);
		}

		renderer.render(scene, camera);

	}
	animate();

}