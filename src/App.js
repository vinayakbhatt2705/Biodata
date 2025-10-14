// App.js
import React, { useState, useEffect } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import "./App.css";

// -------------------- Typewriter Sound --------------------
function playKeySound() {
  const audio = new Audio("/sounds/key.mp3"); // your key.mp3
  audio.volume = 0.4; 
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

// -------------------- TypewriterText Component --------------------
function TypewriterText({ text, speed = 50, onComplete }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    let timeoutId;

    const tick = () => {
      if (i >= text.length) {
        if (onComplete) onComplete();
        return;
      }

      const char = text[i];
      setDisplayed((prev) => prev + char);

      if (char.trim() !== "") playKeySound();

      i++;
      timeoutId = setTimeout(tick, speed);
    };

    timeoutId = setTimeout(tick, speed);

    return () => clearTimeout(timeoutId);
  }, [text, speed, onComplete]);

  return <span>{displayed}</span>;
}

// -------------------- Planet Components --------------------
function Planet({ texturePath, size = 1, distance = 5, orbitSpeed = 0.01, selfRotate = 0.01 }) {
  const meshRef = React.useRef();
  const map = useLoader(THREE.TextureLoader, texturePath);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * orbitSpeed;
    if (meshRef.current) {
      meshRef.current.position.x = distance * Math.cos(t);
      meshRef.current.position.z = distance * Math.sin(t);
      meshRef.current.rotation.y += selfRotate;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[size, 64, 64]} />
      <meshStandardMaterial map={map} />
    </mesh>
  );
}

function Earth({ distance = 8, orbitSpeed = 0.02 }) {
  const groupRef = React.useRef();
  const earthMap = useLoader(THREE.TextureLoader, "/textures/earth_day.jpg");
  const moonMap = useLoader(THREE.TextureLoader, "/textures/moon.jpg");
  const moonRef = React.useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * orbitSpeed;
    if (groupRef.current) {
      groupRef.current.position.x = distance * Math.cos(t);
      groupRef.current.position.z = distance * Math.sin(t);
      if (groupRef.current.children[0]) groupRef.current.children[0].rotation.y += 0.01;
    }
    if (moonRef.current) {
      moonRef.current.position.x = 2.8 * Math.cos(t * 2.2);
      moonRef.current.position.z = 2.8 * Math.sin(t * 2.2);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[1.2, 64, 64]} />
        <meshStandardMaterial map={earthMap} />
      </mesh>
      <mesh ref={moonRef}>
        <sphereGeometry args={[0.36, 32, 32]} />
        <meshStandardMaterial map={moonMap} />
      </mesh>
    </group>
  );
}

// -------------------- Main App --------------------
export default function App() {
  const biodataLines = [
    "Vinayak Bhatt",
    "Advocate, Bombay High Court",
    "Domain: Criminal / Civil / Family",
    "Phone: 9833730722",
    "Email: vinayakbhatt2705@gmail.com",
    "College: New Law College",
    "Percentage: 60.3",
    "CGPA: 7.7",
    "University: Mumbai University",
    "Relavant Experience: Divorce Case 13B, Issuing Notices, Drafting",
    "Other Experience: Software Industry Functional Consultant, Project Managers Post"
  ];

  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  const sunMap = useLoader(THREE.TextureLoader, "/textures/sun.jpg");

  // -------------------- Read biodata with female voice --------------------
  useEffect(() => {
    if (currentLineIndex === biodataLines.length) {
      // create full text with "Subject: " first
      let textToSpeak = "Subject: Is  Lawyer ";

      biodataLines.forEach((line) => {
        if (line.startsWith("Phone:")) {
          const digits = line.split(":")[1].trim().split("").join(" ");
          textToSpeak += `Phone number: ${digits}. `;
        } else {
          textToSpeak += `${line}. `;
        }
      });

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1;
      utterance.pitch = 1.05;

      // choose female voice if available
      const voices = speechSynthesis.getVoices();
      const femaleVoice = voices.find(
        v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("susan")
      );
      if (femaleVoice) utterance.voice = femaleVoice;

      speechSynthesis.speak(utterance);
    }
  }, [currentLineIndex, biodataLines]);

  return (
    <>
      <div className="biodata">
        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
          <img src="/images/resume-pic.jpg" alt="Vinayak Bhatt" className="profile-pic" />
        </div>
        <div className="biodata-text">
          {biodataLines.map((line, idx) => (
            <p key={idx} style={{ margin: "6px 0" }}>
              {idx === currentLineIndex && (
                <TypewriterText
                  text={line}
                  speed={60}
                  onComplete={() => {
                    setTimeout(() => setCurrentLineIndex(currentLineIndex + 1), 300);
                  }}
                />
              )}
              {idx < currentLineIndex && <span>{line}</span>}
            </p>
          ))}
        </div>
      </div>

      <Canvas camera={{ position: [0, 12, 28], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[0, 0, 0]} intensity={1.6} distance={90} />
        <Stars radius={120} depth={50} count={4000} factor={4} fade speed={1.2} />

        {/* Sun */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[3.5, 64, 64]} />
          <meshBasicMaterial map={sunMap} />
        </mesh>

        {/* Planets */}
        <Planet texturePath="/textures/mercury.jpg" size={0.5} distance={6} orbitSpeed={0.05} />
        <Planet texturePath="/textures/venus.jpg" size={0.85} distance={8.4} orbitSpeed={0.035} />
        <Earth distance={11} orbitSpeed={0.02} />
        <Planet texturePath="/textures/mars.jpg" size={0.9} distance={14} orbitSpeed={0.018} />
        <Planet texturePath="/textures/jupiter.jpg" size={1.8} distance={18} orbitSpeed={0.012} />

        <OrbitControls />
      </Canvas>
    </>
  );
}
