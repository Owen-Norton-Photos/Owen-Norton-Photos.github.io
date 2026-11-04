const gallery = document.querySelector(".image-gallery");

if (gallery) {
    const images = window.galleryImagesByYear?.[gallery.dataset.galleryYear];

    if (!images) {
        console.error(`No image list is configured for ${gallery.dataset.galleryYear}.`);
    } else {
        const updateImageSpans = () => {
            const styles = getComputedStyle(gallery);
            const rowHeight = parseFloat(styles.gridAutoRows);
            const rowGap = parseFloat(styles.rowGap);

            gallery.querySelectorAll("img").forEach((image) => {
                if (!image.naturalWidth) {
                    return;
                }

                const imageHeight = image.clientWidth * image.naturalHeight / image.naturalWidth;
                const rowSpan = Math.ceil((imageHeight + rowGap) / (rowHeight + rowGap));
                image.style.gridRowEnd = `span ${rowSpan}`;
            });
        };
        let galleryWidth = 0;

        new ResizeObserver(() => {
            if (gallery.clientWidth !== galleryWidth) {
                galleryWidth = gallery.clientWidth;
                updateImageSpans();
            }
        }).observe(gallery);

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
                image.addEventListener("load", updateImageSpans, { once: true });
                gallery.append(image);
            });
    }
}
