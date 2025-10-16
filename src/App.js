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
function Planet({ texturePath, size = 1, distance = 5, orbitSpeed = 0.01, selfRotate = 0.01, name, onClick, onLoad }) {
  const meshRef = useRef();
  const map = useLoader(
    THREE.TextureLoader,
    texturePath,
    () => onLoad(texturePath)
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * orbitSpeed;
    if (meshRef.current) {
      meshRef.current.position.x = distance * Math.cos(t);
      meshRef.current.position.z = distance * Math.sin(t);
      meshRef.current.rotation.y += selfRotate;
    }
  });

  return (
    <mesh ref={meshRef} onClick={() => onClick(name)}>
      <sphereGeometry args={[size, 64, 64]} />
      <meshStandardMaterial map={map} />
    </mesh>
  );
}

// -------------------- Saturn --------------------
function Saturn({ distance = 22, orbitSpeed = 0.008, selfRotate = 0.005, name, onClick, onLoad }) {
  const saturnRef = useRef();
  const ringRef = useRef();
  const saturnMap = useLoader(THREE.TextureLoader, "/textures/saturn.jpg", () => onLoad("saturn.jpg"));
  const ringMap = useLoader(THREE.TextureLoader, "/textures/saturn_ring.png", () => onLoad("saturn_ring.png"));

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * orbitSpeed;
    if (saturnRef.current) {
      saturnRef.current.position.x = distance * Math.cos(t);
      saturnRef.current.position.z = distance * Math.sin(t);
      saturnRef.current.rotation.y += selfRotate;
    }
    if (ringRef.current) {
      ringRef.current.position.x = distance * Math.cos(t);
      ringRef.current.position.z = distance * Math.sin(t);
      ringRef.current.rotation.y += selfRotate;
    }
  });

  return (
    <>
      <mesh ref={saturnRef} onClick={() => onClick(name)}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshStandardMaterial map={saturnMap} />
      </mesh>
      <mesh ref={ringRef} onClick={() => onClick(name)}>
        <ringGeometry args={[1.8, 2.8, 64]} />
        <meshStandardMaterial map={ringMap} side={THREE.DoubleSide} transparent />
        <mesh rotation-x={Math.PI / 6} />
      </mesh>
    </>
  );
}

