uniform vec3 uNeonColor;
uniform vec3 uBaseColor;
uniform float uTime;
uniform float uGlowStrength;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying float vNoise;
varying vec3 vEyeVector;

void main() {
    // Усиленное базовое освещение
    vec3 light = normalize(vec3(1.0, 1.0, 2.0));
    float diff = pow(dot(vNormal, light) * 0.5 + 0.5, 1.5); // Делаем освещение более контрастным
    
    // Более контрастный градиент основы
    float gradientMix = pow(vPosition.y * 0.5 + 0.5 + vNoise * 0.3, 1.2);
    vec3 baseColor = mix(uBaseColor, uNeonColor, gradientMix * 0.7);
    
    // Усиленное неоновое свечение
    float fresnel = pow(1.0 - dot(vNormal, -vEyeVector), 4.0);
    vec3 glowColor = mix(uBaseColor, uNeonColor, fresnel);
    
    // Более выраженная пульсация
    float pulse = sin(uTime * 0.2) * 0.5 + 0.5;
    glowColor *= 1.0 + pulse * 0.15;
    
    // Комбинируем цвета с более резкими переходами
    vec3 finalColor = baseColor * diff;
    finalColor += glowColor * fresnel * uGlowStrength * (1.0 + vNoise * 0.5);
    
    // Добавляем более яркое свечение на краях
    finalColor += pow(fresnel, 3.0) * uNeonColor * 1.5;
    
    // Усиливаем контраст финального цвета
    finalColor = pow(finalColor, vec3(1.1));
    
    gl_FragColor = vec4(finalColor, 1.0);
} 