import { Scene, PerspectiveCamera, WebGLRenderer, MeshBasicMaterial, Mesh, Group, Quaternion, Vector3, Spherical, } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RoundedBoxBufferGeometry } from './RoundedBoxBufferGeometry';
import { Cube, CubeSpecification, CubeStateChanged, Vector, CubeletState } from '@cube-codes/cube-codes-model'
import { Utils } from './Utils';

export class CubeVisualizer {

	static readonly INITIAL_LOCATION = 'initialLocation'

	readonly spec: CubeSpecification

	readonly cubelets: ReadonlyMap<string, Group>

	readonly #queue: Array<Animation>

	readonly #controls: OrbitControls

	constructor(private readonly cube: Cube, readonly canvas: HTMLCanvasElement, readonly animationDuration: number) {

		this.spec = this.cube.spec;
		const initialState = this.cube.getState();
		this.cube.stateChanged.on(async e => {
			return new Promise<void>(resolve => {
				if (e.move) {
					this.#queue.push(new MoveAnimation(this, e, resolve));
				} else {
					this.#queue.push(new BeamAnimation(this, e, resolve));
				}
			});
		});

		const scene = new Scene();
		const camera = new PerspectiveCamera(30, 2, 0.1, 1000);
		camera.position.setFromSphericalCoords(Utils.calculateCameraDistance(this.spec, canvas, camera.fov), (Math.PI / 2) - Math.PI / 8, Math.PI / 8);

		const renderer = new WebGLRenderer({ antialias: true, canvas: this.canvas, alpha: true });

		this.cubelets = this.createCubelets(initialState.cubelets.map(c => c.initialLocation));
		scene.add(...this.cubelets.values());

		this.#controls = new OrbitControls(camera, renderer.domElement);

		const resizeCanvasToDisplaySize = () => {

			const canvas = renderer.domElement;
			const width = canvas.clientWidth;
			const height = canvas.clientHeight;

			if (canvas.width !== width || canvas.height !== height) {
				renderer.setSize(width, height, false);
				camera.aspect = width / height;
				camera.updateProjectionMatrix();
				const currentPosition = new Spherical().setFromVector3(camera.position);
				camera.position.setFromSphericalCoords(Utils.calculateCameraDistance(this.spec, canvas, camera.fov), currentPosition.phi, currentPosition.theta);
			}

		};

		this.#queue = new Array<Animation>();

		const fpsInterval = 1000 / 60;
		let startTime: number;
		let lastTime: number;
		const animate = (time: number) => {

			if (startTime === undefined) {
				startTime = time;
				lastTime = time;
			}

			requestAnimationFrame(animate);

			if (time - lastTime < fpsInterval) {
				return;
			}

			const currentAnimation = this.#queue[0];
			if (currentAnimation) {
				const isDone = currentAnimation.step(time, lastTime);
				if (isDone) {
					this.#queue.shift();
				}
			}

			lastTime = time;

			resizeCanvasToDisplaySize();
			this.#controls.update();
			renderer.render(scene, camera);

		}

		requestAnimationFrame(animate);

	}

	private createCubelets(cubeletOrigins: ReadonlyArray<Vector>): ReadonlyMap<string, Group> {

		const cubelets = new Map<string, Group>();

		for (let cubeletOrigin of cubeletOrigins) {
			cubelets.set(Utils.vectorId(cubeletOrigin), this.createCubelet(cubeletOrigin));
		}

		return cubelets;

	}

	private createCubelet(origin: Vector): Group {

		const maxComponent = (this.spec.edgeLength - 1) / 2;

		const originLimit = origin.components.map(c => c === maxComponent ? 1 : c === -maxComponent ? -1 : 0);

		const cubeletBaseEdgeLength = 1;
		const cubeletBaseEdgeRadius = 0.06;
		const cubeletBaseColor = 0x000000;

		const stickerEdgeLength = cubeletBaseEdgeLength - (2 * cubeletBaseEdgeRadius);
		const stickerEdgeRadius = 0.01;

		const cubeletBaseGeometry = new RoundedBoxBufferGeometry(cubeletBaseEdgeLength, cubeletBaseEdgeLength, cubeletBaseEdgeLength, cubeletBaseEdgeRadius, 10);
		const cubeletBaseMaterial = new MeshBasicMaterial({ color: cubeletBaseColor, transparent: true });
		const cubeletBase = new Mesh(cubeletBaseGeometry, cubeletBaseMaterial);

		const stickerGeometry = new RoundedBoxBufferGeometry(stickerEdgeLength, stickerEdgeLength, 2 * stickerEdgeRadius, stickerEdgeRadius, 10);

		const cubelet = new Group();
		cubelet.userData[CubeVisualizer.INITIAL_LOCATION] = origin;
		cubelet.add(cubeletBase);

		if (originLimit[0] !== 0) {
			const stickerMaterial = new MeshBasicMaterial({ color: originLimit[0] === 1 ? 0xba0c2f : 0xfe5000, transparent: true });
			const sticker = new Mesh(stickerGeometry, stickerMaterial);
			cubelet.add(sticker);
			sticker.rotateY(Math.PI / 2);
			sticker.position.set(0.5 * originLimit[0], 0, 0);
		}

		if (originLimit[1] !== 0) {
			const stickerMaterial = new MeshBasicMaterial({ color: originLimit[1] === 1 ? 0xffffff : 0xffd700, transparent: true });
			const sticker = new Mesh(stickerGeometry, stickerMaterial);
			cubelet.add(sticker);
			sticker.rotateX(Math.PI / 2);
			sticker.position.set(0, 0.5 * originLimit[1], 0);
		}

		if (originLimit[2] !== 0) {
			const stickerMaterial = new MeshBasicMaterial({ color: originLimit[2] === 1 ? 0x009a44 : 0x003da5, transparent: true });
			const sticker = new Mesh(stickerGeometry, stickerMaterial);
			cubelet.add(sticker);
			sticker.position.set(0, 0, 0.5 * originLimit[2]);
		}

		cubelet.position.set(origin.getX(), origin.getY(), origin.getZ());

		return cubelet;

	}

