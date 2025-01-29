import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import gsap from 'gsap';

class Scene {
    constructor() {
        // Кэшируем часто используемые значения
        this.windowWidth = window.innerWidth;
        this.windowHeight = window.innerHeight;
        this.aspectRatio = this.windowWidth / this.windowHeight;
        
        // Инициализация с оптимизированными параметрами
        this.init();
        this.setupScene();
        this.setupPostProcessing();
        this.addEventListeners();
        
        // Запускаем RAF с привязкой контекста
        this.boundAnimate = this.animate.bind(this);
        this.boundAnimate();
    }

    init() {
        // Оптимизированная инициализация сцены
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, this.aspectRatio, 0.1, 1000);
        this.camera.position.set(0, 0, 5);
        
        // Оптимизированные настройки рендерера
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Ограничиваем pixelRatio
        this.renderer.setSize(this.windowWidth, this.windowHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.5;
        document.body.appendChild(this.renderer.domElement);

        this.clock = new THREE.Clock();

        // Оптимизированные контролы
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableZoom = false;
        this.controls.enablePan = false;
        this.controls.enableDamping = true;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed *= 0.25;

        // Кэшируем параметры
        this.currentColorIndex = 0;
        this.params = {
            noiseScale: 0.4,
            noiseSpeed: 0.3,
            rotationSpeed: 0.1,
            colorSpeed: 0.2,
            bloomStrength: 2.2,
            distortionStrength: 0.4,
            particleCount: 6000,
            particleSize: 0.4,
            trailLength: 0.15
        };

        // Оптимизированные цвета (используем статический массив)
        this.colors = [
            new THREE.Color('#00ffff').multiplyScalar(2.0),
            new THREE.Color('#ff00ff').multiplyScalar(2.0),
            new THREE.Color('#ff0066').multiplyScalar(2.0),
            new THREE.Color('#00ff66').multiplyScalar(2.0),
            new THREE.Color('#6600ff').multiplyScalar(2.0),
            new THREE.Color('#ff3300').multiplyScalar(2.0)
        ];

        // Оптимизированные параметры частиц
        this.particleParams = {
            colorChangeSpeed: 2.0,
            currentColorIndex: 0,
            nextColorIndex: 1,
            transitionProgress: 0,
            trailLength: 0,
            trailPhase: 'appearing',
            maxTrailLength: 0.08,
            phasesDuration: {
                appearing: 1.5,
                full: 1.0,
                disappearing: 2.0
            }
        };

        // Кэшируем фоновый цвет
        this.backgroundColor = new THREE.Color(0x0a0a2a).multiplyScalar(1.5);
    }

    setupScene() {
        // Lights
        const light = new THREE.DirectionalLight(0xffffff, 1.75);
        light.position.setScalar(1);
        this.scene.add(light, new THREE.AmbientLight(0xffffff, 0.25));

        // Create main object
        this.createMainObject();
        
        // Create background
        this.createBackground();
    }

