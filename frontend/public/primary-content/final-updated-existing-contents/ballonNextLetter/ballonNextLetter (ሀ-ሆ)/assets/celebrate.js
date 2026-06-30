function celebrateDog() {
    const feedback = document.getElementById('feedback');
    if (feedback) {
        feedback.src = './assets/award.jpg';
        feedback.style.display = 'block';
        setTimeout(()=>{ feedback.style.display = 'none'; }, 1200);
    }
    try {
        triggerConfetti();
    } catch(e) {}
    try {
        const a = new Audio();
        a.src = './assets/goodjob.mp3';
        // Patched Audio in index.html already respects global mute (window.__muted)
        a.play && a.play().catch(()=>{});
    } catch(e) {}
}

// Simple self-contained confetti effect
function triggerConfetti(){
    if (typeof document === 'undefined') return;

    // Inject confetti CSS once
    try {
        if (!document.getElementById('confetti-style')) {
            const style = document.createElement('style');
            style.id = 'confetti-style';
            style.textContent = `
                .confetti-piece{
                    position: fixed;
                    width: 8px;
                    height: 14px;
                    border-radius: 2px;
                    opacity: 0.9;
                    z-index: 2000;
                    pointer-events: none;
                    animation-name: confetti-fall;
                    animation-timing-function: linear;
                }
                @keyframes confetti-fall{
                    0%{ transform: translate3d(0, -100vh, 0) rotateZ(0deg); }
                    100%{ transform: translate3d(0, 110vh, 0) rotateZ(360deg); }
                }
            `;
            document.head && document.head.appendChild(style);
        }
    } catch(e) {}

    const colors = ['#ff4e50','#ffd54f','#4caf50','#29b6f6','#ff9800','#e91e63'];
    const count = 120;
    for (let i = 0; i < count; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + 'vw';
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        const duration = 2000 + Math.random() * 1200;
        const delay = Math.random() * 300;
        piece.style.animationDuration = duration + 'ms';
        piece.style.animationDelay = delay + 'ms';
        document.body.appendChild(piece);
        setTimeout(() => {
            piece.remove();
        }, duration + delay + 150);
    }
}