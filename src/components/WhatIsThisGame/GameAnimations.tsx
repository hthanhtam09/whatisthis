"use client";

import { useEffect } from "react";

const animations = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
  
  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }

  @keyframes firework {
    0% { transform: scale(0) rotate(0deg); opacity: 1; }
    50% { transform: scale(1.2) rotate(180deg); opacity: 0.8; }
    100% { transform: scale(1.5) rotate(360deg); opacity: 0; }
  }

  @keyframes particle {
    0% { transform: translate(0, 0) scale(1); opacity: 1; }
    100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
  }

  @keyframes bounce-in {
    0% { transform: scale(0) rotate(-10deg); opacity: 0; }
    50% { transform: scale(1.1) rotate(5deg); opacity: 1; }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }

  @keyframes pulse-glow {
    0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(34, 197, 94, 0.3); }
    50% { transform: scale(1.05); box-shadow: 0 0 30px rgba(34, 197, 94, 0.5); }
  }

  .firework-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
  }

  .firework {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    animation: firework 1s ease-out forwards;
  }

  .particle {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: particle 1.5s ease-out forwards;
  }

  .firework-burst {
    position: absolute;
    width: 100px;
    height: 100px;
    pointer-events: none;
  }

  .firework-burst::before,
  .firework-burst::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
    animation: firework 0.8s ease-out forwards;
  }

  .firework-burst::after {
    animation-delay: 0.1s;
    background: radial-gradient(circle, rgba(255,215,0,0.8) 0%, rgba(255,215,0,0) 70%);
  }

  .success-message {
    animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
  }

  .timeout-message {
    animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(245, 87, 108, 0.3);
  }

  .success-text {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-weight: 800;
    font-size: 2.5rem;
    background: linear-gradient(45deg, #fff, #f0f0f0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
    letter-spacing: 2px;
  }

  .timeout-text {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-weight: 800;
    font-size: 2.2rem;
    background: linear-gradient(45deg, #fff, #fff5f5);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
    letter-spacing: 1px;
  }

  .answer-text {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-weight: 600;
    font-size: 1.3rem;
    color: rgba(255, 255, 255, 0.95);
    text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
    letter-spacing: 0.5px;
  }

  .emoji-icon {
    font-size: 3rem;
    margin-bottom: 0.5rem;
    animation: pulse-glow 2s infinite;
  }
`;

export const GameAnimations = () => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const style = document.createElement("style");
      style.textContent = animations;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  return null;
};