    createMainObject() {
        const geometry = new THREE.IcosahedronGeometry(0.8, 90); // Уменьшаем размер сферы
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                noiseScale: { value: this.params.noiseScale },
                distortionStrength: { value: this.params.distortionStrength },
                colorA: { value: this.colors[0] },
                colorB: { value: this.colors[1] },
                mousePosition: { value: new THREE.Vector2(0, 0) }
            },
            vertexShader: `
                uniform float time;
                uniform float noiseScale;
                uniform float distortionStrength;
                uniform vec2 mousePosition;
                
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying float vNoise;
                
                // Improved Perlin noise function
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
                vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

                float noise(vec3 P) {
                    vec3 i0 = mod289(floor(P));
                    vec3 i1 = mod289(i0 + vec3(1.0));
                    vec3 f0 = fract(P);
                    vec3 f1 = f0 - vec3(1.0);
                    vec3 f = fade(f0);
                    vec4 ix = vec4(i0.x, i1.x, i0.x, i1.x);
                    vec4 iy = vec4(i0.yy, i1.yy);
                    vec4 iz0 = i0.zzzz;
                    vec4 iz1 = i1.zzzz;
                    vec4 ixy = permute(permute(ix) + iy);
                    vec4 ixy0 = permute(ixy + iz0);
                    vec4 ixy1 = permute(ixy + iz1);
                    vec4 gx0 = ixy0 * (1.0 / 7.0);
                    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
                    gx0 = fract(gx0);
                    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
                    vec4 sz0 = step(gz0, vec4(0.0));
                    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
                    gy0 -= sz0 * (step(0.0, gy0) - 0.5);
                    vec4 gx1 = ixy1 * (1.0 / 7.0);
                    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
                    gx1 = fract(gx1);
                    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
                    vec4 sz1 = step(gz1, vec4(0.0));
                    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
                    gy1 -= sz1 * (step(0.0, gy1) - 0.5);
                    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
                    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
                    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
                    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
                    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
                    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
                    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
                    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
                    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
                    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
                    g000 *= norm0.x;
                    g010 *= norm0.y;
                    g100 *= norm0.z;
                    g110 *= norm0.w;
                    g001 *= norm1.x;
                    g011 *= norm1.y;
                    g101 *= norm1.z;
                    g111 *= norm1.w;
                    float n000 = dot(g000, f0);
                    float n100 = dot(g100, vec3(f1.x, f0.yz));
                    float n010 = dot(g010, vec3(f0.x, f1.y, f0.z));
                    float n110 = dot(g110, vec3(f1.xy, f0.z));
                    float n001 = dot(g001, vec3(f0.xy, f1.z));
                    float n101 = dot(g101, vec3(f1.x, f0.y, f1.z));
                    float n011 = dot(g011, vec3(f0.x, f1.yz));
                    float n111 = dot(g111, f1);
                    vec3 fade_xyz = fade(f0);
                    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
                    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
                    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
                    return 2.2 * n_xyz;
                }
                
                void main() {
                    vNormal = normal;
                    vPosition = position;
                    
                    // Создаем более сложную деформацию
                    float mainNoise = noise(position * noiseScale + time * 0.5);
                    float secondaryNoise = noise(position * noiseScale * 2.0 - time * 0.3);
                    
                    // Добавляем влияние позиции мыши
                    vec3 mouseInfluence = normalize(vec3(mousePosition.x, mousePosition.y, 0.0));
                    float mouseStrength = length(mousePosition) * 0.5;
                    
                    // Комбинируем все эффекты деформации
                    vec3 displacement = normal * (mainNoise * 0.7 + secondaryNoise * 0.3) * distortionStrength;
                    displacement += mouseInfluence * mouseStrength * distortionStrength;
                    
                    // Добавляем волновой эффект
                    float wave = sin(position.y * 4.0 + time) * 0.1;
                    displacement *= (1.0 + wave);
                    
                    vec3 newPosition = position + displacement;
                    
                    vNoise = mainNoise;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 colorA;
                uniform vec3 colorB;
                uniform float time;
                
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying float vNoise;
                
                void main() {
                    // Создаем более сложный градиент
                    vec3 color = mix(colorA, colorB, vPosition.y * 0.5 + 0.5);
                    
                    // Добавляем голографический эффект
                    float holographic = sin(vPosition.y * 20.0 + time * 2.0) * 0.1 + 0.9;
                    color *= holographic;
                    
                    // Усиливаем свечение по краям
                    vec3 viewDir = normalize(vPosition);
                    float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0);
                    color += fresnel * colorA * 0.8;
                    
                    // Добавляем шум для создания эффекта помех
                    float noise = fract(sin(dot(vPosition.xy, vec2(12.9898, 78.233))) * 43758.5453);
                    color += noise * 0.05;
                    
                    // Добавляем пульсацию
                    float pulse = sin(time * 0.5) * 0.5 + 0.5;
                    color *= 1.0 + pulse * 0.2;
                    
                    // Добавляем линии сканирования
                    float scanline = sin(vPosition.y * 100.0 + time * 5.0) * 0.02 + 0.98;
                    color *= scanline;
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        });

        this.object = new THREE.Mesh(geometry, material);
        this.scene.add(this.object);

        // Добавляем систему частиц
        this.addParticleSystem();
    }

    addParticleSystem() {
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = this.params.particleCount;
        const positions = new Float32Array(particleCount * 3);
        const scales = new Float32Array(particleCount);
        const colors = new Float32Array(particleCount * 3);

        for(let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const radius = 6;  // Увеличиваем радиус распределения частиц
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            scales[i] = (Math.random() * 0.5 + 0.5) * this.params.particleSize; // Более разнообразные размеры
            
            // Добавляем случайные базовые цвета для частиц с повышенной яркостью
            const color = this.colors[Math.floor(Math.random() * this.colors.length)];
            colors[i3] = color.r * 1.5;     // Увеличиваем яркость
            colors[i3 + 1] = color.g * 1.5;
            colors[i3 + 2] = color.b * 1.5;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particlesMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                baseColor: { value: new THREE.Color(0xffffff) },
                nextColor: { value: new THREE.Color(0xffffff) },
                mixRatio: { value: 0.0 },
                trailLength: { value: 0.0 }
            },
            vertexShader: `
                uniform float time;
                uniform float trailLength;
                
