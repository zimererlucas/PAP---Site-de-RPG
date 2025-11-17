/* ============================================
   CONFIGURAÇÃO PRINCIPAL
   ============================================ */
const CONFIG = {
    quality: 'cine', // 'light' | 'cine'
    mode: 'auto',    // 'mouse' | 'auto'
    
    profiles: {
        light: {
            stars: 2000,
            nebulaClouds: 8,
            nebulaParticles: 400,
            pixelRatio: 1
        },
        cine: {
            stars: 5000,
            nebulaClouds: 15,
            nebulaParticles: 800,
            pixelRatio: Math.min(window.devicePixelRatio, 2)
        }
    },
    
    // VELOCIDADES AJUSTÁVEIS
    speeds: {
        stars: 0.01,      // Reduzido de 0.3 para 0.08 (73% mais lento)
        clouds: 0.1,    // Reduzido de 0.09 para 0.024 (73% mais lento)
        cloudRotation: 0.00003 // Reduzido de 0.0001 para 0.00003 (70% mais lento)
    }
};

/* ============================================
   VERIFICAÇÃO WEBGL
   ============================================ */
function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
                 (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch(e) {
        return false;
    }
}

// Aguardar carregamento do DOM
window.addEventListener('DOMContentLoaded', function() {
    if (!checkWebGLSupport()) {
        document.getElementById('webgl-fallback').style.display = 'flex';
        document.getElementById('nebula-canvas').style.display = 'none';
        return;
    }
    
    initNebula();
});

/* ============================================
   INICIALIZAÇÃO PRINCIPAL
   ============================================ */
function initNebula() {
    const canvas = document.getElementById('nebula-canvas');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: CONFIG.quality === 'cine' });
    
    const profile = CONFIG.profiles[CONFIG.quality];
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(profile.pixelRatio);
    camera.position.z = 50;
    
    /* ============================================
       CRIAR TEXTURA DO CÍRCULO
       ============================================ */
    function createCircleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, Math.PI * 2); // Desenhar um círculo
        ctx.fill();
        return new THREE.CanvasTexture(canvas);
    }

    /* ============================================
       CRIAR ESTRELAS
       ============================================ */
    function createStars() {
        const starTexture = createCircleTexture();
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(profile.stars * 3);
        const colors = new Float32Array(profile.stars * 3);
        const sizes = new Float32Array(profile.stars);
        
        for (let i = 0; i < profile.stars; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 300;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 300;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 200;

            const color = new THREE.Color();
            color.setHSL(Math.random(), 0.2, 0.9);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            sizes[i] = Math.random() * 0.5 + 0.1;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 0.5,
            map: starTexture,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const stars = new THREE.Points(geometry, material);
        scene.add(stars);
        return stars;
    }
    
    /* ============================================
       CRIAR NÉBULAS
       ============================================ */
    function createNebulaClouds() {
        const clouds = [];
        const canvas2d = document.createElement('canvas');
        canvas2d.width = 128;
        canvas2d.height = 128;
        const ctx = canvas2d.getContext('2d');
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.3, 'rgba(255,255,255,0.6)');
        gradient.addColorStop(0.7, 'rgba(255,255,255,0.2)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        const texture = new THREE.CanvasTexture(canvas2d);
        
        for (let i = 0; i < profile.nebulaClouds; i++) {
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(profile.nebulaParticles * 3);
            const colors = new Float32Array(profile.nebulaParticles * 3);
            const sizes = new Float32Array(profile.nebulaParticles);
            
            const hues = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
            const baseHue = hues[Math.floor(Math.random() * hues.length)];
            
            for (let j = 0; j < profile.nebulaParticles; j++) {
                const radius = Math.random() * 30;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                
                positions[j * 3] = radius * Math.sin(phi) * Math.cos(theta) * 2;
                positions[j * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                positions[j * 3 + 2] = radius * Math.cos(phi) * 1.5;
                
                const color = new THREE.Color();
                color.setHSL(baseHue + Math.random() * 0.1 - 0.05, 0.8, 0.5);
                colors[j * 3] = color.r;
                colors[j * 3 + 1] = color.g;
                colors[j * 3 + 2] = color.b;
                
                sizes[j] = Math.random() * 1 + 0.2;
            }
            
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
            
            const material = new THREE.PointsMaterial({
                size: 1.5,
                map: texture,
                transparent: true,
                opacity: 0.15,
                vertexColors: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            
            const cloud = new THREE.Points(geometry, material);
            cloud.position.x = (Math.random() - 0.5) * 300;
            cloud.position.y = (Math.random() - 0.5) * 300;
            cloud.position.z = (Math.random() - 0.5) * 300;



            scene.add(cloud);
            clouds.push(cloud);
        }
        
        return clouds;
    }
    
    /* ============================================
       PARALLAX E INTERAÇÃO
       ============================================ */
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    
    document.addEventListener('mousemove', (event) => {
        mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.targetY = -(event.clientY / window.innerHeight) * 2 + 1;
    });
    
    document.addEventListener('touchmove', (event) => {
        if (event.touches.length > 0) {
            mouse.targetX = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
            mouse.targetY = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
        }
    });
    
    /* ============================================
       CRIAR ELEMENTOS
       ============================================ */
    const stars = createStars();
    const clouds = createNebulaClouds();
    
    /* ============================================
       LOOP DE ANIMAÇÃO
       ============================================ */
    function animate() {
        requestAnimationFrame(animate);
        
        // Parallax com mouse
        if (CONFIG.mode === 'mouse') {
            mouse.x += (mouse.targetX - mouse.x) * 0.05;
            mouse.y += (mouse.targetY - mouse.y) * 0.05;
            camera.rotation.y = mouse.x * 0.1;
            camera.rotation.x = mouse.y * 0.1;
        }
        
        // Modo auto (fly-in) - VELOCIDADES REDUZIDAS
        if (CONFIG.mode === 'auto') {
            const starPositions = stars.geometry.attributes.position.array;
            
            // Movimento das estrelas (mais lento)
            for (let i = 0; i < starPositions.length; i += 3) {
                starPositions[i + 2] += CONFIG.speeds.stars; // Agora 0.08 em vez de 0.3
                if (starPositions[i + 2] > 50) {
                    starPositions[i + 2] = -150 + Math.random() * 100;
                    starPositions[i] = (Math.random() - 0.5) * 300;
                    starPositions[i + 1] = (Math.random() - 0.5) * 300;
                }
            }
            stars.geometry.attributes.position.needsUpdate = true;
            
            // Movimento das nuvens (mais lento)
            clouds.forEach(cloud => {
                cloud.position.z += CONFIG.speeds.clouds; // Agora 0.024 em vez de 0.09
                if (cloud.position.z > 100) {
                    cloud.position.z = -200 + Math.random() * 100;
                    cloud.position.x = (Math.random() - 0.5) * 300;
                    cloud.position.y = (Math.random() - 0.5) * 300;
                }
                // Rotação mais lenta
                cloud.rotation.x += CONFIG.speeds.cloudRotation; // Agora 0.00003
                cloud.rotation.y += CONFIG.speeds.cloudRotation * 2; // Agora 0.00006
            });
        }
        
        renderer.render(scene, camera);
    }
    
    /* ============================================
       RESPONSIVIDADE
       ============================================ */
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    animate();
}