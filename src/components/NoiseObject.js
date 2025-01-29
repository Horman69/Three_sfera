import * as THREE from 'three';
import vertexShader from '../shaders/vertex.glsl';
import fragmentShader from '../shaders/fragment.glsl';
import noiseShader from '../shaders/noise.glsl';
import gsap from 'gsap';

export class NoiseObject {
    constructor() {
        // Увеличиваем детализацию для более четких форм
        this.geometry = new THREE.IcosahedronGeometry(2, 96);
        
        // Создаем материал с улучшенными шейдерами
        this.material = new THREE.ShaderMaterial({
            vertexShader: vertexShader.replace('#include noise', noiseShader),
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uNoiseScale: { value: 1.2 },     // Увеличиваем масштаб шума
                uNoiseStrength: { value: 0.35 },  // Усиливаем деформацию
                uNeonColor: { value: new THREE.Color('#ff3fff') },
                uBaseColor: { value: new THREE.Color('#2b0fff') },
                uGlowStrength: { value: 2.5 },    // Усиливаем свечение
                uMousePosition: { value: new THREE.Vector2(0, 0) },
                uNoiseDetail: { value: 2.5 }      // Добавляем контроль детализации шума
            }
        });

        // Создаем меш
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        
        // Начальная анимация
        this.mesh.rotation.x = Math.PI * 0.1;
        
        // Аудио анализатор для реакции на звук
        this.setupAudio();
        
        // Параметры анимации
        this.targetRotation = { x: Math.PI * 0.1, y: 0 };
        this.currentRotation = { x: Math.PI * 0.1, y: 0 };
        this.rotationSpeed = 0.0005;
        
        // Добавляем обработчики событий
        this.addEventListeners();
    }

    setupAudio() {
        // Создаем аудио контекст
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        
        // Запрашиваем доступ к микрофону
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                const source = this.audioContext.createMediaStreamSource(stream);
                source.connect(this.analyser);
            })
            .catch(err => console.log('Микрофон недоступен'));
    }

    addEventListeners() {
        // Плавное следование за мышью
        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;
            
            gsap.to(this.material.uniforms.uMousePosition.value, {
                x: x * 0.3,
                y: y * 0.3,
                duration: 2,
                ease: "power2.out"
            });
            
            // Плавный поворот к курсору
            this.targetRotation.x = y * 0.2;
            this.targetRotation.y = x * 0.2;
        });

        // Эффект при клике
        window.addEventListener('click', () => {
            gsap.to(this.material.uniforms.uNoiseStrength, {
                value: 0.25,
                duration: 1,
                yoyo: true,
                repeat: 1,
                ease: "elastic.out(1, 0.3)"
            });
        });
    }

    update() {
        // Очень медленное обновление времени для плавности
        this.material.uniforms.uTime.value += 0.001;
        
        // Сверхплавное вращение с инерцией
        this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.01;
        this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.01;
        
        // Добавляем постоянное медленное вращение
        this.currentRotation.y += this.rotationSpeed;
        
        // Применяем вращение
        this.mesh.rotation.x = this.currentRotation.x;
        this.mesh.rotation.y = this.currentRotation.y;
    }
} 