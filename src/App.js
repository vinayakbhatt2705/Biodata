// App.js
import React, { useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls ,Stars} from '@react-three/drei';
import * as THREE from 'three';
import './App.css'; // We'll style biodata here

// Planet component
function Planet({ texturePath, size, distance, speed = 0.01 }) {
  const meshRef = useRef();
  const map = useLoader(THREE.TextureLoader, texturePath);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;
    if (meshRef.current) {
      meshRef.current.position.x = distance * Math.cos(t);
      meshRef.current.position.z = distance * Math.sin(t);
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[size, 64, 64]} />
      <meshStandardMaterial map={map} />
    </mesh>
  );
}

// Saturn with ring
function Saturn({ texturePath, ringTexturePath, size, distance, speed = 0.006 }) {
  const groupRef = useRef();
  const saturnMap = useLoader(THREE.TextureLoader, texturePath);
  const ringMap = useLoader(THREE.TextureLoader, ringTexturePath);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;
    if (groupRef.current) {
      groupRef.current.position.x = distance * Math.cos(t);
      groupRef.current.position.z = distance * Math.sin(t);
      // Rotate Saturn itself
      groupRef.current.children[0].rotation.y += 0.003;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[size, 64, 64]} />
        <meshStandardMaterial map={saturnMap} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size * 1.2, size * 1.7, 64]} />
        <meshStandardMaterial map={ringMap} side={THREE.DoubleSide} transparent />
      </mesh>
    </group>
  );
}

// Earth with Moon and Satellite
function Earth({ distance, speed }) {
  const groupRef = useRef();
  const earthMap = useLoader(THREE.TextureLoader, '/textures/earth_day.jpg');
  const moonMap = useLoader(THREE.TextureLoader, '/textures/moon.jpg');

  const moonRef = useRef();
  const satelliteRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;
    if (groupRef.current) {
      groupRef.current.position.x = distance * Math.cos(t);
      groupRef.current.position.z = distance * Math.sin(t);
      groupRef.current.children[0].rotation.y += 0.01; // Earth rotation
    }

    // Moon orbit
    if (moonRef.current) {
      moonRef.current.position.x = 3 * Math.cos(t * 2);
      moonRef.current.position.z = 3 * Math.sin(t * 2);
    }

    // Satellite orbit
    if (satelliteRef.current) {
      satelliteRef.current.position.x = 4 * Math.cos(t * 3);
      satelliteRef.current.position.z = 4 * Math.sin(t * 3);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Earth */}
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial map={earthMap} />
      </mesh>
      {/* Moon */}
      <mesh ref={moonRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial map={moonMap} />
      </mesh>
      {/* Satellite */}
      <mesh ref={satelliteRef}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </group>
  );
}

// Comet component
function Comet({ size = 0.2, speed = 0.03, tailLength = 2 }) {
  const meshRef = useRef();
  const tailRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;
    if (meshRef.current) {
      meshRef.current.position.x = 50 * Math.cos(t * 1.2);
      meshRef.current.position.z = 50 * Math.sin(t * 1.2);
      meshRef.current.position.y = 10 * Math.sin(t * 0.5);
    }
    if (tailRef.current) {
      tailRef.current.position.copy(meshRef.current.position);
    }
  });

  return (
    <>
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh ref={tailRef}>
        <coneGeometry args={[size, tailLength, 8]} />
        <meshStandardMaterial color="white" transparent opacity={0.5} />
      </mesh>
    </>
  );
}

export default function App() {
  // Load textures
  const sunMap = useLoader(THREE.TextureLoader, '/textures/sun.jpg');
  const mercuryMap = useLoader(THREE.TextureLoader, '/textures/mercury.jpg');
  const venusMap = useLoader(THREE.TextureLoader, '/textures/venus.jpg');
  const marsMap = useLoader(THREE.TextureLoader, '/textures/mars.jpg');
  const jupiterMap = useLoader(THREE.TextureLoader, '/textures/jupiter.jpg');
  const saturnMap = useLoader(THREE.TextureLoader, '/textures/saturn.jpg');
  const saturnRingMap = useLoader(THREE.TextureLoader, '/textures/saturn_ring.png');

  return (
    <>
      {/* Biodata overlay */}
      <div className="biodata">
        <h2>Vinayak Bhatt</h2>
        <p>Advocate, Bombay High Court</p>
        <p>Criminal / Civil / Family</p>
        <p>Phone: 9833730722</p>
        <p>Email: vinayakbhatt2705@gmail.com</p>
      </div>

      <Canvas camera={{ position: [0, 50, 150], fov: 45 }}>
        {/* Lights */}
        <ambientLight intensity={0.3} />
        <pointLight position={[0, 0, 0]} intensity={3} distance={500} />

        {/* Stars */}
        <Stars
          radius={200}
          depth={100}
          count={50000}
          factor={4}
          saturation={15.5}
          fade
          speed={5.5}
        />

        {/* Sun */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[10, 64, 64]} />
          <meshBasicMaterial map={sunMap} />
        </mesh>

        {/* Planets */}
        <Planet texturePath="/textures/mercury.jpg" size={1} distance={15} speed={0.04} />
        <Planet texturePath="/textures/venus.jpg" size={1.2} distance={22} speed={0.03} />
        <Earth distance={30} speed={0.02} />
        <Planet texturePath="/textures/mars.jpg" size={1.5} distance={45} speed={0.02} />
        <Planet texturePath="/textures/jupiter.jpg" size={4} distance={60} speed={0.01} />
        <Saturn
          texturePath="/textures/saturn.jpg"
          ringTexturePath="/textures/saturn_ring.png"
          size={3}
          distance={75}
          speed={0.008}
        />

        {/* Comets */}
        <Comet />
        <Comet size={0.15} speed={0.02} tailLength={3} />

        {/* Controls */}
        <OrbitControls />
      </Canvas>
    </>
  );
}
