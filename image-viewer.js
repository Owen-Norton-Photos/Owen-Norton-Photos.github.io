const imageViewer = document.createElement("dialog");
imageViewer.className = "image-viewer";
imageViewer.setAttribute("aria-label", "Fullscreen image");
imageViewer.innerHTML = `
    <button class="image-viewer-close" type="button" aria-label="Close image" autofocus>X</button>
    <img class="image-viewer-image" alt="">
`;
document.body.append(imageViewer);

const viewerImage = imageViewer.querySelector(".image-viewer-image");
let previouslyFocusedImage = null;

function openImageViewer(image) {
    previouslyFocusedImage = image;
    viewerImage.src = image.currentSrc || image.src;
    viewerImage.alt = image.alt;
    imageViewer.showModal();
}

function closeImageViewer() {
    imageViewer.close();
}

document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
        return;
    }

    const image = event.target.closest(".image-container img, .image-gallery img");
    if (image) {
        openImageViewer(image);
    }
});

document.addEventListener("keydown", (event) => {
    if (!(event.target instanceof HTMLImageElement)) {
        return;
    }

    if (
        event.target.matches(".image-container img, .image-gallery img") &&
        (event.key === "Enter" || event.key === " ")
    ) {
        event.preventDefault();
        openImageViewer(event.target);
    }
});

imageViewer.querySelector(".image-viewer-close").addEventListener("click", closeImageViewer);
imageViewer.addEventListener("click", (event) => {
    if (event.target === imageViewer) {
        closeImageViewer();
    }
});
imageViewer.addEventListener("close", () => {
    viewerImage.removeAttribute("src");
    previouslyFocusedImage?.focus();
    previouslyFocusedImage = null;
});

document.querySelectorAll(".image-container img, .image-gallery img").forEach((image) => {
    image.tabIndex = 0;
    image.setAttribute("role", "button");
    image.setAttribute("aria-haspopup", "dialog");
});
