/* STREAMING_CHUNK:Styling Canvas & Layout Customizations */
body {
    background-color: #030712;
    background-image: radial-gradient(circle at 50% 50%, rgba(30, 27, 75, 0.4) 0%, rgba(3, 7, 18, 1) 100%);
    touch-action: manipulation;
}

canvas {
    display: block;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    max-width: 100%;
    height: auto;
}

/* Player Cards active state indicators */
.player-dead {
    opacity: 0.4;
    filter: grayscale(1);
    border-color: #334155 !important;
}

/* Animated pulse for powerups */
@keyframes pulse-glow {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.08); }
}

.animate-pulse-glow {
    animation: pulse-glow 1.5s infinite ease-in-out;
}