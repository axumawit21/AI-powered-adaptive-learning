async function celebrateDog() {
    // Award image overlay (like wrong.jpg): centered, no backdrop
    const img = document.createElement("img");
    img.src = "./assets/award.jpg";
    img.style.position = "absolute";
    img.style.left = "50%";
    img.style.top = "50%";
    img.style.transform = "translate(-50%, -50%)"; // center
    img.style.zIndex = "1000";
    img.style.width = "auto";        // natural size
    img.style.height = "auto";       // natural size
    img.style.maxWidth = "60vw";     // same caps as wrong.jpg style
    img.style.maxHeight = "60vh";
    document.body.appendChild(img);

    // audio
    const audio = new Audio();
    audio.src = "./assets/goodjob.mp3";
    await audio.play();

    // remove after ~1.2s like wrong.jpg
    setTimeout(()=>{ img.remove(); }, 1200);
}