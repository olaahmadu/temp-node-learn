// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create ground plane
const planeGeometry = new THREE.PlaneGeometry(20, 20);
const planeMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x999999,
    side: THREE.DoubleSide
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI / 2;
scene.add(plane);

// Create ball
const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const ballMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.y = 0.5; // Place ball on top of plane
scene.add(ball);

// Enhanced lighting
const light = new THREE.PointLight(0xffffff, 1.5, 100);
light.position.set(0, 15, 10);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
scene.add(ambientLight);

// Set camera position
camera.position.set(0, 10, 15);
camera.lookAt(0, 0, 0);

// Movement variables
const speed = 0.15;
let velocity = {
    x: 0,
    z: 0
};
const friction = 0.98;

// Water simulation parameters
const waterLevel = 0.05;
const splashParticles = [];
const maxSplashParticles = 100;
const splashForce = 0.2;
const rippleSegments = 128; // Increased segments for smoother water

// Create water plane with more detail
const waterGeometry = new THREE.PlaneGeometry(20, 20, rippleSegments, rippleSegments);
const waterMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x0066ff,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    shininess: 100,
    specular: 0x444444
});
const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.rotation.x = Math.PI / 2;
water.position.y = waterLevel;
scene.add(water);

// Update water vertices for wave effect
function updateWater() {
    const time = Date.now() * 0.001;
    const positions = waterGeometry.attributes.position;
    const ballImpact = 0.2; // Impact radius of ball on water
    
    for(let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        
        // Calculate distance from ball
        const dx = x - ball.position.x;
        const dz = z - ball.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // Create ripple effect around ball
        let ripple = 0;
        if(distance < 2) {
            ripple = Math.sin(distance * 5 - time * 5) * 
                     Math.exp(-distance * 1.5) * 
                     ballImpact;
        }
        
        // Add ambient waves
        const ambient = Math.sin(x * 0.5 + time) * 0.05 +
                       Math.sin(z * 0.5 + time * 1.2) * 0.05;
        
        // Combine effects
        const y = ripple + ambient;
        positions.setY(i, y);
    }
    
    positions.needsUpdate = true;
}

// Modify splash particle creation
function createSplashParticle(x, z) {
    const particleGeometry = new THREE.SphereGeometry(0.03, 8, 8);
    const particleMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x0066ff,
        transparent: true,
        opacity: 0.6,
        shininess: 80
    });
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    particle.position.set(x, waterLevel, z);
    
    // More realistic splash trajectory
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * splashForce;
    particle.velocity = {
        x: Math.cos(angle) * speed,
        y: Math.random() * splashForce * 1.5, // Higher vertical splash
        z: Math.sin(angle) * speed
    };
    
    particle.lifetime = 40 + Math.random() * 20;
    scene.add(particle);
    splashParticles.push(particle);
}

// Update splash particles
function updateSplashParticles() {
    for(let i = splashParticles.length - 1; i >= 0; i--) {
        const particle = splashParticles[i];
        
        particle.position.x += particle.velocity.x;
        particle.position.y += particle.velocity.y;
        particle.position.z += particle.velocity.z;
        
        particle.velocity.y -= 0.01;
        particle.lifetime--;
        
        if(particle.lifetime <= 0) {
            scene.remove(particle);
            splashParticles.splice(i, 1);
        }
    }
}

// Create splash effect
function createSplash(x, z, intensity) {
    const particleCount = Math.min(10, Math.floor(intensity * 20));
    for(let i = 0; i < particleCount; i++) {
        if(splashParticles.length < maxSplashParticles) {
            createSplashParticle(x, z);
        }
    }
}

// Environment parameters
const environmentBoxes = [];
const maxBoxes = 50;
const boxSpacing = 2;
const boxSize = 0.3;

// Create environment boxes
function createEnvironmentBox() {
    const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    const material = new THREE.MeshPhongMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.6,
        shininess: 90
    });
    const box = new THREE.Mesh(geometry, material);
    box.position.y = 2;
    box.targetPosition = new THREE.Vector3();
    box.velocity = new THREE.Vector3();
    scene.add(box);
    environmentBoxes.push(box);
}

// Initialize environment boxes
for(let i = 0; i < maxBoxes; i++) {
    createEnvironmentBox();
}

// Update environment boxes
function updateEnvironmentBoxes() {
    const time = Date.now() * 0.001;
    const mousePosition = new THREE.Vector3(ball.position.x, 2, ball.position.z);
    
    environmentBoxes.forEach((box, index) => {
        // Calculate target position in a circular pattern around the ball
        const angle = (index / maxBoxes) * Math.PI * 2 + time;
        const radius = 3 + Math.sin(time + index * 0.1) * 0.5;
        
        box.targetPosition.x = mousePosition.x + Math.cos(angle) * radius;
        box.targetPosition.z = mousePosition.z + Math.sin(angle) * radius;
        box.targetPosition.y = 2 + Math.sin(time + index * 0.2) * 0.3;
        
        // Smooth movement
        box.velocity.x += (box.targetPosition.x - box.position.x) * 0.05;
        box.velocity.y += (box.targetPosition.y - box.position.y) * 0.05;
        box.velocity.z += (box.targetPosition.z - box.position.z) * 0.05;
        
        // Apply velocity with damping
        box.velocity.multiplyScalar(0.95);
        box.position.add(box.velocity);
        
        // Rotate boxes
        box.rotation.x = Math.sin(time + index) * 0.3;
        box.rotation.y = Math.cos(time + index * 0.5) * 0.3;
        
        // Update opacity based on movement
        const speed = box.velocity.length();
        box.material.opacity = 0.3 + speed * 0.5;
    });
}

// Modify the animate function
function animate() {
    requestAnimationFrame(animate);

    // Update ball position with velocity
    ball.position.x += velocity.x;
    ball.position.z += velocity.z;

    // Apply friction
    velocity.x *= friction;
    velocity.z *= friction;

    // Boundary checks
    if (ball.position.x < -9) ball.position.x = -9;
    if (ball.position.x > 9) ball.position.x = 9;
    if (ball.position.z < -9) ball.position.z = -9;
    if (ball.position.z > 9) ball.position.z = 9;

    // Update environment
    updateEnvironmentBoxes();

    // Enhanced water interaction
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
    if(speed > 0.01) {
        const splashCount = Math.ceil(speed * 10);
        for(let i = 0; i < splashCount; i++) {
            createSplash(
                ball.position.x + (Math.random() - 0.5) * 0.5,
                ball.position.z + (Math.random() - 0.5) * 0.5,
                speed
            );
        }
    }

    updateWater();
    updateSplashParticles();

    // Add rolling effect
    if (velocity.x !== 0 || velocity.z !== 0) {
        ball.rotation.x -= velocity.z * 0.2;
        ball.rotation.z += velocity.x * 0.2;
    }

    renderer.render(scene, camera);
}

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the game loop
animate();