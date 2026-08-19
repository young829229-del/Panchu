import React from 'react';

/**
 * High-fidelity Red + White dreamy sky background with concentric radial wireframe rings
 * and billowing soft clouds matching the reference design.
 */
export const AuthCloudBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none bg-gradient-to-b from-[#fca5a5]/70 via-[#fee2e2]/60 to-[#ffffff]">
      {/* Ambient Red/Blush Radial Glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 30%, rgba(239, 68, 68, 0.22) 0%, rgba(254, 202, 202, 0.35) 45%, rgba(255, 255, 255, 0.95) 85%)'
        }}
      />

      {/* Concentric Wireframe Radial Arcs (Exact Match to Reference) */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40" 
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
      >
        <circle cx="720" cy="450" r="260" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx="720" cy="450" r="420" stroke="white" strokeWidth="1.5" />
        <circle cx="720" cy="450" r="600" stroke="white" strokeWidth="1.5" strokeDasharray="6 6" />
        <circle cx="720" cy="450" r="800" stroke="white" strokeWidth="1.5" />
        <circle cx="720" cy="450" r="1020" stroke="white" strokeWidth="1.5" strokeDasharray="8 8" />
      </svg>

      {/* Soft Layered Cloud Horizon (Red + White Dreamy Atmosphere) */}
      <div className="absolute inset-x-0 bottom-0 h-[45vh] pointer-events-none overflow-hidden">
        {/* Deep cloud layer */}
        <div className="absolute -bottom-20 -left-20 w-[600px] h-[340px] rounded-full bg-white/70 blur-3xl" />
        <div className="absolute -bottom-10 left-[25%] w-[700px] h-[360px] rounded-full bg-white/80 blur-3xl" />
        <div className="absolute -bottom-16 right-[10%] w-[650px] h-[350px] rounded-full bg-[#fee2e2]/60 blur-3xl" />
        <div className="absolute -bottom-24 -right-20 w-[550px] h-[320px] rounded-full bg-white/75 blur-3xl" />

        {/* Foreground billowing cloud shapes */}
        <svg 
          className="absolute bottom-0 inset-x-0 w-full h-48 sm:h-64 text-white opacity-80" 
          viewBox="0 0 1440 320" 
          fill="currentColor" 
          preserveAspectRatio="none"
        >
          <path d="M0,192L48,197.3C96,203,192,213,288,197.3C384,181,480,139,576,138.7C672,139,768,181,864,197.3C960,213,1056,203,1152,186.7C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};
