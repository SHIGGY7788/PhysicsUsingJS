'use strict'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import Stats from 'stats.js';


// Constants and Variables
var gravity = -9.807;
var ballMass = 40;
var ballCount = 1;
var oldCount = 1;
var active_balls = [];
var physics_balls = [];
var initialized = false;
var running = false;
var show_shadows = false;
var lightDebug = false;
var obj_movements = false;


const stats = new Stats();
const debugging = false;
// Physics World
const physicsWorld = new CANNON.World({
	gravity: new CANNON.Vec3(0, gravity, 0),
});
// Physics Base
const halfExtents = new CANNON.Vec3(15, 30, 20)
const physics_base = new CANNON.Body({
	type: CANNON.Body.STATIC,
	shape: new CANNON.Box(halfExtents)
})
// Physics Back Wall
const halfExtents_back_wall = new CANNON.Vec3(1, 30, 15)
const physics_back_wall = new CANNON.Body({
	type: CANNON.Body.STATIC,
	shape: new CANNON.Box(halfExtents_back_wall)
});
// Physics Front  Wall
const halfExtents_front_wall = new CANNON.Vec3(1, 35, 15)
const physics_front_wall = new CANNON.Body({
	type: CANNON.Body.STATIC,
	shape: new CANNON.Box(halfExtents_front_wall)
});
// Sloped Plane
const halfExtents_sloped = new CANNON.Vec3(15, 0.1, 10)
const sloped_plane = new CANNON.Body({
	type: CANNON.Body.STATIC,
	shape: new CANNON.Box(halfExtents_sloped),
});
const halfExtents_split = new CANNON.Vec3(0.1, 5, 5)
// Spliter planes physics ones
const splitplane_1 = new CANNON.Body({
	type: CANNON.Body.STATIC,
	shape: new CANNON.Box(halfExtents_split),
});
// Spliter planes physics two
const splitplane_2 = new CANNON.Body({
	type: CANNON.Body.STATIC,
	shape: new CANNON.Box(halfExtents_split),
});
//Left wall physics
const left_wall_physics = new CANNON.Body({
	type: CANNON.Body.STATIC,
	shape: new CANNON.Box(new CANNON.Vec3(1, 35, 4))
});
//Right wall physics
const right_wall_physics = new CANNON.Body({
	type: CANNON.Body.STATIC,
	shape: new CANNON.Box(new CANNON.Vec3(1, 35, 4))
});
// Sphere Body
const radius = 1.5;
for (let i = 0; i != ballCount; i++) {
	var height = 10;
	physics_balls[i] = new CANNON.Body({

		mass: ballMass,
		shape: new CANNON.Sphere(radius),
		position: new CANNON.Vec3(0, height, 0),
	});
	height++;
}
// Renderer
const renderer = new THREE.WebGLRenderer();
// Scene
const scene = new THREE.Scene();




const defaultLight = new THREE.AmbientLight(0x404040, 5000);
scene.add(defaultLight)


const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(-57, 47, 82);
const helper = new THREE.DirectionalLightHelper(light, 5);




// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
// Controls
const controls = new OrbitControls(camera, renderer.domElement);
console.log("ball mass: " + ballMass + "\n")
// Floor
const floor_geometry = new THREE.BoxGeometry(30, 60, 40);
const floor_material = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
const floor = new THREE.Mesh(floor_geometry, floor_material);
// Real Back wall
const back_wall_geometry = new THREE.BoxGeometry(2, 60, 30);
const back_wall_material = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
const back_wall = new THREE.Mesh(back_wall_geometry, back_wall_material);
// Real front  wall GLAS
const front_wall_geometry = new THREE.BoxGeometry(2, 70, 30);
const front_wall_material = new THREE.MeshPhysicalMaterial({
	roughness: 0,
	metalness: 0.4,
	transmission: 1
});
const front_wall = new THREE.Mesh(front_wall_geometry, front_wall_material);
//Side Walls glass
const side_wall_geometry = new THREE.BoxGeometry(2, 70, 8);
const side_wall_material = new THREE.MeshPhysicalMaterial({
	roughness: 0,
	metalness: 0.4,
	transmission: 1
});
const left_wall = new THREE.Mesh(side_wall_geometry, side_wall_material);
const right_wall = new THREE.Mesh(side_wall_geometry, side_wall_material);
//Global Sphere Varibales
const sphere_geometry = new THREE.SphereGeometry(1.5, 32, 16);
const sphere_material = new THREE.MeshPhysicalMaterial({
	roughness: 0,
	metalness: 0.7,
	color: 0xff0000,
});
//Setup Spheres
for (let i = 0; i != ballCount; i++) {
	active_balls[i] = new THREE.Mesh(sphere_geometry, sphere_material);
	active_balls[i].position.copy(physics_balls[i].interpolatedPosition);
};
// Plane
const plane_geometry = new THREE.PlaneGeometry(30, 20);
const plane_material = new THREE.MeshPhongMaterial({ color: 0xA9A9A9, side: THREE.DoubleSide });
const plane = new THREE.Mesh(plane_geometry, plane_material);
// Plane Wall Split 
const plane_wall_split_geometry = new THREE.PlaneGeometry(10, 10);
const plane_wall_split_material = new THREE.MeshLambertMaterial({ color: 0xA9A9A9, side: THREE.DoubleSide });
const plane_wall_split_1 = new THREE.Mesh(plane_wall_split_geometry, plane_wall_split_material);
const plane_wall_split_2 = new THREE.Mesh(plane_wall_split_geometry, plane_wall_split_material);
// Cannon Debugger wirht a red color
const cannonDebugger = new CannonDebugger(scene, physicsWorld, {
	color: 0xff0000,
});




