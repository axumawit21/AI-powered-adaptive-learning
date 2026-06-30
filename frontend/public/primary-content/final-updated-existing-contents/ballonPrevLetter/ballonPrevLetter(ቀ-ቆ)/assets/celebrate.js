async function celebrateDog() {
    const img = document.createElement("img");
    img.src = "./assets/yes.jpg";
    // Prevent any zooming/scaling effects by fixing size and disabling transforms/transitions
    img.setAttribute(
        "style",
        "position: absolute; left: 42%; top: 35%; z-index: 2000; width: 220px; height: auto; transform: none; transition: none; pointer-events: none; image-rendering: auto;"
    );

    document.body.appendChild(img);

    let backDrop = document.createElement("div");
    backDrop.style.width = `${window.innerWidth}px`;
    backDrop.style.height = `${window.innerHeight}px`;
    backDrop.setAttribute(
        "style",
        `position: absolute; top: 0; left: 0; background-color: #000d; width: ${window.innerWidth}px; height: ${window.innerHeight}px;`
    );
    document.body.appendChild(backDrop);

    // audio
    const audio = new Audio();
    audio.src = "./assets/win.mp3";
    try {
        audio.muted = !!window.__muted;
        audio.volume = window.__muted ? 0 : 1;
    } catch (e) {}
    try {
        await audio.play();
    } catch (e) {
        /* autoplay may be blocked; safe to ignore */
    }
    setTimeout(() => {
        img.remove();
        backDrop.remove();
    }, 2000);
}