	resetCamera(): void {
		this.#controls.reset();
	}

}

export interface Animation {

	step(time: number, lastTime: number): boolean

}

export class MoveAnimation implements Animation {

	#alreadyAngle: number

	#newStatesByInitialLocation: ReadonlyMap<string, CubeletState>

	#cubeletsThatWillChange: ReadonlyArray<Group>

	#axis: Vector3

	#fullAngle: number

	constructor(private readonly visualizer: CubeVisualizer, private readonly stateChanged: CubeStateChanged, private readonly resolve: (value: void | PromiseLike<void>) => void) {

		this.#alreadyAngle = 0;

		this.#newStatesByInitialLocation = stateChanged.newState.cubelets.reduce((mm, cs) => mm.set(Utils.vectorId(cs.initialLocation), cs), new Map<string, CubeletState>());
		this.#cubeletsThatWillChange = stateChanged.oldState.cubelets.filter(cs => !cs.equals(this.#newStatesByInitialLocation.get(Utils.vectorId(cs.initialLocation))!)).map(cs => visualizer.cubelets.get(Utils.vectorId(cs.initialLocation))!);

		const move = this.stateChanged.move!;
		this.#axis = new Vector3(0, 0, 0).setComponent(move.face.dimension.index, move.face.positiveDirection ? 1 : -1);
		this.#fullAngle = move.angle * -1 * Math.PI / 2;

	}

	step(time: number, lastTime: number): boolean {

		const sinceLastTime = time - lastTime;

		const stepAngle = this.#fullAngle * (this.stateChanged.source?.animation === false ? 1 : sinceLastTime / this.visualizer.animationDuration);
		const dif = this.#fullAngle - this.#alreadyAngle;

		if (Math.abs(stepAngle) > Math.abs(dif)) {

			for (let cubelet of this.#cubeletsThatWillChange) {
				const initialLocation = Utils.vectorId(cubelet.userData[CubeVisualizer.INITIAL_LOCATION]);
				const newOrientation = this.#newStatesByInitialLocation.get(initialLocation)!.orientation;
				const newOrigin = this.#newStatesByInitialLocation.get(initialLocation)!.location;
				cubelet.setRotationFromMatrix(Utils.matrix4FromMatrix(newOrientation));
				cubelet.position.set(newOrigin.getX(), newOrigin.getY(), newOrigin.getZ());
			}

			this.resolve();

			return true;

		} else {

			const transformation = new Quaternion().setFromAxisAngle(this.#axis, stepAngle);
			this.#alreadyAngle += stepAngle;
			for (let cubelet of this.#cubeletsThatWillChange) {
				cubelet.applyQuaternion(transformation);
				cubelet.position.applyQuaternion(transformation);
			}

			return false;

		}

	}

}

export class BeamAnimation implements Animation {

	#alreadyOpacity: number

	#alreadySwitched: boolean

	#newStatesByInitialLocation: ReadonlyMap<string, CubeletState>

	constructor(private readonly visualizer: CubeVisualizer, private readonly stateChanged: CubeStateChanged, private readonly resolve: (value: void | PromiseLike<void>) => void) {

		this.#alreadyOpacity = -1;
		this.#alreadySwitched = false;

		this.#newStatesByInitialLocation = stateChanged.newState.cubelets.reduce((mm, cs) => mm.set(Utils.vectorId(cs.initialLocation), cs), new Map<string, CubeletState>());

	}

	step(time: number, lastTime: number): boolean {

		const sinceLastTime = time - lastTime;

		const stepOpacity = 2 * (this.stateChanged.source?.animation === false ? 1 : sinceLastTime / this.visualizer.animationDuration);
		const dif = 2 - this.#alreadyOpacity;

		if (this.#alreadyOpacity + stepOpacity > 0 && !this.#alreadySwitched) {
			for (let cubelet of this.visualizer.cubelets.values()) {
				const initialLocation = Utils.vectorId(cubelet.userData[CubeVisualizer.INITIAL_LOCATION]);
				const newOrientation = this.#newStatesByInitialLocation.get(initialLocation)!.orientation;
				const newOrigin = this.#newStatesByInitialLocation.get(initialLocation)!.location;
				cubelet.setRotationFromMatrix(Utils.matrix4FromMatrix(newOrientation));
				cubelet.position.set(newOrigin.getX(), newOrigin.getY(), newOrigin.getZ());
			}
			this.#alreadySwitched = true;
		}

		if (Math.abs(stepOpacity) > Math.abs(dif)) {

			this.visualizer.canvas.style.opacity = '1';

			this.resolve();

			return true;

		} else {

			this.#alreadyOpacity += stepOpacity;
			this.visualizer.canvas.style.opacity = Math.abs(this.#alreadyOpacity).toString();

			return false;

		}

	}

}