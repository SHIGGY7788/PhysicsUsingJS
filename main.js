'use strict'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import Stats from 'stats.js';

// Constants and Variables
var gravity = -9.807;
var ballMass = 5;
var ballCount = 1;
var active_balls = [];
var physics_balls = [];
let initialized = false;
let running = false;
const stats = new Stats();
const debugging = true;

// Physics World
const physicsWorld = new CANNON.World({
	gravity: new CANNON.Vec3(0, gravity, 0),
});

// Physics Base
const halfExtents = new CANNON.Vec3(15, 2, 20)
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
const halfExtents_sloped = new CANNON.Vec3(15, 0.1, 7.5)
const sloped_plane = new CANNON.Body({
	type: CANNON.Body.STATIC,
	shape: new CANNON.Box(halfExtents_sloped),
});

// Spliter planes physics ones
const splitplane_1 = new CANNON.Body({
	type: CANNON.Body.STATIC,
	shape: new CANNON.Plane(),
});

// Spliter planes physics two
const splitplane_2 = new CANNON.Body({
	type: CANNON.Body.STATIC,
	shape: new CANNON.Plane(),
});

// Sphere Body
const radius = 1;
for (let i = 0; i < ballCount; i++){
	var height = 0
	physics_balls[i] = new CANNON.Body({
		mass: ballMass,
		velocity: 0,
		shape: new CANNON.Sphere(radius),
		position: new CANNON.Vec3(0, 10, height),
	});
	height += 2;

}

// Renderer
const renderer = new THREE.WebGLRenderer();

// Scene
const scene = new THREE.Scene();

//Light
const light = new THREE.SpotLight(0xFFFFFF, 0.3);
light.position.set(0, 25, -10);
light.target.position.set(0, 0, 5);
light.isDirectionalLight = true;
light.castShadow = true;

scene.add( light );
const helper = new THREE.DirectionalLightHelper( light, 5 );
scene.add( helper );

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
console.log("ball mass: " + ballMass + "\n")

// Floor
const floor_geometry = new THREE.BoxGeometry(30, 4, 40);
const floor_material = new THREE.MeshBasicMaterial({ color: 'rgb(211,211,211)' });
const floor = new THREE.Mesh(floor_geometry, floor_material);

// Real Back wall
const back_wall_geometry = new THREE.BoxGeometry(2, 60, 30);
const back_wall_material = new THREE.MeshBasicMaterial({ color: 'rgb(211,211,211)' });
const back_wall = new THREE.Mesh(back_wall_geometry, back_wall_material);

// Real front  wall GLAS
const front_wall_geometry = new THREE.BoxGeometry(2, 70, 30);
const front_wall_material = new THREE.MeshPhysicalMaterial({
roughness: 0,
metalness: 0.5,
//color: 0xFFEA00,
transmission: 1
});
const front_wall = new THREE.Mesh(front_wall_geometry, front_wall_material);

//Side Walls glass
const side_wall_geometry = new THREE.BoxGeometry(2, 70, 8);
const side_wall_material = new THREE.MeshPhysicalMaterial({
	roughness: 0,
	metalness: 0.5,
	transmission: 1
});
const left_wall = new THREE.Mesh(side_wall_geometry, side_wall_material);	
const right_wall = new THREE.Mesh(side_wall_geometry, side_wall_material);	

//Global Sphere Varibales
const sphere_geometry = new THREE.SphereGeometry(1, 32, 16);
const wireframe = new THREE.WireframeGeometry(sphere_geometry);

//Setup Spheres
for (let i = 0; i < ballCount; i++) {
	active_balls[i] = new THREE.LineSegments(sphere_geometry, wireframe);

};

// Plane
const plane_geometry = new THREE.PlaneGeometry(30, 20);
const plane_material = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
const plane = new THREE.Mesh(plane_geometry, plane_material);

