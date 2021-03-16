import { Scene } from 'three'
import { CubeSpecification, CubeState } from '@cube-codes/cube-codes-model'
import { CubeCamera } from './CubeCamera';
import { CubeRealisation } from './CubeRealisation';

export class CubeSituation {

	readonly scene: Scene

	readonly cubeRealisation: CubeRealisation

	readonly camera: CubeCamera

	constructor(readonly cubeSpec: CubeSpecification, readonly cubeState: CubeState, width: number, height: number) {

		this.scene = new Scene();

		this.cubeRealisation = new CubeRealisation(this.cubeSpec, this.cubeState);
		this.scene.add(...this.cubeRealisation.getCubelets());

		this.camera = new CubeCamera(this.cubeSpec, width, height);

	}

	setSize(width: number, height: number): void {
		this.camera.setSize(width, height);
	}

}