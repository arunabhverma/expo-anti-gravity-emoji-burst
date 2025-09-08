import { PressableScale } from "@/components/pressable-scale";
import { useTheme } from "@react-navigation/native";
import { Canvas, Group, Paragraph, Skia } from "@shopify/react-native-skia";
import Matter from "matter-js";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface EmojiParticle {
  id: number;
  emoji: string;
  body: Matter.Body;
  size: number;
  opacity: number;
  wobble: number;
  wobbleSpeed: number;
}

const EMOJIS = ["😂", "❤️", "🤣", "👍", "😍"];

export default function Main() {
  const theme = useTheme();
  const [particles, setParticles] = useState<EmojiParticle[]>([]);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const engineRef = useRef<Matter.Engine | null>(null);
  const worldRef = useRef<Matter.World | null>(null);

  const particlePool = useRef<EmojiParticle[]>([]);
  const maxPoolSize = 200;

  useEffect(() => {
    const engine = Matter.Engine.create();
    const world = engine.world;

    engine.gravity.y = 0.3;
    engine.timing.timeScale = 1.0;

    Matter.Events.on(engine, "collisionStart", (event) => {
      const pairs = event.pairs;
      pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        if (bodyA && bodyB) {
          const force = 0.1;
          Matter.Body.applyForce(bodyA, bodyA.position, {
            x: (Math.random() - 0.5) * force,
            y: (Math.random() - 0.5) * force,
          });
          Matter.Body.applyForce(bodyB, bodyB.position, {
            x: (Math.random() - 0.5) * force,
            y: (Math.random() - 0.5) * force,
          });
        }
      });
    });

    Matter.Events.on(engine, "afterUpdate", () => {});

    engineRef.current = engine;
    worldRef.current = world;

    return () => {
      Matter.Engine.clear(engine);
    };
  }, []);

  const createParticle = useCallback(
    (x: number, y: number, emoji: string): EmojiParticle => {
      if (!worldRef.current) return null as any;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      const size = 30 + Math.random() * 30;
      const airFriction = 0.02 + Math.random() * 0.03;
      const density = 0.0008 + Math.random() * 0.0004;
      const restitution = 0.2 + Math.random() * 0.2;
      const friction = 0.05 + Math.random() * 0.05;

      const body = Matter.Bodies.circle(x, y, size / 2, {
        restitution: restitution,
        friction: friction,
        frictionAir: airFriction,
        density: density,
        inertia: Infinity,
      });

      const velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed - 5,
      };
      Matter.Body.setVelocity(body, velocity);

      Matter.World.add(worldRef.current, body);

      return {
        id: Date.now() + Math.random() + Math.random() * 1000,
        emoji,
        body,
        size,
        opacity: 1,
        wobble: 0,
        wobbleSpeed: 1 + Math.random() * 2,
      };
    },
    []
  );

  const returnParticleToPool = useCallback((particle: EmojiParticle) => {
    if (particlePool.current.length < maxPoolSize) {
      particle.opacity = 1;
      particle.wobble = 0;
      particlePool.current.push(particle);
    }
  }, []);

  const shootEmojis = useCallback(
    (emoji: string) => {
      const centerX = screenWidth / 2;
      const centerY = screenHeight + 50;

      const newParticles: EmojiParticle[] = [];
      for (let i = 0; i < 10; i++) {
        const particle = createParticle(centerX, centerY, emoji);
        if (particle) {
          newParticles.push(particle);
        }
      }
      setParticles([...particles, ...newParticles]);
    },
    [createParticle, particles]
  );

  const processParticles = useCallback(
    (p: EmojiParticle, deltaTime: number) => {
      if (!p.body) return p;

      const windEffect = Math.sin(Date.now() * 0.0005) * 5;
      const turbulence = (Math.random() - 0.5) * 8;

      Matter.Body.applyForce(p.body, p.body.position, {
        x: (windEffect + turbulence) * deltaTime * 0.001,
        y: -120 * deltaTime * 0.001,
      });

      p.wobble += p.wobbleSpeed * deltaTime * 10;
      const wobbleOffset = Math.sin(p.wobble * 0.05) * 0.5;
      Matter.Body.translate(p.body, { x: wobbleOffset * deltaTime, y: 0 });

      const pos = p.body.position;
      const depthFactor = Math.max(0.1, p.size / 40);
      const distanceFromCenter = Math.sqrt(
        Math.pow(pos.x - screenWidth / 2, 2) +
          Math.pow(pos.y - screenHeight / 2, 2)
      );
      const maxDistance = Math.sqrt(
        Math.pow(screenWidth / 2, 2) + Math.pow(screenHeight / 2, 2)
      );
      const distanceOpacity = Math.max(
        0.1,
        1 - distanceFromCenter / maxDistance
      );

      p.opacity = Math.min(depthFactor, distanceOpacity);

      const off =
        pos.y < -100 ||
        pos.y > screenHeight + 100 ||
        pos.x < -100 ||
        pos.x > screenWidth + 100;
      if (off) p.opacity = Math.max(0, p.opacity - 0.02);

      return p;
    },
    []
  );

  const filterParticles = useCallback((p: EmojiParticle) => {
    if (!p.body) return false;
    const pos = p.body.position;
    return (
      p.opacity > 0.01 &&
      pos.y > -200 &&
      pos.y < screenHeight + 200 &&
      pos.x > -200 &&
      pos.x < screenWidth + 200
    );
  }, []);
  const updateParticles = useCallback(
    (deltaTime: number) => {
      if (!engineRef.current) return;

      const timeStep = Math.min(deltaTime * 1000, 16);
      Matter.Engine.update(engineRef.current, timeStep);

      setParticles((prev) => {
        if (prev.length === 0) return prev;

        const updatedParticles = prev.map((p) =>
          processParticles(p, deltaTime)
        );

        const { alive, dead } = updatedParticles.reduce(
          (acc, p) => {
            if (filterParticles(p)) {
              acc.alive.push(p);
            } else {
              acc.dead.push(p);
            }
            return acc;
          },
          { alive: [] as EmojiParticle[], dead: [] as EmojiParticle[] }
        );

        dead.forEach((p) => {
          if (p.body && worldRef.current) {
            Matter.World.remove(worldRef.current, p.body);
            returnParticleToPool(p);
          }
        });

        return alive;
      });
    },
    [filterParticles, processParticles, returnParticleToPool]
  );

  const animate = useCallback(
    (t: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = t;
      const dt = (t - lastTimeRef.current) / 1000;
      lastTimeRef.current = t;

      updateParticles(dt);
      animationRef.current = requestAnimationFrame(animate);
    },
    [updateParticles]
  );

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current != null)
        cancelAnimationFrame(animationRef.current);
    };
  }, [animate]);

  const emojiParagraphs = useMemo(() => {
    const paragraphs: { [key: string]: any } = {};
    EMOJIS.forEach((emoji) => {
      paragraphs[emoji] = Skia.ParagraphBuilder.Make()
        .pushStyle({
          fontSize: 25,
        })
        .addText(emoji)
        .build();
    });
    return paragraphs;
  }, []);

  const Para = ({ particle }: { particle: EmojiParticle }) => {
    const pos = particle.body?.position;
    const depthScale = pos
      ? Math.max(0.6, 1.2 - (pos.y / screenHeight) * 0.6)
      : 1;
    const baseScale = particle.size / 25;
    const finalScale = baseScale * depthScale;

    const paragraph = emojiParagraphs[particle.emoji];
    const centerX = pos?.x || 0;
    const centerY = pos?.y || 0;
    const rotation = particle.body?.angle || 0;

    const transform = useMemo(
      () => [
        { translateX: centerX },
        { translateY: centerY },
        { rotate: rotation },
        { scale: finalScale },
        { translateX: -centerX },
        { translateY: -centerY },
      ],
      [centerX, centerY, finalScale, rotation]
    );

    if (!pos || !particle.body || !paragraph) return null;

    return (
      <Group transform={transform}>
        <Paragraph
          paragraph={paragraph}
          x={pos.x - (particle.size * depthScale) / 2}
          y={pos.y - (particle.size * depthScale) / 2}
          opacity={particle.opacity}
          width={screenWidth}
        />
      </Group>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.background} />

      <Canvas style={StyleSheet.absoluteFill}>
        {particles.map((particle) => {
          return <Para key={particle.id} particle={particle} />;
        })}
      </Canvas>

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