// Plane Wall Split 
const plane_wall_split_1_geometry = new THREE.PlaneGeometry(10, 10);
const plane_wall_split_1_material = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
const plane_wall_split_1 = new THREE.Mesh(plane_wall_split_1_geometry, plane_wall_split_1_material);
const plane_wall_split_2_geometry = new THREE.PlaneGeometry(10, 10);
const plane_wall_split_2_material = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
const plane_wall_split_2 = new THREE.Mesh(plane_wall_split_2_geometry, plane_wall_split_2_material);

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

	
	gui.add(reset_values, 'reset_values');
	gui.add(start_sim, 'run');
	gui.add(pause, 'pause');
	gui.add(restart, 'restart');
	gui.add(gravity_slider, 'gravity', -100, 0, 1).onChange(function (value) {
		// Update CANNON.World gravity when slider changes
		physicsWorld.gravity.set(0, value, 0);
	});

	gui.add(ball_mass_slider, 'ballMass', 0, 100, 1).onChange(function (value) {
		// Update sphere mass when slider changes
		for(let i = 0; i < physics_balls.length ;i++){
			physics_balls[i].mass = value;
		}
		
	});

	gui.add(ball_count_slider, 'ballCount', 1, 50, 1).onChange(function (value) {
		ballCount = value;
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

function animate() {
	stats.begin();
	for (let i = 0; i < ballCount; i++) {
		active_balls[i].position.copy(physics_balls[i].position);
		active_balls[i].quaternion.copy(physics_balls[i].quaternion);
	};
	
	physicsWorld.step(1 / 60);
	controls.update();
	renderer.render(scene, camera);
	if (debugging === true){
		cannonDebugger.update();
	
	}
	if (running) {
		requestAnimationFrame(animate);
	}
	stats.end();
}

function restartSimulation() {
	stats.begin()
	initialized = false;
	running = false;

	for (let i = 0; i < ballCount; i++) {
		height = 0
		physics_balls[i].position.set(0, 10, height)
		height += 2;
		active_balls[i].position.copy(physics_balls[i].position);
		active_balls[i].quaternion.copy(physics_balls[i].quaternion);
		physics_balls[i].velocity.set(0, 0, 0);
		physics_balls[i].angularVelocity.set(0, 0, 0);
	}

	stats.end()
	show_initial();
}

function load() {
	stats.showPanel(0);
	document.body.appendChild(stats.dom)
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	camera.position.set(0, 0, 0);
	controls.update();

	//CannonJS Floor
	physics_base.position.set(0, -15, 5);
	physicsWorld.addBody(physics_base);

	//CannonJS Back Wall
	physics_back_wall.position.set(0, -45, 24);
	physics_back_wall.quaternion.setFromEuler(0, 1.5708, 0);
	physicsWorld.addBody(physics_back_wall);

	//CannonJS Front Wall
	physics_front_wall.position.set(0, -40, 32);
	physics_front_wall.quaternion.setFromEuler(0, 1.5708, 0);
	physicsWorld.addBody(physics_front_wall);

	//CannonJS Plane
	sloped_plane.quaternion.setFromEuler(0.523599, 0, 0);
	sloped_plane.position.set(0, -10, 0);
	physicsWorld.addBody(sloped_plane);

	//CannonJS Split Planes
	splitplane_1.quaternion.setFromEuler(0, 560.125, 0);
	splitplane_1.position.set(-5, -10, 18);

	splitplane_2.quaternion.setFromEuler(0, -560.3, 0);
	splitplane_2.position.set(5, -10, 18);

	physicsWorld.addBody(splitplane_2);
	physicsWorld.addBody(splitplane_1);

	for (let i = 0; i < ballCount; i++) {
		height = 0
		physics_balls[i].position.set(0, 10, height)
		physicsWorld.addBody(physics_balls[i]);
		height += 2;
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
	const sphere_color_1 = new THREE.Color(0x0000ff);

	for (let i = 0; i < ballCount; i++) {
		active_balls[i].material.depthTest = true;
		active_balls[i].material.opacity = 0.5;
		active_balls[i].material.transparent = false;
		active_balls[i].position.copy(physics_balls[i].position);
		active_balls[i].material.color = sphere_color_1;
		scene.add(active_balls[i]);

	}

	//ThreeJS Plane
	plane.position.set(0, -10, 0)
	plane.rotateX(2.0944);
	scene.add(plane);

	//ThreeJS Front Split Walls
	plane_wall_split_1.position.set(5, -10, 18);
	plane_wall_split_1.rotateY(90);
	plane_wall_split_2.position.set(-5, -10, 18);
	plane_wall_split_2.rotateY(180);
	scene.add(plane_wall_split_1);
	scene.add(plane_wall_split_2);

	scene.add(axesHelper);
	camera.position.z = 50;
	if (debugging === true){
		cannonDebugger.update();
	
	}
}

function show_initial() {
	stats.begin()
	controls.update()
	renderer.render(scene, camera);
	if (debugging === true){
		cannonDebugger.update();
	}
	if (!initialized) {
		setTimeout(show_initial, 10)
	}
	stats.end()
}

show_initial()
load()