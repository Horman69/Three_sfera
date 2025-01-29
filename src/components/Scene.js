import * as THREE from 'three';
import { NoiseObject } from './NoiseObject';
import { PostProcessor } from './PostProcessor';
import gsap from 'gsap';

export class Scene {
    constructor() {
        // Инициализация основных компонентов
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        // Настройка рендерера
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.body.appendChild(this.renderer.domElement);

        // Настройка камеры
        this.camera.position.z = 5;

        // Создание объектов сцены
        this.noiseObject = new NoiseObject();
        this.scene.add(this.noiseObject.mesh);

        // Инициализация пост-процессинга
        this.postProcessor = new PostProcessor(this.scene, this.camera, this.renderer);

        // Привязка обработчиков событий
        this.bindEvents();
        
        // Запуск анимации
        this.animate();
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.postProcessor.onResize();
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Обновление объектов
        this.noiseObject.update();
        
        // Рендеринг с пост-процессингом
        this.postProcessor.render();
    }
} 