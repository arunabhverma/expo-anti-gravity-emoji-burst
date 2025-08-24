import { PressableScale } from "@/components/pressable-scale";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface EmojiParticle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  wobble: number;
  wobbleSpeed: number;
}

const EMOJIS = ["😂", "❤️", "🤣", "👍", "😍"];

export default function Main() {
  const theme = useTheme();
  const [particles, setParticles] = useState<EmojiParticle[]>([]);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const createParticle = (
    x: number,
    y: number,
    emoji: string
  ): EmojiParticle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 100 + Math.random() * 400;
    const size = 20 + Math.random() * 30;

    return {
      id: Date.now() + Math.random() + Math.random() * 1000, // More unique ID
      emoji: emoji,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 150, // Initial upward velocity
      size,
      opacity: 1,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 1, // Slower rotation speed
      wobble: 0,
      wobbleSpeed: 1 + Math.random() * 2, // Slower wobble frequency
    };
  };

  const shootEmojis = (emoji: string) => {
    // Create multiple particles from the bottom center
    const centerX = screenWidth / 2;
    const centerY = screenHeight + 100;

    const newParticles: EmojiParticle[] = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push(createParticle(centerX, centerY, emoji));
    }

    setParticles((prev) => {
      const updated = [...prev, ...newParticles];
      return updated;
    });
  };

  const updateParticles = (deltaTime: number) => {
    setParticles((prev) =>
      prev
        .map((particle) => {
          // More realistic balloon physics (slower)
          const buoyancy = -200; // Reduced upward force
          const airResistance = 0.991; // More air resistance (slower)
          const windEffect = Math.sin(Date.now() * 0.0005) * 20; // Slower, gentler wind
          const turbulence = (Math.random() - 0.5) * 30; // Reduced turbulence

          // Apply forces
          particle.vy += buoyancy * deltaTime;
          particle.vx += (windEffect + turbulence) * deltaTime;

          // Apply air resistance
          particle.vx *= airResistance;
          particle.vy *= airResistance;

          // Update position
          particle.x += particle.vx * deltaTime;
          particle.y += particle.vy * deltaTime;

          // Update rotation
          particle.rotation += particle.rotationSpeed * deltaTime * 60;
          if (particle.rotation > 360) particle.rotation -= 360;
          if (particle.rotation < 0) particle.rotation += 360;

          // Update wobble effect (slower)
          particle.wobble += particle.wobbleSpeed * deltaTime * 30;
          const wobbleOffset = Math.sin(particle.wobble * 0.05) * 2;

          // Add wobble to position
          particle.x += wobbleOffset * deltaTime;

          // 3D depth effect based on emoji size (larger = closer = more opaque)
          const depthFactor = Math.max(0.1, particle.size / 40);
          particle.opacity = depthFactor;

          // Additional fade when particles go beyond screen bounds
          const isOffScreen =
            particle.y < -50 ||
            particle.y > screenHeight + 50 ||
            particle.x < -50 ||
            particle.x > screenWidth + 50;

          if (isOffScreen) {
            particle.opacity = Math.max(0, particle.opacity - 0.05);
          }

          return particle;
        })
        .filter(
          (particle) =>
            particle.opacity > 0.1 &&
            particle.y > -100 &&
            particle.y < screenHeight + 100 &&
            particle.x > -100 &&
            particle.x < screenWidth + 100
        )
    );
  };

  const animate = (currentTime: number) => {
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = currentTime;
    }

    const deltaTime = (currentTime - lastTimeRef.current) / 1000;
    lastTimeRef.current = currentTime;

    if (particles.length > 0) {
      updateParticles(deltaTime);
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particles.length]);

  const EmojiParticleComponent = ({
    particle,
  }: {
    particle: EmojiParticle;
  }) => {
    // 3D depth effect - scale based on Y position (closer to bottom = larger)
    const depthScale = Math.max(0.6, 1.2 - (particle.y / screenHeight) * 0.6);
    const baseScale = particle.size / 25;
    const finalScale = baseScale * depthScale;

    return (
      <View
        style={{
          position: "absolute",
          left: particle.x - (particle.size * depthScale) / 2,
          top: particle.y - (particle.size * depthScale) / 2,
          opacity: particle.opacity,
          transform: [
            { scale: finalScale },
            { rotate: `${particle.rotation}deg` },
          ],
        }}
      >
        <Text style={{ fontSize: 25, textAlign: "center" }}>
          {particle.emoji}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background gradient effect */}
      <View style={styles.background} />

      {/* Floating particles */}
      {particles.map((particle) => (
        <EmojiParticleComponent key={particle.id} particle={particle} />
      ))}

      {/* Emoji Selection Bar */}
      <View style={styles.emojiBar}>
        {EMOJIS.map((emoji) => (
          <PressableScale
            key={emoji}
            style={[
              styles.emojiButton,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => shootEmojis(emoji)}
          >
            <Text style={styles.emojiText}>{emoji}</Text>
          </PressableScale>
        ))}
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text
          style={[
            styles.instructionText,
            { color: theme.colors.text, opacity: 0.7 },
          ]}
        >
          Tap an emoji to blast it skyward.
        </Text>
        <Text
          style={[
            styles.instructionText,
            { color: theme.colors.text, opacity: 0.7 },
          ]}
        >
          Watch them defy gravity and float away...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  instructions: {
    position: "absolute",
    zIndex: 1000,
    bottom: 100,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 5,
  },
  emojiBar: {
    position: "absolute",
    bottom: 200,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 15,
  },
  emojiButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  emojiText: {
    fontSize: 24,
  },
});