// Axes Helper
const axesHelper = new THREE.AxesHelper(5);

function createGUI(gravity_slider, ball_mass_slider, ball_count_slider) {
	const gui = new GUI();
	const start_sim = {
		run: function () {
			initialized = true;
			console.log('Running simulation with gravity value: ' + gravity_slider.gravity);
			running = true;
			animate();
		},
	};
	const restart = {
		restart: function () {
			running = false;
			restartSimulation();
		}
	};
	const pause = {
		pause: function () {
			if (running) {
				running = false;
				scene_paused();
			}
			else {
				running = true;
				animate();
			}
		},
	};
	const reset_values = (
		{
			reset_values: function () {
				gui.reset();
			}
		}
	);
	const call_shadows = (
		{
			call_shadows: function () {
				console.log(camera.position)
				loadShadows();
			}

		}
	);
	const obj_debug = (
		{
			obj_debug: function () {
				if (obj_movements == false) {
					obj_movements = true;
					enable_obj_movement();
					console.log("Object movements enabled");
				} else {
					obj_movements = false;
					enable_obj_movement();
					console.log("Object movements disabled");
				}
				
			}
		}
	);
	const call_debug_lights = (
		{
			call_debug_lights: function () {
				debugLights();
			}
		}
	);

	gui.add(call_debug_lights, 'call_debug_lights');
	gui.add(obj_debug, 'obj_debug')
	gui.add(call_shadows, 'call_shadows');
	gui.add(reset_values, 'reset_values');
	gui.add(start_sim, 'run');
	gui.add(pause, 'pause');
	gui.add(restart, 'restart');
	gui.add(gravity_slider, 'gravity', -100, 0, 0.1).onChange(function (value) {
		// Update CANNON.World gravity when slider changes
		physicsWorld.gravity.set(0, value, 0);
	});
	gui.add(ball_mass_slider, 'ballMass', 0, 100, 1).onChange(function (value) {
		// Update sphere mass when slider changes
		for (let i = 0; i < physics_balls.length; i++) {
			physics_balls[i].mass = value;
		}

	});
	gui.add(ball_count_slider, 'ballCount', 1, 50, 1).onChange(function (value) {
		oldCount = ballCount;
		ballCount = value;
		changeBallCount();
	});
}
createGUI({ gravity }, { ballMass }, { ballCount });
function scene_paused() {
	if (!running) {
		controls.update();
		renderer.render(scene, camera);
	}
	requestAnimationFrame(scene_paused);
}
const timeStep = 1 / 60 // seconds
let lastCallTime
function animate() {
	stats.begin();



	for (let i = 0; i != ballCount; i++) {
		active_balls[i].position.copy(physics_balls[i].interpolatedPosition);
		active_balls[i].quaternion.copy(physics_balls[i].interpolatedQuaternion);
	};

	controls.update();
	renderer.render(scene, camera);
	if (debugging) {
		cannonDebugger.update();

	}
	if (running) {
		requestAnimationFrame(animate);
		const time = performance.now() / 1000 // seconds
		if (!lastCallTime) {
			physicsWorld.step(timeStep)
		} else {
			const dt = time - lastCallTime
			physicsWorld.step(timeStep, dt)
		}
		lastCallTime = time
	}
	if (obj_movements) {
		helpers.forEach((helper) => {
			helper.update();
		});
	}
	stats.end();
}