// -------------------- Earth --------------------
function Earth({ distance = 11, orbitSpeed = 0.02, zoomStage = 0, universeCameraPos, onLoad }) {
  const groupRef = useRef();
  const earthRef = useRef();
  const moonRef = useRef();
  const { camera } = useThree();

  const earthMap = useLoader(THREE.TextureLoader, "/textures/earth_day.jpg", () => onLoad("earth_day.jpg"));
  const moonMap = useLoader(THREE.TextureLoader, "/textures/moon.jpg", () => onLoad("moon.jpg"));

  const thaneXYZ = latLonToXYZ(19.243, 72.972, 1.22);
  const matungaXYZ = latLonToXYZ(19.025, 72.850, 1.22);
  const hcMumbaiXYZ = latLonToXYZ(18.954, 72.835, 1.22);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * orbitSpeed;
    if (groupRef.current) {
      groupRef.current.position.x = distance * Math.cos(t);
      groupRef.current.position.z = distance * Math.sin(t);
    }
    if (earthRef.current) earthRef.current.rotation.y += 0.01;
    if (moonRef.current) {
      moonRef.current.position.x = 2.8 * Math.cos(t * 2.2);
      moonRef.current.position.z = 2.8 * Math.sin(t * 2.2);
    }

    if (zoomStage >= 1 && zoomStage <= 3) {
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

        {/* Thane */}
        <group name="thaneMarker" position={thaneXYZ}>
          <mesh>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color="red" emissive="red" emissiveIntensity={1.5} />
          </mesh>
          <Html distanceFactor={10}>
            <div className="marker">📍 Home: Hiranandani Estate, Thane</div>
          </Html>
        </group>

        {/* Matunga */}
        <group name="matungaMarker" position={matungaXYZ}>
          <mesh>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color="blue" emissive="blue" emissiveIntensity={1.5} />
          </mesh>
          <Html distanceFactor={10}>
            <div className="marker">📍 College: New Law College, Matunga</div>
          </Html>
        </group>

        {/* High Court */}
        <group name="hcMarker" position={hcMumbaiXYZ}>
          <mesh>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color="green" emissive="green" emissiveIntensity={1.5} />
          </mesh>
          <Html distanceFactor={10}>
            <div className="marker">🏛 Practice: High Court Mumbai</div>
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
  const [planetInfo, setPlanetInfo] = useState(null);
  const [flash, setFlash] = useState(false);

  // -------------------- Loading State --------------------
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingDone, setLoadingDone] = useState(false);
  const loadedTextures = useRef(0);
  const totalTextures = 9; // sun, mercury, venus, earth, moon, mars, jupiter, saturn, saturn_ring
  const targetProgress = useRef(0); // smooth animation target

  const universeCameraPos = [0, 12, 28];

  const handlePlanetClick = (name) => {
    const infoMap = {
      Sun: "Sun Pharma Experience 3 Year Manager (2014-2017)",
      Jupiter: "Capgemini - Java Team Lead (2013), SAP Operations Lead (2021), Scrum Master (2023)",
      Saturn: "Base Information, ERP Implementor (2007-2009/2011-2012)",
      Earth: "Base Information Consultant ERP (2007-2009/2010-2012)",
      Mercury: "Chate Coaching Classes",
      Venus: "Bilkish Dubai (2009-2010)",
      Mars: "Softenger, Project Lead (2018-2019)",
    };
    setPlanetInfo(infoMap[name]);
    setFlash(true);

    const utterance = new SpeechSynthesisUtterance(infoMap[name]);
    utterance.rate = 1;
    utterance.pitch = 1.05;
    const voices = speechSynthesis.getVoices();
    const femaleVoice = voices.find(v =>
      v.name.toLowerCase().includes("female") ||
      v.name.toLowerCase().includes("zira") ||
      v.name.toLowerCase().includes("susan")
    );
    if (femaleVoice) utterance.voice = femaleVoice;

    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);

    setTimeout(() => setFlash(false), 3000);
  };

  const handleTextureLoad = () => {
    loadedTextures.current += 1;
    targetProgress.current = Math.round((loadedTextures.current / totalTextures) * 100);
    if (loadedTextures.current >= totalTextures) {
      setTimeout(() => setLoadingDone(true), 500);
    }
  };

  // Smoothly animate progress
  useEffect(() => {
    let animationFrame;
    const animateProgress = () => {
      setLoadingProgress(prev => {
        if (prev < targetProgress.current) return prev + 1;
        return prev;
      });
      animationFrame = requestAnimationFrame(animateProgress);
    };
    animateProgress();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

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
      const femaleVoice = voices.find(v =>
        v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("zira") ||
        v.name.toLowerCase().includes("susan")
      );
      if (femaleVoice) utterance.voice = femaleVoice;

      utterance.onend = () => {
        setZoomStage(1);
        setTimeout(() => setZoomStage(2), 15000);
        setTimeout(() => setZoomStage(3), 30000);
        setTimeout(() => setZoomStage(0), 45000);
      };

      speechSynthesis.speak(utterance);
    }
  }, [currentLineIndex, biodataLines, speechDone]);

  return (
    <>
      {/* Loading Screen */}
      {!loadingDone && (
        <div className="loading-screen">
          <h1>Thank you for your patience...</h1>
          <p>Loading planets: {loadingProgress}%</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${loadingProgress}%` }}></div>
          </div>
        </div>
      )}

      {/* Biodata Behind Planets */}
      <div className="biodata">
        <img src="/images/resume-pic.jpg" alt="Vinayak Bhatt" className="profile-pic" />
        <div className="biodata-text">
          {biodataLines.map((line, idx) => (
            <p key={idx}>
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

      {/* 3D Scene */}
      <Canvas style={{ position: "relative", zIndex: 2 }} camera={{ position: universeCameraPos, fov: 50 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[0, 0, 0]} intensity={1.6} distance={90} />
        <Stars radius={120} depth={50} count={4000} factor={4} fade speed={1.2} />

        <Planet texturePath="/textures/sun.jpg" size={3.5} distance={0} orbitSpeed={0} name="Sun" onClick={handlePlanetClick} onLoad={handleTextureLoad} />
        <Planet texturePath="/textures/mercury.jpg" size={0.5} distance={6} orbitSpeed={0.05} name="Mercury" onClick={handlePlanetClick} onLoad={handleTextureLoad} />
        <Planet texturePath="/textures/venus.jpg" size={0.85} distance={8.4} orbitSpeed={0.035} name="Venus" onClick={handlePlanetClick} onLoad={handleTextureLoad} />
        <Earth distance={11} orbitSpeed={0.02} zoomStage={zoomStage} universeCameraPos={universeCameraPos} onLoad={handleTextureLoad} />
        <Planet texturePath="/textures/mars.jpg" size={0.9} distance={14} orbitSpeed={0.018} name="Mars" onClick={handlePlanetClick} onLoad={handleTextureLoad} />
        <Planet texturePath="/textures/jupiter.jpg" size={1.8} distance={18} orbitSpeed={0.012} name="Jupiter" onClick={handlePlanetClick} onLoad={handleTextureLoad} />
        <Saturn distance={22} orbitSpeed={0.008} name="Saturn" onClick={handlePlanetClick} onLoad={handleTextureLoad} />

        <OrbitControls enableZoom enablePan />
      </Canvas>

      {/* Planet Info Flash */}
      {planetInfo && flash && (
        <div className="flash-info">{planetInfo}</div>
      )}
    </>
  );
}
