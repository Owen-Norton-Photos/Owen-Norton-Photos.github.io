const header = document.querySelector(".year-gallery-page .image-container");
const imageFrame = header?.querySelector(".header-image-frame");

if (header && imageFrame) {
    const mobileViewport = window.matchMedia("(max-width: 600px)");
    const flowSpacer = document.createElement("div");
    flowSpacer.setAttribute("aria-hidden", "true");

    let headerTop = 0;
    let fullHeight = 0;
    let shrinkingEnabled = !mobileViewport.matches;

    function measureHeader() {
        if (!shrinkingEnabled) {
            return;
        }

        const originalPosition = header.style.position;
        header.style.position = "static";
        imageFrame.style.height = "";
        flowSpacer.style.height = "0px";
        headerTop = header.getBoundingClientRect().top + window.scrollY;
        fullHeight = imageFrame.getBoundingClientRect().height;
        header.style.position = originalPosition;
        updateHeader();
    }

    function updateHeader() {
        if (!shrinkingEnabled) {
            return;
        }

        const minimumHeight = 182;
        const scrollDistance = Math.max(0, window.scrollY - headerTop);
        const shrinkAmount = Math.min(scrollDistance, fullHeight - minimumHeight);
        imageFrame.style.height = `${fullHeight - shrinkAmount}px`;
        flowSpacer.style.height = `${shrinkAmount}px`;
    }

    function updateViewportMode() {
        shrinkingEnabled = !mobileViewport.matches;
        imageFrame.style.height = "";
        flowSpacer.style.height = "0px";
        flowSpacer.remove();

        if (shrinkingEnabled) {
            header.after(flowSpacer);
            measureHeader();
        }
    }

    if (shrinkingEnabled) {
        header.after(flowSpacer);
        measureHeader();
    }

    window.addEventListener("scroll", updateHeader, { passive: true });
    window.addEventListener("resize", () => {
        if (shrinkingEnabled) {
            measureHeader();
        }
    });
    imageFrame.querySelector("img")?.addEventListener("load", measureHeader, { once: true });
    mobileViewport.addEventListener("change", updateViewportMode);
}