var height = 10;
function changeBallCount() {
	height = 10;
	for (let i = 0; i != oldCount; i++) {
		physicsWorld.removeBody(physics_balls[i]);
	}
	physics_balls.length = 0;

	for (let i = 0; i != ballCount; i++) {
		physics_balls[i] = new CANNON.Body({
			mass: ballMass,
			shape: new CANNON.Sphere(radius),
			position: new CANNON.Vec3(0, 0, 0),
		});
		physics_balls[i].position.set(0, height, 0)
		physics_balls[i].quaternion.setFromEuler(-Math.PI / 2, 0, 0);
		physicsWorld.addBody(physics_balls[i]);
		height += 4;
	}


	for (let i = 0; i != oldCount; i++) {
		scene.remove(active_balls[i]);
	}
	active_balls.length = 0;

	for (let i = 0; i != ballCount; i++) {
		active_balls[i] = new THREE.Mesh(sphere_geometry, sphere_material);
		active_balls[i].position.copy(physics_balls[i].position);
		scene.add(active_balls[i]);
	};

}

//Create a custom axis helper that extends threejs
class CustomAxisHelper extends THREE.Object3D {
	constructor(size) {
		super();
		const arrowSize = size * 2; // Increase the arrow size
		this.add(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), arrowSize, 0xff0000));
		this.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), arrowSize, 0x00ff00));
		this.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), arrowSize, 0x0000ff));
	}
}

const helpers = [];
function enable_obj_movement() {
	if (obj_movements == true) {
		// Add helpers to each three-js object in the scene
		scene.traverse((obj) => {
			if (obj.type === 'Mesh') {
				const helper = new THREE.BoxHelper(obj, 0xffa500);
				helper.visible = true;
				scene.add(helper);
				helpers.push(helper);



			}
			active_balls.forEach((ball) => {
				const helper = new CustomAxisHelper(3);
				helper.visible = true;
				helper.position.copy(ball.position); // Set the position of the helper to match the ball
				scene.add(helper);
				helpers.push(helper);
			});
		});
	}
	if (obj_movements == false) {
		helpers.forEach((helper) => {
			scene.remove(helper);
		});
		helpers.length = 0;
	}
}

function debugLights() {
	if (!lightDebug) {
		scene.add(helper)
		lightDebug = true;
	}
	else {
		scene.remove(helper)
		lightDebug = false;
	}
}

function loadShadows() {
	if (!show_shadows) {
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		scene.add(light);
		scene.remove(defaultLight);

		active_balls.forEach((ball) => {
			ball.castShadow = true;
			ball.receiveShadow = false;
		}
		);

		floor.receiveShadow = true;
		back_wall.receiveShadow = true;
		left_wall.receiveShadow = true;
		right_wall.receiveShadow = true;
		front_wall.receiveShadow = true;

		plane_wall_split_1.receiveShadow = true;
		plane_wall_split_2.receiveShadow = true;

		renderer.shadowMap.autoUpdate = true;
		console.log("Shadows enabled");
		show_shadows = true;
	}
	else {
		renderer.shadowMap.enabled = false;
		scene.remove(light);
		scene.add(defaultLight);
		active_balls.forEach((ball) => {
			ball.castShadow = false;
			ball.receiveShadow = false;
		}
		);
		floor.receiveShadow = false;
		back_wall.receiveShadow = false;
		left_wall.receiveShadow = false;
		right_wall.receiveShadow = false;
		front_wall.receiveShadow = false;

		plane_wall_split_1.receiveShadow = false;
		plane_wall_split_2.receiveShadow = false;
		console.log("Shadows disabled");
		show_shadows = false;
	}
}

function restartSimulation() {
	stats.begin()
	initialized = false;
	running = false;
	for (let i = 0; i != ballCount; i++) {
		physics_balls[i].velocity.set(0, 0, 0);
		physics_balls[i].angularVelocity.set(0, 0, 0);
		physics_balls[i].position.set(0, 10, 0)
		physics_balls[i].quaternion.setFromEuler(-Math.PI / 2, 0, 0);
		active_balls[i].position.copy(physics_balls[i].position);
		active_balls[i].quaternion.copy(physics_balls[i].quaternion);
		if (obj_movements) {
			helpers[i].update();
		}
	}
	stats.end()
	show_initial();
}

