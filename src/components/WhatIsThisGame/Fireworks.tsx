"use client";

export const createFireworks = (soundEnabled: boolean) => {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#FFD700",
    "#FF69B4",
    "#00CED1",
  ];
  const container = document.createElement("div");
  container.className = "firework-container";

  // Play firework sounds
  playFireworkSound(soundEnabled);

  // Create multiple firework bursts
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight * 0.6; // Upper part of screen

      // Create burst
      const burst = document.createElement("div");
      burst.className = "firework-burst";
      burst.style.left = `${x - 50}px`;
      burst.style.top = `${y - 50}px`;

      // Create particles
      for (let j = 0; j < 12; j++) {
        const particle = document.createElement("div");
        particle.className = "particle";
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.backgroundColor =
          colors[Math.floor(Math.random() * colors.length)];

        // Random direction for particles
        const angle = (j / 12) * Math.PI * 2;
        const distance = 100 + Math.random() * 100;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        particle.style.setProperty("--tx", `${tx}px`);
        particle.style.setProperty("--ty", `${ty}px`);

        container.appendChild(particle);

        // Remove particle after animation
        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }, 1500);
      }

      container.appendChild(burst);

      // Remove burst after animation
      setTimeout(() => {
        if (burst.parentNode) {
          burst.parentNode.removeChild(burst);
        }
      }, 800);
    }, i * 200); // Stagger the fireworks
  }

  document.body.appendChild(container);

  // Remove container after all animations
  setTimeout(() => {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }, 3000);
};

const playFireworkSound = (soundEnabled: boolean) => {
  if (!soundEnabled) return;

  // Create multiple explosion sounds
  const audioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)();

  const createExplosion = (delay: number) => {
    setTimeout(() => {
      // White noise burst
      const bufferSize = audioContext.sampleRate * 0.1;
      const buffer = audioContext.createBuffer(
        1,
        bufferSize,
        audioContext.sampleRate
      );
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] =
          (Math.random() - 0.5) * 0.3 * Math.exp((-i / bufferSize) * 10);
      }

      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();

      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.1
      );

      source.start(audioContext.currentTime);
    }, delay);
  };

  // Multiple explosions for firework effect
  createExplosion(0);
  createExplosion(200);
  createExplosion(400);
  createExplosion(600);
};

