uniform float uTime;
uniform float uNoiseScale;
uniform float uNoiseStrength;
uniform vec2 uMousePosition;
uniform float uNoiseDetail;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying float vNoise;
varying vec3 vEyeVector;

// Импортируем функцию шума из noise.glsl
#include noise

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    
    // Создаем более сложный и детальный шум
    float mainNoise = cnoise(vec4(position * uNoiseScale, uTime * 0.15));
    float detailNoise = cnoise(vec4(position * uNoiseScale * uNoiseDetail, uTime * 0.1)) * 0.6;
    
    // Добавляем третий слой шума для более острых форм
    float sharpNoise = cnoise(vec4(position * uNoiseScale * 4.0, uTime * 0.05)) * 0.3;
    
    // Усиливаем влияние мыши для более заметной интерактивности
    vec3 mouseOffset = vec3(uMousePosition * 0.1, 0.0);
    float mouseNoise = cnoise(vec4(position * 2.0 + mouseOffset, uTime * 0.2)) * 0.4;
    
    // Комбинируем шумы с разными весами
    float finalNoise = mainNoise * 0.6 + detailNoise + sharpNoise + mouseNoise;
    
    // Добавляем нелинейность для более резких переходов
    finalNoise = pow(abs(finalNoise), 0.8) * sign(finalNoise);
    
    // Применяем усиленную деформацию
    vec3 newPosition = position + normal * finalNoise * uNoiseStrength;
    
    // Добавляем небольшое смещение по касательной для более интересной формы
    vec3 tangent = normalize(cross(normal, vec3(1.0, 0.0, 0.0)));
    newPosition += tangent * finalNoise * uNoiseStrength * 0.3;
    
    // Для эффекта свечения
    vec4 worldPosition = modelMatrix * vec4(newPosition, 1.0);
    vEyeVector = normalize(worldPosition.xyz - cameraPosition);
    
    vNoise = finalNoise;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
} 