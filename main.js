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
        
        // Word bank for the game
        this.wordBank = [
            'FIRE', 'WATER', 'EARTH', 'AIR', 'LIGHT', 'DARK',
            'SWORD', 'MAGIC', 'POWER', 'SPEED', 'FORCE', 'ENERGY',
            'CRYSTAL', 'DIAMOND', 'GOLD', 'SILVER', 'COPPER', 'IRON',
            'THUNDER', 'LIGHTNING', 'STORM', 'WIND', 'RAIN', 'SNOW',
            'DRAGON', 'PHOENIX', 'TIGER', 'WOLF', 'EAGLE', 'LION',
            'NINJA', 'SAMURAI', 'WARRIOR', 'MAGE', 'ARCHER', 'KNIGHT'
        ];
        
        this.init();
        this.setupEventListeners();
    }

    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 10);

        // Create renderer
        const canvas = document.getElementById('canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Add lights
        this.setupLighting();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Point lights for atmosphere
        const pointLight1 = new THREE.PointLight(0x00ff00, 0.5, 50);
        pointLight1.position.set(-10, 5, 0);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xff0000, 0.5, 50);
        pointLight2.position.set(10, -5, 0);
        this.scene.add(pointLight2);
    }

    createCube() {
        // Create cube geometry and material
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
            transparent: true,
            opacity: 0.9
        });
        
        const cube = new THREE.Mesh(geometry, material);
        
        // Position cube randomly
        cube.position.set(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
        );
        
        // Add rotation
        cube.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        // Add rotation speed
        cube.userData.rotationSpeed = {
            x: (Math.random() - 0.5) * 0.02,
            y: (Math.random() - 0.5) * 0.02,
            z: (Math.random() - 0.5) * 0.02
        };
        
        // Assign random word
        cube.userData.word = this.wordBank[Math.floor(Math.random() * this.wordBank.length)];
        cube.userData.targetWord = cube.userData.word;
        
        // Create text sprite for the word
        cube.userData.textSprite = this.createTextSprite(cube.userData.word);
        cube.add(cube.userData.textSprite);
        cube.userData.textSprite.position.set(0, 2, 0);
        
        cube.castShadow = true;
        cube.receiveShadow = true;
        
        this.scene.add(cube);
        this.cubes.push(cube);
        
        return cube;
    }

    createTextSprite(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = 'rgba(0, 0, 0, 0)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = 'Bold 24px Arial';
        context.fillStyle = '#ffffff';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(2, 0.5, 1);
        
        return sprite;
    }

    setupEventListeners() {
        const startButton = document.getElementById('startButton');
        startButton.addEventListener('click', () => this.startGame());

        // Handle keyboard input
        document.addEventListener('keydown', (event) => {
            if (!this.gameStarted) return;
            
            if (event.key === 'Backspace') {
                this.currentInput = this.currentInput.slice(0, -1);
            } else if (event.key === 'Enter') {
                this.checkInput();
            } else if (event.key.length === 1 && /[a-zA-Z]/.test(event.key)) {
                this.currentInput += event.key.toUpperCase();
            }
            
            this.updateInputDisplay();
            this.checkInput();
        });
    }

    startGame() {
        this.gameStarted = true;
        document.getElementById('instructions').classList.add('hidden');
        document.getElementById('ui').classList.remove('hidden');
        
        // Create initial cubes
        for (let i = 0; i < 5; i++) {
            setTimeout(() => this.createCube(), i * 1000);
        }
        
        // Start game loop
        this.animate();
        
        // Spawn new cubes periodically
        this.spawnInterval = setInterval(() => {
            if (this.cubes.length < 8) {
                this.createCube();
            }
        }, 3000);
    }

    updateInputDisplay() {
        const inputDisplay = document.getElementById('inputDisplay');
        inputDisplay.textContent = this.currentInput || 'Type here...';
        
        // Highlight matching cubes
        this.cubes.forEach(cube => {
            if (cube.userData.word.startsWith(this.currentInput) && this.currentInput.length > 0) {
                cube.material.color.setHex(0x00ff00);
                cube.material.emissive.setHex(0x004400);
            } else {
                cube.material.color.setHSL(Math.random(), 0.8, 0.6);
                cube.material.emissive.setHex(0x000000);
            }
        });
    }

    checkInput() {
        if (this.currentInput.length === 0) return;
        
        // Find matching cube
        const matchingCube = this.cubes.find(cube => 
            cube.userData.word === this.currentInput
        );
        
        if (matchingCube) {
            this.destroyCube(matchingCube);
            this.currentInput = '';
            this.score += 10;
            this.updateScore();
        }
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
        
        // Rotate cubes
        this.cubes.forEach(cube => {
            cube.rotation.x += cube.userData.rotationSpeed.x;
            cube.rotation.y += cube.userData.rotationSpeed.y;
            cube.rotation.z += cube.userData.rotationSpeed.z;
            
            // Make cubes slowly move toward camera
            cube.position.z += 0.01;
            
            // Remove cubes that are too close
            if (cube.position.z > 15) {
                this.destroyCube(cube);
            }
        });
        
        // Update current target word display
        const targetCube = this.cubes.find(cube => 
            cube.userData.word.startsWith(this.currentInput) && this.currentInput.length > 0
        );
        
        if (targetCube) {
            document.getElementById('currentWord').textContent = `Target: ${targetCube.userData.word}`;
        } else {
            document.getElementById('currentWord').textContent = 'Target: -';
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