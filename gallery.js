const gallery = document.querySelector(".image-gallery");

if (gallery) {
    const images = window.galleryImagesByYear?.[gallery.dataset.galleryYear];

    if (!images) {
        console.error(`No image list is configured for ${gallery.dataset.galleryYear}.`);
    } else {
        images
            .slice()
            .sort((left, right) => right.date.localeCompare(left.date) ||
                left.src.localeCompare(right.src, undefined, { numeric: true }))
            .forEach(({ src }) => {
                const image = document.createElement("img");
                image.src = src;
                image.alt = src.split("/").pop();
                image.loading = "lazy";
                image.decoding = "async";
                gallery.append(image);
            });
    }
}
