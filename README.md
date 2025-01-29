# Abstract Star 3D

An interactive 3D visualization created with Three.js featuring a dynamic sphere with particle effects, holographic animations, and responsive mouse interactions.

![Abstract Star 3D Preview](preview.gif)

## Features

- Interactive 3D sphere with dynamic deformations
- Particle system with color transitions and trails
- Holographic effects and bloom post-processing
- Mouse interaction and click effects
- Responsive design
- Optimized performance

## Live Demo

[View Live Demo](https://horman69.github.io/Three_sfera/)

## Technologies Used

- Three.js
- GSAP (GreenSock Animation Platform)
- WebGL
- Custom GLSL Shaders

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Horman69/Three_sfera.git
cd Three_sfera
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
Three_sfera/
├── src/
│   ├── main.js          # Main application code
│   └── style.css        # Styles
├── public/
│   └── index.html       # HTML template
├── package.json         # Project dependencies
└── README.md           # This file
```

## Features in Detail

### Sphere Visualization
- Dynamic mesh deformation using Perlin noise
- Smooth color transitions
- Interactive mouse effects
- Holographic surface details

### Particle System
- 6000+ particles with individual behaviors
- Trail effects with customizable length
- Color transitions synchronized with the main sphere
- Dynamic size variations

### Post-Processing
- Bloom effect for enhanced glow
- Chromatic aberration
- Custom distortion effects
- Optimized render pipeline

### Performance Optimizations
- Efficient shader calculations
- Cached uniform values
- Optimized render loop
- Memory management improvements

## Configuration

Key parameters can be adjusted in the `params` object:

```javascript
this.params = {
    noiseScale: 0.4,        // Scale of noise deformation
    noiseSpeed: 0.3,        // Speed of noise animation
    rotationSpeed: 0.1,     // Auto-rotation speed
    colorSpeed: 0.2,        // Color transition speed
    bloomStrength: 2.2,     // Intensity of glow effect
    distortionStrength: 0.4,// Mesh distortion amount
    particleCount: 6000,    // Number of particles
    particleSize: 0.4,      // Base size of particles
    trailLength: 0.15       // Length of particle trails
};
```

## Controls

- **Mouse Move**: Interacts with the sphere's surface
- **Click**: Triggers a wave distortion effect
- **Auto-rotation**: Continuous smooth rotation of the scene

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

Requires WebGL 2.0 support.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Three.js community for their excellent documentation and examples
- GSAP team for the animation library
- Contributors and testers

## Author

Horman69

## Contact

- GitHub: [@Horman69](https://github.com/Horman69)

## Support

If you found this project helpful, please give it a ⭐️! 
