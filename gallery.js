const galleryImagesByYear = {
    "2025": [
        // Add image filenames here, for example: "IMG_0001.JPG",
    ],
    "2026": [
        // Add image filenames here, for example: "IMG_0002.JPG",
    ],
};

const gallery = document.querySelector(".image-gallery");

if (gallery) {
    const filenames = galleryImagesByYear[gallery.dataset.galleryYear];

    if (!filenames) {
        console.error(`No image list is configured for ${gallery.dataset.galleryYear}.`);
    } else {
        filenames.forEach((filename) => {
            const image = document.createElement("img");
            image.src = filename;
            image.alt = filename;
            gallery.append(image);
        });
    }
}