                attribute float scale;
                attribute vec3 color;
                
                varying float vScale;
                varying vec3 vColor;
                
                void main() {
                    vScale = scale;
                    vColor = color;
                    
                    vec3 pos = position;
                    
                    // Создаем более сложную анимацию движения
                    float wave = sin(time + position.x * 2.0) * cos(time * 0.5 + position.z);
                    float verticalWave = cos(time * 0.7 + position.y * 3.0);
                    
                    // Добавляем спиральное движение
                    float spiral = sin(time * 0.3 + length(position.xz) * 2.0);
                    
                    pos.x += wave * trailLength * sin(time * 0.7) + spiral * 0.3;
                    pos.y += verticalWave * trailLength * 0.5;
                    pos.z += cos(time * 0.5 + position.x) * trailLength * 0.7;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    
                    // Динамическое изменение размера
                    float sizeVariation = sin(time * 0.8 + position.x * 2.0) * 0.4 + 1.0;
                    gl_PointSize = scale * sizeVariation * (400.0 / -mvPosition.z);
                    
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 baseColor;
                uniform vec3 nextColor;
                uniform float mixRatio;
                
                varying float vScale;
                varying vec3 vColor;
                
                void main() {
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    float strength = 1.0 - smoothstep(0.0, 0.5, dist);
                    
                    float innerGlow = smoothstep(0.4, 0.0, dist);
                    
                    vec3 finalColor = mix(vColor, nextColor, mixRatio);
                    
                    // Уменьшаем пульсацию
                    float pulse = sin(time * 0.8 + vScale * 4.0) * 0.15 + 0.85;
                    float depth = smoothstep(0.0, 1.0, vScale);
                    
                    // Уменьшаем голографический эффект
                    vec3 holographic = 0.5 + 0.2 * cos(time * 0.5 + vScale * 10.0 + vec3(0, 2, 4));
                    finalColor = mix(finalColor, holographic, 0.1);
                    
                    // Уменьшаем мерцание
                    float flicker = sin(time * 5.0 + vScale * 10.0) * 0.02 + 0.98;
                    
                    float alpha = strength * depth * (0.2 + pulse * 0.3) * flicker;
                    alpha *= (1.0 + innerGlow * 0.2);
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
        this.scene.add(this.particles);

        this.startParticleColorTransition();
        this.startTrailAnimation();
    }

    startParticleColorTransition() {
        const p = this.particleParams;
        const currentColor = this.colors[p.currentColorIndex];
        const nextColor = this.colors[p.nextColorIndex];

        // Обновляем цвета в шейдере
        this.particles.material.uniforms.baseColor.value.copy(currentColor);
        this.particles.material.uniforms.nextColor.value.copy(nextColor);

        // Анимируем переход с помощью GSAP
        gsap.to(this.particles.material.uniforms.mixRatio, {
            value: 1,
            duration: p.colorChangeSpeed,
            ease: "power1.inOut",
            onComplete: () => {
                // После завершения перехода
                p.currentColorIndex = p.nextColorIndex;
                p.nextColorIndex = (p.nextColorIndex + 1) % this.colors.length;
                this.particles.material.uniforms.mixRatio.value = 0;
                this.particles.material.uniforms.baseColor.value.copy(this.colors[p.currentColorIndex]);
                this.particles.material.uniforms.nextColor.value.copy(this.colors[p.nextColorIndex]);
                
                // Запускаем следующий переход
                this.startParticleColorTransition();
            }
        });
    }

    startTrailAnimation() {
        const p = this.particleParams;
        
        gsap.to(this.particles.material.uniforms.trailLength, {
            value: p.maxTrailLength,
            duration: p.phasesDuration.appearing,
            ease: "power1.inOut",
            onComplete: () => {
                // Ждем 1 секунду перед началом исчезновения
                gsap.delayedCall(1.0, () => {
                    gsap.to(this.particles.material.uniforms.trailLength, {
                        value: 0,
                        duration: p.phasesDuration.disappearing,
                        ease: "power1.inOut",
                        onComplete: () => {
                            gsap.delayedCall(0.5, () => {
                                this.startTrailAnimation();
                            });
                        }
                    });
                });
            }
        });
    }

    createBackground() {
        this.rt = new THREE.WebGLRenderTarget(this.windowWidth, this.windowHeight);
        this.scene.background = this.backgroundColor;

        // Создаем сцену и камеру для фона
        this.backgroundScene = new THREE.Scene();
        this.backgroundCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);

        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                aspect: { value: this.aspectRatio },
                baseColor: { value: this.backgroundColor }
            },
            fragmentShader: `
                uniform float time;
                uniform float aspect;
                uniform vec3 baseColor;
                varying vec2 vUv;

                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }

                void main() {
                    vec2 uv = vUv;
                    uv.x *= aspect;
                    
                    vec3 color = baseColor;
                    
                    // Увеличиваем количество и яркость звезд
                    float stars = random(floor(uv * 200.0));  // Больше звезд
                    stars = pow(stars, 12.0) * 2.0;          // Ярче звезды
                    
                    // Делаем туманность более заметной
                    float nebula = random(uv + time * 0.1) * 0.8 + 0.2;
                    nebula *= smoothstep(1.0, 0.0, length(uv - vec2(0.5 * aspect, 0.5)));
                    
                    color += stars * 0.8;                    // Увеличиваем яркость звезд
                    color += nebula * vec3(0.3, 0.4, 0.6);  // Усиливаем цвет туманности
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        });

        const quad = new THREE.Mesh(geometry, material);
        this.backgroundScene.add(quad);
    }

    setupPostProcessing() {
        const renderScene = new RenderPass(this.scene, this.camera);
        
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.windowWidth, this.windowHeight),
            2.2,    // Увеличиваем силу свечения
            0.7,    // Увеличиваем радиус
            0.15    // Уменьшаем порог для более яркого свечения
        );
        this.composer.addPass(bloomPass);

        // Настраиваем кастомный шейдер с минимальными эффектами
        const customPass = new ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                time: { value: 0 },
                distortion: { value: 0.005 },    // Минимальное искажение
                chromaticAberration: { value: 0.001 }  // Минимальная хроматическая аберрация
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float time;
                uniform float distortion;
                uniform float chromaticAberration;
                
                varying vec2 vUv;
                
                void main() {
                    vec2 uv = vUv;
                    
                    // Минимальное искажение
                    float distortionX = sin(uv.y * 5.0 + time) * distortion;
                    uv.x += distortionX;
                    
                    // Минимальная хроматическая аберрация
                    vec4 cr = texture2D(tDiffuse, uv + vec2(chromaticAberration, 0.0));
                    vec4 cg = texture2D(tDiffuse, uv);
                    vec4 cb = texture2D(tDiffuse, uv - vec2(chromaticAberration, 0.0));
                    
                    // Убираем шум и scanlines, оставляем только цветовые эффекты
                    vec4 color = vec4(cr.r, cg.g, cb.b, 1.0);
                    
                    gl_FragColor = color;
                }
            `
        });
        
        this.composer.addPass(customPass);
    }

    createCubeMap() {
        const images = [];
        const size = 4;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");

        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, size, size);

            for (let j = 0; j < (size * size) / 2; j++) {
                ctx.fillStyle = Math.random() < 0.5 ? "#a8a9ad" : "#646464";
                ctx.fillRect(
                    Math.floor(Math.random() * size),
                    Math.floor(Math.random() * size),
                    2, 1
                );
            }
            images.push(canvas.toDataURL());
        }
        return new THREE.CubeTextureLoader().load(images);
    }

    addEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = this.aspectRatio;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.windowWidth, this.windowHeight);
            this.composer.setSize(this.windowWidth, this.windowHeight);
            this.rt.setSize(this.windowWidth, this.windowHeight);
        });

        // Добавляем интерактивность при движении мыши
        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX / this.windowWidth) * 2 - 1;
            const y = -(e.clientY / this.windowHeight) * 2 + 1;
            
            if (this.object && this.object.material.uniforms) {
                gsap.to(this.object.material.uniforms.mousePosition.value, {
                    x: x,
                    y: y,
                    duration: 1,
                    ease: "power2.out"
                });
            }
        });

        // Обновляем эффект клика
        window.addEventListener('click', () => {
            gsap.to(this.params, {
                distortionStrength: 2.0, // Увеличиваем максимальное искажение
                duration: 1.0,
                yoyo: true,
                repeat: 1,
                ease: "elastic.out(1, 0.3)",
                onUpdate: () => {
                    if (this.object && this.object.material.uniforms) {
                        // Добавляем дополнительную волну при клике
                        const time = this.clock.getElapsedTime();
                        const waveStrength = Math.sin(time * 2) * 0.5 + 1.5;
                        this.object.material.uniforms.distortionStrength.value = 
                            this.params.distortionStrength * waveStrength;
                    }
                }
            });
        });
    }

    animate() {
        requestAnimationFrame(this.boundAnimate);
        
        const time = this.clock.getElapsedTime();

        // Оптимизированное обновление контролов
        if (this.controls.enabled) {
            this.controls.update();
        }
        
        // Оптимизированное обновление объекта
        if (this.object?.material.uniforms) {
            const uniforms = this.object.material.uniforms;
            uniforms.time.value = time;
            
            // Оптимизированная волновая деформация
            const waveStrength = Math.sin(time * 0.8) * 0.3 + 0.7;
            uniforms.distortionStrength.value = this.params.distortionStrength * waveStrength;

            // Оптимизированная смена цветов
            if (this.colors?.length > 0) {
                const nextColorIndex = (this.currentColorIndex + 1) % this.colors.length;
                const mixFactor = (Math.sin(time * this.params.colorSpeed) + 1) * 0.5;
                
                if (uniforms.colorA && uniforms.colorB) {
                    const currentColor = this.colors[this.currentColorIndex];
                    const nextColor = this.colors[nextColorIndex];
                    
                    if (currentColor && nextColor) {
                        uniforms.colorA.value.lerpColors(currentColor, nextColor, mixFactor);
                        uniforms.colorB.value.copy(nextColor);
                    }
                }
            }
        }

        // Оптимизированное обновление частиц
        if (this.particles?.material.uniforms) {
            this.particles.material.uniforms.time.value = time;
            this.particles.rotation.y = time * 0.01;
            this.particles.rotation.z = time * 0.01;
        }

        // Оптимизированная пост-обработка
        this.composer.render();
    }
}

// Оптимизированная инициализация
document.addEventListener('DOMContentLoaded', () => {
    new Scene();
}, { once: true }); // Добавляем { once: true } для автоматического удаления слушателя 