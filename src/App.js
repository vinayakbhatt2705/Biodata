// App.js
import React, { useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import * as THREE from "three";
import "./App.css";

// -------------------- Typewriter Sound --------------------
function playKeySound() {
  const audio = new Audio("/sounds/key.mp3");
  audio.volume = 0.4;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

// -------------------- TypewriterText --------------------
function TypewriterText({ text, speed = 50, onComplete }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    let timeoutId;

    const tick = () => {
      if (i >= text.length) {
        onComplete?.();
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

// -------------------- Lat/Lon → XYZ Helper --------------------
function latLonToXYZ(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
}

// -------------------- Planet --------------------
function Planet({ texturePath, size = 1, distance = 5, orbitSpeed = 0.01, selfRotate = 0.01 }) {
  const meshRef = useRef();
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

// -------------------- Earth --------------------
function Earth({ distance = 11, orbitSpeed = 0.02, zoomStage = 0, universeCameraPos }) {
  const groupRef = useRef();
  const earthRef = useRef();
  const moonRef = useRef();
  const { camera } = useThree();

  const earthMap = useLoader(THREE.TextureLoader, "/textures/earth_day.jpg");
  const moonMap = useLoader(THREE.TextureLoader, "/textures/moon.jpg");

  // Locations
  const thaneXYZ = latLonToXYZ(19.243, 72.972, 1.22); // Hiranandani, Thane
  const matungaXYZ = latLonToXYZ(19.025, 72.850, 1.22); // New Law College, Matunga
  const hcMumbaiXYZ = latLonToXYZ(18.954, 72.835, 1.22); // High Court Mumbai

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * orbitSpeed;

    // Earth's orbit + rotation
    if (groupRef.current) {
      groupRef.current.position.x = distance * Math.cos(t);
      groupRef.current.position.z = distance * Math.sin(t);
    }
    if (earthRef.current) earthRef.current.rotation.y += 0.01;

    // Moon orbit
    if (moonRef.current) {
      moonRef.current.position.x = 2.8 * Math.cos(t * 2.2);
      moonRef.current.position.z = 2.8 * Math.sin(t * 2.2);
    }

    // Camera zoom stages
    if (zoomStage === 1 || zoomStage === 2 || zoomStage === 3) {
      const markerName = zoomStage === 1 ? "thaneMarker" : zoomStage === 2 ? "matungaMarker" : "hcMarker";
      const marker = earthRef.current?.getObjectByName(markerName);
      if (marker) {
        const worldPos = new THREE.Vector3();
        marker.getWorldPosition(worldPos);
        const targetPos = worldPos.clone().addScaledVector(worldPos.clone().normalize(), 4);
        camera.position.lerp(targetPos, 0.05);
        camera.lookAt(worldPos);
      }
    } else if (zoomStage === 0 && universeCameraPos) {
      // Slow universe rotation
      const time = clock.getElapsedTime() * 0.05;
      const radius = 28;
      const x = radius * Math.sin(time);
      const z = radius * Math.cos(time);
      camera.position.lerp(new THREE.Vector3(x, universeCameraPos[1], z), 0.05);
      camera.lookAt(0, 0, 0);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={earthRef}>
        <sphereGeometry args={[1.2, 64, 64]} />
        <meshStandardMaterial map={earthMap} />

        {/* Hiranandani Estate, Thane */}
        <group name="thaneMarker" position={thaneXYZ}>
          <mesh>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color="red" emissive="red" emissiveIntensity={1.5} />
          </mesh>
          <Html distanceFactor={10}>
            <div
              style={{
                color: "black",
                background: "rgba(255,255,255,0.8)",
                padding: "6px 10px",
                borderRadius: "8px",
                fontSize: "14px",
                whiteSpace: "nowrap",
              }}
            >
              📍 Home: Hiranandani Estate, Thane
            </div>
          </Html>
        </group>

        {/* New Law College, Matunga */}
        <group name="matungaMarker" position={matungaXYZ}>
          <mesh>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color="blue" emissive="blue" emissiveIntensity={1.5} />
          </mesh>
          <Html distanceFactor={10}>
            <div
              style={{
                color: "black",
                background: "rgba(255,255,255,0.8)",
                padding: "6px 10px",
                borderRadius: "8px",
                fontSize: "14px",
                whiteSpace: "nowrap",
              }}
            >
              📍 College: New Law College, Matunga
            </div>
          </Html>
        </group>

        {/* High Court Mumbai */}
        <group name="hcMarker" position={hcMumbaiXYZ}>
          <mesh>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color="green" emissive="green" emissiveIntensity={1.5} />
          </mesh>
          <Html distanceFactor={10}>
            <div
              style={{
                color: "black",
                background: "rgba(255,255,255,0.8)",
                padding: "6px 10px",
                borderRadius: "8px",
                fontSize: "14px",
                whiteSpace: "nowrap",
              }}
            >
              🏛 Practice: High Court Mumbai
            </div>
          </Html>
        </group>
      </mesh>

      {/* Moon */}
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
    "Relevant Experience: Divorce Case 13B, Issuing Notices, Drafting",
    "Other Experience: Software Industry Functional Consultant, Project Manager Post",
  ];

  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [zoomStage, setZoomStage] = useState(0);
  const [speechDone, setSpeechDone] = useState(false);

  const sunMap = useLoader(THREE.TextureLoader, "/textures/sun.jpg");
  const universeCameraPos = [0, 12, 28];

  useEffect(() => {
    if (currentLineIndex === biodataLines.length && !speechDone) {
      setSpeechDone(true);

      let textToSpeak = "Subject: is Lawyer. ";
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

      const voices = speechSynthesis.getVoices();
      const femaleVoice = voices.find(
        (v) =>
          v.name.toLowerCase().includes("female") ||
          v.name.toLowerCase().includes("zira") ||
          v.name.toLowerCase().includes("susan")
      );
      if (femaleVoice) utterance.voice = femaleVoice;

      utterance.onend = () => {
        // Camera zoom sequence: 15s per location
        setZoomStage(1); // Thane
        setTimeout(() => setZoomStage(2), 15000); // Matunga
        setTimeout(() => setZoomStage(3), 30000); // High Court
        setTimeout(() => setZoomStage(0), 45000); // Back to Universe
      };

      speechSynthesis.speak(utterance);
    }
  }, [currentLineIndex, biodataLines, speechDone]);

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
                  onComplete={() => setTimeout(() => setCurrentLineIndex((i) => i + 1), 300)}
                />
              )}
              {idx < currentLineIndex && <span>{line}</span>}
            </p>
          ))}
        </div>
      </div>

      <Canvas camera={{ position: universeCameraPos, fov: 50 }}>
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
        <Earth distance={11} orbitSpeed={0.02} zoomStage={zoomStage} universeCameraPos={universeCameraPos} />
        <Planet texturePath="/textures/mars.jpg" size={0.9} distance={14} orbitSpeed={0.018} />
        <Planet texturePath="/textures/jupiter.jpg" size={1.8} distance={18} orbitSpeed={0.012} />

        <OrbitControls enableZoom={true} enablePan={true} />
      </Canvas>
    </>
  );
}
