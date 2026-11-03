const header = document.querySelector(".year-gallery-page .image-container");
const imageFrame = header?.querySelector(".header-image-frame");

if (header && imageFrame) {
    const flowSpacer = document.createElement("div");
    flowSpacer.setAttribute("aria-hidden", "true");
    header.after(flowSpacer);

    let headerTop = 0;
    let fullHeight = 0;

    function measureHeader() {
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
        const minimumHeight = 182;
        const scrollDistance = Math.max(0, window.scrollY - headerTop);
        const shrinkAmount = Math.min(scrollDistance, fullHeight - minimumHeight);
        imageFrame.style.height = `${fullHeight - shrinkAmount}px`;
        flowSpacer.style.height = `${shrinkAmount}px`;
    }

    window.addEventListener("scroll", updateHeader, { passive: true });
    window.addEventListener("resize", measureHeader);
    imageFrame.querySelector("img")?.addEventListener("load", measureHeader, { once: true });
    measureHeader();
}
