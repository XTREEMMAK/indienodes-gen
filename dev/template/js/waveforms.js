// WaveSurfer enhances the native player; playback remains usable on failure.
if (window.WaveSurfer && location.protocol !== "file:") {
  document.querySelectorAll(".work--audio").forEach((work) => {
    const audio = work.querySelector("audio");
    const container = document.createElement("div");
    container.className = "waveform";
    container.setAttribute("aria-hidden", "true");
    audio.before(container);
    const style = getComputedStyle(work);
    const wave = WaveSurfer.create({
      container,
      media: audio,
      waveColor: style.getPropertyValue("--text-muted").trim(),
      progressColor: style.getPropertyValue("--accent").trim(),
      height: 72,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      normalize: true,
      // Seeking and playback are available through native keyboard controls.
      interact: false,
    });
    const fallback = () => {
      wave.destroy();
      container.remove();
    };
    wave.on("error", fallback);
    wave.load(audio.getAttribute("src")).catch(() => {});
    audio.addEventListener("play", () => {
      document.querySelectorAll(".work--audio audio").forEach((other) => {
        if (other !== audio) other.pause();
      });
    });
  });
}
