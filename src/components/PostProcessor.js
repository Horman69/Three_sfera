import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

export class PostProcessor {
    constructor(scene, camera, renderer) {
        // Создаем композер для пост-обработки
        this.composer = new EffectComposer(renderer);
        
        // Добавляем базовый рендер-пасс
        this.renderPass = new RenderPass(scene, camera);
        this.composer.addPass(this.renderPass);
        
        // Настраиваем эффект свечения
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5,  // интенсивность свечения
            0.4,  // радиус свечения
            0.85  // порог яркости
        );
        
        // Добавляем эффект свечения в композер
        this.composer.addPass(this.bloomPass);
    }

    render() {
        // Рендерим сцену с эффектами
        this.composer.render();
    }

    onResize() {
        // Обновляем размеры при изменении окна
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }
} 