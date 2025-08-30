# 🚀 Expo Anti-Gravity Emoji Burst

A mesmerizing React Native demo showcasing **anti-gravity particle physics** with emoji explosions! Tap emoji buttons to launch them skyward and watch them defy gravity with realistic physics simulation.

## Demo

Check out the reaction menu in action 👇:

| iOS                                                                                                                        |
|--------------------------------------------------------------------------------------------------------------------------------|
|<video src="https://github.com/user-attachments/assets/5a99bf60-1a8e-4d89-946b-5b89a1cb3c45" /> |

## ✨ What It Does

This interactive demo creates a captivating particle system where:

- **Emoji Particles**: Tap any emoji button (😂, ❤️, 🤣, 👍, 😍) to launch 50 particles skyward
- **Anti-Gravity Physics**: Particles experience buoyancy, air resistance, wind effects, and turbulence
- **Realistic Motion**: Each particle has unique velocity, rotation, wobble, and depth scaling
- **Smooth Animation**: 60fps animations using React Native Reanimated and Skia Canvas
- **Interactive UI**: PressableScale for tactile feedback

## 🔧 How It Works

The magic happens through several key components:

### Physics Engine

- **Buoyancy Force**: Negative gravity (-200) makes particles float upward
- **Air Resistance**: Gradual velocity decay (0.991 factor) for realistic motion
- **Wind Effects**: Sinusoidal wind patterns with random turbulence
- **Particle Properties**: Each emoji has position, velocity, rotation, opacity, and wobble

### Rendering System

- **Skia Canvas**: Hardware-accelerated rendering for smooth 60fps performance
- **Paragraph API**: Efficient emoji text rendering with transformations
- **Depth Scaling**: Particles appear smaller as they move away (depth illusion)
- **Opacity Fading**: Particles fade out when leaving screen boundaries

### Custom Components

- **PressableScale**: Reusable component with spring-based press animations
- **Particle System**: Efficient batch processing of 50+ simultaneous particles

## 🎨 Inspiration & Learning

This project was inspired by the YouTube tutorial: [**2D Game Physics with Matter.js, React Native Skia and Expo**](https://www.youtube.com/watch?v=fxxaOu6pLnU) by [Daniel Friyia](https://x.com/wa2goose/)

### Key Learning Points:

- **Advanced React Native Reanimated**: Worklet functions, shared values, and UI thread animations
- **Skia Integration**: Hardware-accelerated 2D graphics and text rendering
- **Physics Simulation**: Implementing realistic particle physics in React Native
- **Performance Optimization**: 60fps animations with hundreds of particles
- **Component Architecture**: Building reusable, animated UI components

### 🎯 Feel Free To:

- **Fork this repository** and build your own variations
- **Extract components** for use in your projects
- **Build libraries** based on this particle system
- **Learn and experiment** with the physics implementation
- **Create your own particle effects** using this as a foundation

### 📄 Attribution

If you use this code or build upon it, please give credit by linking back to this repository or mentioning the inspiration.

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Submit pull requests with enhancements
- Share your own variations and experiments

## 📚 Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [React Native Skia](https://shopify.github.io/react-native-skia/)
- [Original Tutorial](https://www.youtube.com/watch?v=fxxaOu6pLnU)

---

**Happy coding! 🎉** Build something amazing with these particle physics techniques!
