function celebrateDog() {
    const feedback = document.getElementById('feedback');
    if (feedback) {
        feedback.src = './assets/award.jpg';
        feedback.style.display = 'block';
        setTimeout(()=>{ feedback.style.display = 'none'; }, 1200);
    }
    try {
        const a = new Audio();
        a.src = './assets/goodjob.mp3';
        // Patched Audio in index.html already respects global mute (window.__muted)
        a.play && a.play().catch(()=>{});
    } catch(e) {}
}