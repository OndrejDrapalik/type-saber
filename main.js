import * as THREE from 'three';

class TypeSaber {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cubes = [];
        this.currentInput = '';
        this.score = 0;
        this.gameStarted = false;
        
        // Game settings
        this.cubeSpeed = 0.5; // Extremely fast movement for intense challenge
        this.spawnDistance = -80; // Spawn much further away
        this.destroyDistance = 12;
        this.lanes = [-6, -2, 2, 6]; // 4 lanes for cubes to travel in
        
        // Hit zone settings
        this.hitZoneCenter = -2; // Z position of hit circles (further into the field)
        this.hitZoneRadius = 3.0; // Larger radius of hit circles
        this.perfectZoneRadius = 1.2; // Larger radius of perfect zone
        this.hitZoneTolerance = 6; // Much larger tolerance so cubes turn red earlier
        
        // Letter bank for the game (home row keys)
        this.letterBank = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
        
        this.init();
        this.setupEventListeners();
    }

    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000511); // Darker blue background

        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 2, 10);

        // Create renderer
        const canvas = document.getElementById('canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.fog = new THREE.Fog(0x000511, 30, 100);

        // Add lights
        this.setupLighting();
        
        // Create Beat Saber-style environment
        this.createEnvironment();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupLighting() {
        // Ambient light (dimmer for more dramatic effect)
        const ambientLight = new THREE.AmbientLight(0x202040, 0.2);
        this.scene.add(ambientLight);

        // Main directional light (cooler tone)
        const directionalLight = new THREE.DirectionalLight(0x8888ff, 0.6);
        directionalLight.position.set(0, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Neon accent lights (Beat Saber style)
        const neonLight1 = new THREE.PointLight(0x00ffff, 1, 30);
        neonLight1.position.set(-8, 3, -10);
        this.scene.add(neonLight1);

        const neonLight2 = new THREE.PointLight(0xff0080, 1, 30);
        neonLight2.position.set(8, 3, -10);
        this.scene.add(neonLight2);

        // Side strip lights
        const stripLight1 = new THREE.PointLight(0x0080ff, 0.8, 50);
        stripLight1.position.set(-15, 0, 0);
        this.scene.add(stripLight1);

        const stripLight2 = new THREE.PointLight(0xff4000, 0.8, 50);
        stripLight2.position.set(15, 0, 0);
        this.scene.add(stripLight2);
    }

    createEnvironment() {
        // Create a grid floor/platform like Beat Saber
        const gridSize = 100;
        const divisions = 50;
        
        // Create grid helper
        const gridHelper = new THREE.GridHelper(gridSize, divisions, 0x00ffff, 0x004455);
        gridHelper.position.y = -5;
        this.scene.add(gridHelper);
        
        // Create side platforms
        const platformGeometry = new THREE.BoxGeometry(4, 0.5, 200);
        const platformMaterial = new THREE.MeshPhongMaterial({
            color: 0x001122,
            emissive: 0x002244,
            transparent: true,
            opacity: 0.8
        });
        
        const leftPlatform = new THREE.Mesh(platformGeometry, platformMaterial);
        leftPlatform.position.set(-12, -4, -50);
        this.scene.add(leftPlatform);
        
        const rightPlatform = new THREE.Mesh(platformGeometry, platformMaterial);
        rightPlatform.position.set(12, -4, -50);
        this.scene.add(rightPlatform);
        
        // Create lane dividers/guides
        this.lanes.forEach((laneX, index) => {
            const lineGeometry = new THREE.BoxGeometry(0.1, 0.1, 200);
            const lineMaterial = new THREE.MeshPhongMaterial({
                color: 0x00ffff,
                emissive: 0x004488,
                transparent: true,
                opacity: 0.6
            });
            
            const laneLine = new THREE.Mesh(lineGeometry, lineMaterial);
            laneLine.position.set(laneX, -3, -50);
            this.scene.add(laneLine);
        });
        
        // Add some background particles/stars
        this.createStarField();
        
        // Create hit zone visual indicators
        this.createHitZone();
    }

    createStarField() {
        const starGeometry = new THREE.BufferGeometry();
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5,
            transparent: true,
            opacity: 0.8
        });

        const starVertices = [];
        for (let i = 0; i < 1000; i++) {
            const x = (Math.random() - 0.5) * 400;
            const y = (Math.random() - 0.5) * 200;
            const z = -Math.random() * 300 - 50;
            starVertices.push(x, y, z);
        }

        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);
    }

    createHitZone() {
        // Hit zone is now invisible - only the cube color change indicates when to hit
        // This creates a cleaner visual experience focused on the cubes themselves
    }

    createCube() {
        // Create cube geometry and material
        const geometry = new THREE.BoxGeometry(2.5, 2.5, 2.5);
        const originalHue = Math.random();
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(originalHue, 0.8, 0.7),
            transparent: true,
            opacity: 0.95,
            emissive: new THREE.Color().setHSL(originalHue, 0.5, 0.1) // Add glow
        });
        
        const cube = new THREE.Mesh(geometry, material);
        
        // Position cube in a lane far away
        const laneIndex = Math.floor(Math.random() * this.lanes.length);
        const lane = this.lanes[laneIndex];
        cube.position.set(
            lane, // X position in predetermined lane
            (Math.random() - 0.5) * 6, // Y position with some variation
            this.spawnDistance // Z position far away
        );
        
        // No rotation for better text readability
        cube.rotation.set(0, 0, 0);
        
        // Store lane info and original color
        cube.userData.lane = laneIndex;
        cube.userData.originalHue = originalHue;
        
        // Assign random letter
        cube.userData.letter = this.letterBank[Math.floor(Math.random() * this.letterBank.length)];
        cube.userData.targetLetter = cube.userData.letter;
        
        // Create text sprite for the letter
        cube.userData.textSprite = this.createTextSprite(cube.userData.letter);
        cube.add(cube.userData.textSprite);
        cube.userData.textSprite.position.set(0, 3.5, 0);
        
        cube.castShadow = true;
        cube.receiveShadow = true;
        
        this.scene.add(cube);
        this.cubes.push(cube);
        
        return cube;
    }

    createTextSprite(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
        
        context.fillStyle = 'rgba(0, 0, 0, 0)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add text stroke for better visibility
        context.font = 'Bold 48px Arial';
        context.strokeStyle = '#000000';
        context.lineWidth = 4;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.strokeText(text, canvas.width / 2, canvas.height / 2);
        
        context.fillStyle = '#ffffff';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            alphaTest: 0.1
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(4, 1, 1); // Much larger text
        
        return sprite;
    }

    setupEventListeners() {
        const startButton = document.getElementById('startButton');
        startButton.addEventListener('click', () => this.startGame());

        // Handle keyboard input
        document.addEventListener('keydown', (event) => {
            if (!this.gameStarted) return;
            
            if (event.key.length === 1 && /[a-zA-Z]/.test(event.key)) {
                const pressedLetter = event.key.toUpperCase();
                this.checkLetterInput(pressedLetter);
            }
        });
    }

    startGame() {
        this.gameStarted = true;
        document.getElementById('instructions').classList.add('hidden');
        document.getElementById('ui').classList.remove('hidden');
        
        // Create initial cubes with staggered timing
        for (let i = 0; i < 3; i++) {
            setTimeout(() => this.createCube(), i * 2000);
        }
        
        // Start game loop
        this.animate();
        
        // Spawn new cubes periodically
        this.spawnInterval = setInterval(() => {
            if (this.cubes.length < 5) {
                this.createCube();
            }
        }, 3000);
    }

    checkLetterInput(pressedLetter) {
        // Find the closest matching cube with the pressed letter IN THE HIT CIRCLES
        let targetCube = null;
        let closestDistance = Infinity;
        let hitType = 'MISS';
        
        this.cubes.forEach(cube => {
            if (cube.userData.letter === pressedLetter) {
                const cubeX = cube.position.x;
                const cubeZ = cube.position.z;
                
                // Check if cube is near the hit zone Z position
                const zDistance = Math.abs(cubeZ - this.hitZoneCenter);
                if (zDistance <= this.hitZoneTolerance) {
                    
                    // Find which lane this cube is in
                    const laneIndex = cube.userData.lane;
                    const laneX = this.lanes[laneIndex];
                    
                    // Check if cube is within the circular hit zone for its lane
                    const xDistance = Math.abs(cubeX - laneX);
                    const distanceFromLaneCenter = Math.sqrt(xDistance * xDistance + zDistance * zDistance);
                    
                    if (distanceFromLaneCenter <= this.hitZoneRadius) {
                        if (distanceFromLaneCenter < closestDistance) {
                            closestDistance = distanceFromLaneCenter;
                            targetCube = cube;
                            
                            // Determine hit quality based on distance from perfect center
                            if (distanceFromLaneCenter <= this.perfectZoneRadius) {
                                hitType = 'PERFECT';
                            } else {
                                hitType = 'HIT';
                            }
                        }
                    }
                }
            }
        });
        
        if (targetCube) {
            this.destroyCube(targetCube);
            
            // Score based on hit quality
            let points = 0;
            switch (hitType) {
                case 'PERFECT':
                    points = 20;
                    break;
                case 'HIT':
                    points = 10;
                    break;
            }
            
            this.score += points;
            this.updateScore();
            this.updateInputDisplay(`${pressedLetter} - ${hitType}! +${points}`);
            
            // Clear the hit message after a short delay
            setTimeout(() => {
                this.updateInputDisplay('Hit cubes in the circles!');
            }, 800);
        } else {
            // Check if there was a matching cube but outside hit circles
            const anyMatchingCube = this.cubes.find(cube => cube.userData.letter === pressedLetter);
            
            if (anyMatchingCube) {
                this.score = Math.max(0, this.score - 2);
                this.updateScore();
                this.updateInputDisplay(`${pressedLetter} - OUTSIDE CIRCLE! -2`);
            } else {
                this.score = Math.max(0, this.score - 2);
                this.updateScore();
                this.updateInputDisplay(`${pressedLetter} - NO TARGET! -2`);
            }
            
            // Clear the miss message after a short delay
            setTimeout(() => {
                this.updateInputDisplay('Hit cubes in the circles!');
            }, 800);
        }
    }

    updateInputDisplay(message = 'Hit cubes in the circles!') {
        const inputDisplay = document.getElementById('inputDisplay');
        inputDisplay.textContent = message;
    }

    destroyCube(cube) {
        // Create destruction effect
        this.createExplosionEffect(cube.position);
        
        // Remove cube from scene and array
        this.scene.remove(cube);
        const index = this.cubes.indexOf(cube);
        if (index > -1) {
            this.cubes.splice(index, 1);
        }
        
        // Dispose of geometry and material
        cube.geometry.dispose();
        cube.material.dispose();
        if (cube.userData.textSprite) {
            cube.userData.textSprite.material.map.dispose();
            cube.userData.textSprite.material.dispose();
        }
    }

    createExplosionEffect(position) {
        const particles = new THREE.Group();
        
        for (let i = 0; i < 20; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(Math.random(), 1, 0.5)
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            particle.position.copy(position);
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
            );
            
            particles.add(particle);
        }
        
        this.scene.add(particles);
        
        // Animate particles
        const animateParticles = () => {
            particles.children.forEach(particle => {
                particle.position.add(particle.userData.velocity);
                particle.userData.velocity.multiplyScalar(0.95);
                particle.material.opacity -= 0.02;
            });
            
            if (particles.children[0].material.opacity > 0) {
                requestAnimationFrame(animateParticles);
            } else {
                this.scene.remove(particles);
                particles.children.forEach(particle => {
                    particle.geometry.dispose();
                    particle.material.dispose();
                });
            }
        };
        
        animateParticles();
    }

    updateScore() {
        document.getElementById('score').textContent = `Score: ${this.score}`;
    }

    animate() {
        if (!this.gameStarted) return;
        
        requestAnimationFrame(() => this.animate());
        
        // Animate cubes moving toward player
        this.cubes.forEach(cube => {
            // Move cubes toward camera at consistent speed
            cube.position.z += this.cubeSpeed;
            
            // Check if cube is in hit zone and change color accordingly
            const cubeX = cube.position.x;
            const cubeZ = cube.position.z;
            const zDistance = Math.abs(cubeZ - this.hitZoneCenter);
            
            // Only turn red if cube is in the actual hit zone for its lane
            if (zDistance <= this.hitZoneTolerance) {
                const laneIndex = cube.userData.lane;
                const laneX = this.lanes[laneIndex];
                const xDistance = Math.abs(cubeX - laneX);
                const distanceFromLaneCenter = Math.sqrt(xDistance * xDistance + zDistance * zDistance);
                
                // Only turn red if within the circular hit zone radius
                if (distanceFromLaneCenter <= this.hitZoneRadius) {
                    // Cube is in hit zone - turn it red
                    cube.material.color.setHex(0xff0000);
                    cube.material.emissive.setHex(0x660000);
                } else {
                    // Cube is outside hit zone - use original color
                    cube.material.color.setHSL(cube.userData.originalHue, 0.8, 0.6);
                    cube.material.emissive.setHex(0x000000);
                }
            } else {
                // Cube is outside hit zone - use original color
                cube.material.color.setHSL(cube.userData.originalHue, 0.8, 0.6);
                cube.material.emissive.setHex(0x000000);
            }
            
            // Remove cubes that are too close (player missed them)
            if (cube.position.z > this.destroyDistance) {
                this.destroyCube(cube);
                // Optional: subtract points for missed cubes
                this.score = Math.max(0, this.score - 5);
                this.updateScore();
            }
        });
        
        // Update current target display (show closest cube letter)
        let closestCube = null;
        let closestDistance = Infinity;
        
        this.cubes.forEach(cube => {
            const distance = cube.position.z;
            if (distance < closestDistance) {
                closestDistance = distance;
                closestCube = cube;
            }
        });
        
        if (closestCube) {
            document.getElementById('currentWord').textContent = `Next: ${closestCube.userData.letter}`;
        } else {
            document.getElementById('currentWord').textContent = 'Next: -';
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new TypeSaber();
});