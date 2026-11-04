const header = document.querySelector(".year-gallery-page .image-container");
const imageFrame = header?.querySelector(".header-image-frame");

if (header && imageFrame) {
    const flowSpacer = document.createElement("div");
    flowSpacer.setAttribute("aria-hidden", "true");
    header.after(flowSpacer);

    const releasedClass = "header-shrink-complete";
    let headerTop = 0;
    let fullHeight = 0;

    function measureHeader() {
        const originalPosition = header.style.position;
        header.style.position = "static";
        header.classList.remove(releasedClass);
        header.style.removeProperty("--header-release-offset");
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
        const shrinkAmount = Math.min(scrollDistance, Math.max(0, fullHeight - minimumHeight));
        imageFrame.style.height = `${fullHeight - shrinkAmount}px`;
        flowSpacer.style.height = `${shrinkAmount}px`;

        if (fullHeight > minimumHeight && shrinkAmount >= fullHeight - minimumHeight) {
            header.style.setProperty("--header-release-offset", `${shrinkAmount}px`);
            header.classList.add(releasedClass);
        } else {
            header.classList.remove(releasedClass);
            header.style.removeProperty("--header-release-offset");
        }
    }

    window.addEventListener("scroll", updateHeader, { passive: true });
    window.addEventListener("resize", measureHeader);
    imageFrame.querySelector("img")?.addEventListener("load", measureHeader, { once: true });
    measureHeader();
}
