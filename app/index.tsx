import { PressableScale } from "@/components/pressable-scale";
import { useTheme } from "@react-navigation/native";
import {
  Canvas,
  Group,
  Paragraph,
  Skia,
  TextAlign,
} from "@shopify/react-native-skia";
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

// Pick a bunch of common color emoji fonts so Skia can fallback correctly
const EMOJI_FONTS = [
  "Apple Color Emoji", // iOS
  "Noto Color Emoji", // Android
  "Segoe UI Emoji", // Windows
  "Twemoji Mozilla",
  "EmojiOne Color",
];

export default function Main() {
  const theme = useTheme();
  const [particles, setParticles] = useState<EmojiParticle[]>([]);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // cache paragraphs per (emoji, roundedSize) so we do not rebuild each frame
  const paragraphCache = useRef(
    new Map<string, ReturnType<typeof Skia.ParagraphBuilder.Make>["build"]>()
  );

  const getEmojiParagraph = (emoji: string, fontSize: number) => {
    // bucket sizes to reduce cache cardinality
    const rounded = Math.max(12, Math.round(fontSize / 2) * 2);
    const key = `${emoji}_${rounded}`;
    const cached = paragraphCache.current.get(key);
    if (cached) return cached;

    const pb = Skia.ParagraphBuilder.Make({
      textAlign: TextAlign.Center,
      maxLines: 1,
      ellipsis: "",
    });

    pb.pushStyle({
      // color is ignored for color emoji fonts, safe to keep
      color: Skia.Color("black"),
      fontFamilies: EMOJI_FONTS,
      fontSize: rounded,
    });
    pb.addText(emoji);
    const p = pb.build();
    paragraphCache.current.set(key, p);
    return p;
  };

  const createParticle = (
    x: number,
    y: number,
    emoji: string
  ): EmojiParticle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 100 + Math.random() * 400;
    const size = 20 + Math.random() * 30;

    return {
      id: Date.now() + Math.random() + Math.random() * 1000,
      emoji,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 150,
      size,
      opacity: 1,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 1,
      wobble: 0,
      wobbleSpeed: 1 + Math.random() * 2,
    };
  };

  const shootEmojis = (emoji: string) => {
    const centerX = screenWidth / 2;
    const centerY = screenHeight + 100;

    const newParticles: EmojiParticle[] = [];
    for (let i = 0; i < 50; i++)
      newParticles.push(createParticle(centerX, centerY, emoji));

    setParticles((prev) => [...prev, ...newParticles]);
  };

  const updateParticles = (deltaTime: number) => {
    setParticles((prev) =>
      prev
        .map((p) => {
          const buoyancy = -200;
          const airResistance = 0.991;
          const windEffect = Math.sin(Date.now() * 0.0005) * 20;
          const turbulence = (Math.random() - 0.5) * 30;

          p.vy += buoyancy * deltaTime;
          p.vx += (windEffect + turbulence) * deltaTime;

          p.vx *= airResistance;
          p.vy *= airResistance;

          p.x += p.vx * deltaTime;
          p.y += p.vy * deltaTime;

          p.rotation += p.rotationSpeed * deltaTime * 60;
          if (p.rotation > 360) p.rotation -= 360;
          if (p.rotation < 0) p.rotation += 360;

          p.wobble += p.wobbleSpeed * deltaTime * 30;
          const wobbleOffset = Math.sin(p.wobble * 0.05) * 2;
          p.x += wobbleOffset * deltaTime;

          const depthFactor = Math.max(0.1, p.size / 40);
          p.opacity = depthFactor;

          const off =
            p.y < -50 ||
            p.y > screenHeight + 50 ||
            p.x < -50 ||
            p.x > screenWidth + 50;
          if (off) p.opacity = Math.max(0, p.opacity - 0.05);

          return p;
        })
        .filter(
          (p) =>
            p.opacity > 0.1 &&
            p.y > -100 &&
            p.y < screenHeight + 100 &&
            p.x > -100 &&
            p.x < screenWidth + 100
        )
    );
  };

  const animate = (t: number) => {
    if (lastTimeRef.current === 0) lastTimeRef.current = t;
    const dt = (t - lastTimeRef.current) / 1000;
    lastTimeRef.current = t;

    if (particles.length > 0) updateParticles(dt);
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current != null)
        cancelAnimationFrame(animationRef.current);
    };
  }, [particles.length]);

  const Para = ({ particle }: { particle: EmojiParticle }) => {
    const depthScale = Math.max(0.6, 1.2 - (particle.y / screenHeight) * 0.6);
    const baseScale = particle.size / 25;
    const finalScale = baseScale * depthScale;

    const paragraph = Skia.ParagraphBuilder.Make()
      .pushStyle({
        fontSize: 25,
      })
      .addText(particle.emoji)
      .build();

    const centerX = particle.x;
    const centerY = particle.y;

    return (
      <Group
        transform={[
          { translateX: centerX },
          { translateY: centerY },
          { rotate: (particle.rotation * Math.PI) / 180 }, // convert degrees → radians
          { scale: finalScale },
          { translateX: -centerX },
          { translateY: -centerY },
        ]}
      >
        <Paragraph
          paragraph={paragraph}
          x={particle.x - (particle.size * depthScale) / 2}
          y={particle.y - (particle.size * depthScale) / 2}
          opacity={particle.opacity}
          width={screenWidth}
        />
      </Group>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.background} />

      {/* One full-screen Canvas for everything */}
      <Canvas style={StyleSheet.absoluteFill}>
        {particles.map((particle) => {
          return <Para key={particle.id} particle={particle} />;
        })}
      </Canvas>

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
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  background: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  instructions: {
    position: "absolute",
    zIndex: 1000,
    bottom: 100,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  instructionText: { fontSize: 16, textAlign: "center", marginBottom: 5 },
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
  emojiText: { fontSize: 24 },
});
