const Logo = ({ className = "w-12 h-12" }) => {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shopping bag body - blue rectangle with slightly rounded bottom corners */}
      <rect
        x="8"
        y="22"
        width="32"
        height="22"
        rx="2"
        fill="#3b82f6"
      />
      
      {/* Orange curved top section that swoops upwards from left to right, overlapping the blue body */}
      <path
        d="M 8 22 Q 6 18 8 15 Q 10 12 14 13 L 30 13 Q 34 12 36 15 Q 38 18 40 22 L 40 24 L 8 24 Z"
        fill="#ff6a3c"
      />
      
      {/* Light orange circles on the orange section where handles attach */}
      <circle cx="16" cy="18" r="2" fill="#ffb380" />
      <circle cx="32" cy="18" r="2" fill="#ffb380" />
      
      {/* Thin grey semi-circular handles extending upwards */}
      <path
        d="M 16 18 Q 16 8 20 6 Q 24 8 24 18"
        stroke="#9ca3af"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 24 18 Q 24 8 28 6 Q 32 8 32 18"
        stroke="#9ca3af"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default Logo;