//Raycasting
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function onPointerMove( event ) {

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components

	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

function render() {
	console.log("rendering");
	// update the picking ray with the camera and pointer position
	raycaster.setFromCamera( pointer, camera );

	// calculate objects intersecting the picking ray
	const intersects = raycaster.intersectObjects( scene.children, false );

	for ( let i = 0; i < intersects.length; i ++ ) {
		console.log(intersects[ i ].object.name);
		intersects[ i ].object.material.color.set( 0xffa500 ); // Set color to orange

	}

	renderer.render( scene, camera );

}

document.addEventListener( 'pointermove', onPointerMove );

window.requestAnimationFrame(render);

function load() {
	stats.showPanel(0);
	document.body.appendChild(stats.dom)
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	camera.position.set(-63, 30, 85);
	controls.update();
	//CannonJS Floor
	physics_base.position.set(0, -45, 5);
	physicsWorld.addBody(physics_base);
	//CannonJS Back Wall
	physics_back_wall.position.set(0, -45, 24);
	physics_back_wall.quaternion.setFromEuler(0, 1.5708, 0);
	physicsWorld.addBody(physics_back_wall);
	//CannonJS Front Wall
	physics_front_wall.position.set(0, -40, 32);
	physics_front_wall.quaternion.setFromEuler(0, 1.5708, 0);
	physicsWorld.addBody(physics_front_wall);
	//CannonJS Sloped Plane
	sloped_plane.quaternion.setFromEuler(0.523599, 0, 0);
	sloped_plane.position.set(0, -10, 0);
	physicsWorld.addBody(sloped_plane);
	//CannonJS Split Planes
	splitplane_1.quaternion.setFromEuler(0, -0.785398, 0);
	splitplane_1.position.set(-7, -10, 18);
	splitplane_2.quaternion.setFromEuler(0, 0.785398, 0);
	splitplane_2.position.set(7, -10, 18);
	physicsWorld.addBody(splitplane_2);
	physicsWorld.addBody(splitplane_1);
	//CannonJS Left wall
	left_wall_physics.position.set(-15, -40, 28);
	physicsWorld.addBody(left_wall_physics);

	//CannonJS Right wall
	right_wall_physics.position.set(15, -40, 28);
	physicsWorld.addBody(right_wall_physics);

	for (let i = 0; i != ballCount; i++) {
		physics_balls[i].position.set(0, 10, 0)
		physics_balls[i].quaternion.setFromEuler(-Math.PI / 2, 0, 0);
		physicsWorld.addBody(physics_balls[i]);
	}
	//ThreeJS Floor
	floor.position.set(physics_base.position.x, physics_base.position.y, physics_base.position.z);
	scene.add(floor);

	//ThreeJS Back Wall
	back_wall.position.set(0, -45, 24);
	back_wall.rotateY(1.5708);
	scene.add(back_wall);
	//ThreeJS Left Wall
	left_wall.position.set(-15, -40, 28);
	scene.add(left_wall);
	//ThreeJS Right Wall
	right_wall.position.set(15, -40, 28);
	scene.add(right_wall);
	//ThreeJS Front  Wall
	front_wall.position.set(0, -40, 32);
	front_wall.rotateY(1.5708);
	scene.add(front_wall);
	//Sphere color Blue	
	for (let i = 0; i != ballCount; i++) {
		active_balls[i].position.copy(physics_balls[i].interpolatedPosition);
		active_balls[i].quaternion.copy(physics_balls[i].interpolatedQuaternion);
		scene.add(active_balls[i]);
	}
	//ThreeJS Plane
	plane.position.set(0, -10, 0)
	plane.rotateX(2.0944);
	scene.add(plane);
	//ThreeJS Front Split Walls
	plane_wall_split_1.position.set(7, -10, 18);
	plane_wall_split_1.rotateY(-0.785398);
	plane_wall_split_2.position.set(-7, -10, 18);
	plane_wall_split_2.rotateY(0.785398);
	scene.add(plane_wall_split_1);
	scene.add(plane_wall_split_2);
	//scene.add(axesHelper);
	if (debugging) {
		cannonDebugger.update();

	}
}
function show_initial() {
	stats.begin()
	controls.update()
	renderer.render(scene, camera);
	if (debugging) {
		cannonDebugger.update();
	}
	if (!initialized) {
		setTimeout(show_initial, 10)
	}
	stats.end()
}
show_initial()
load()
