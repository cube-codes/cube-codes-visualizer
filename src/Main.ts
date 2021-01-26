import { Scene, PerspectiveCamera, LineSegments,Quaternion,Vector3, Group, Color, LineBasicMaterial, EdgesGeometry, WebGLRenderer, BoxGeometry, MeshBasicMaterial, Mesh } from 'Three'

export function run() {

	const scene = new Scene();
	scene.background = new Color(0xffffff);
	const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

	const renderer = new WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	window.document.body.appendChild(renderer.domElement);

	const geometry = new BoxGeometry(1, 1, 1);
	var cubeMaterials = [
		new MeshBasicMaterial({ color: 0xba0c2f }),
		new MeshBasicMaterial({ color: 0x009a44 }),
		new MeshBasicMaterial({ color: 0x003da5 }),
		new MeshBasicMaterial({ color: 0xfe5000 }),
		new MeshBasicMaterial({ color: 0xffd700 }),
		new MeshBasicMaterial({ color: 0xffffff })
	];
	const cube = new Mesh(geometry, cubeMaterials);

	const edges = new EdgesGeometry(geometry)
	const edges_material = new LineBasicMaterial({ color: 0x000000 })
	const e = new LineSegments(edges, edges_material)

	const group = new Group();
	group.add(cube);
	group.add(e);
	scene.add(group)

	camera.position.z = 5;

	const animate = function () {
		window.requestAnimationFrame(animate);

		var q = new Quaternion();
		let axis = new Vector3(1, 0, 0)
		let angle = 0.05
		let point = new Vector3(2, 1, 0)
	
			q.setFromAxisAngle( axis, angle );
	
			group.applyQuaternion( q );
	
			group.position.sub( point );
			group.position.applyQuaternion( q );
			group.position.add( point );
	

		renderer.render(scene, camera);
	};

	animate();

}