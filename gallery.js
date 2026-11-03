const GITHUB_REPOSITORY = "goldcoolness1-ops/goldcoolness1-ops.github.io";
const IMAGE_EXTENSIONS = /\.(avif|gif|jpe?g|png|webp)$/i;
const MAX_METADATA_REQUESTS = 4;

function readExifDate(bytes) {
    if (bytes.length < 2) {
        return { complete: false, timestamp: null };
    }
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
        return { complete: true, timestamp: null };
    }

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let offset = 2;

    while (offset < bytes.length) {
        if (bytes[offset] !== 0xff) {
            return { complete: true, timestamp: null };
        }
        while (bytes[offset] === 0xff) {
            offset += 1;
        }
        if (offset >= bytes.length) {
            return { complete: false, timestamp: null };
        }

        const marker = bytes[offset];
        offset += 1;
        if (marker === 0xd9 || marker === 0xda) {
            return { complete: true, timestamp: null };
        }
        if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
            continue;
        }
        if (offset + 2 > bytes.length) {
            return { complete: false, timestamp: null };
        }

        const segmentLength = view.getUint16(offset);
        const segmentStart = offset + 2;
        const segmentEnd = offset + segmentLength;
        if (segmentLength < 2) {
            return { complete: true, timestamp: null };
        }
        if (segmentEnd > bytes.length) {
            return { complete: false, timestamp: null };
        }

        const isExif = marker === 0xe1 &&
            bytes[segmentStart] === 0x45 &&
            bytes[segmentStart + 1] === 0x78 &&
            bytes[segmentStart + 2] === 0x69 &&
            bytes[segmentStart + 3] === 0x66 &&
            bytes[segmentStart + 4] === 0 &&
            bytes[segmentStart + 5] === 0;
        if (isExif) {
            return {
                complete: true,
                timestamp: readExifTimestamp(bytes, segmentStart + 6, segmentEnd),
            };
        }
        offset = segmentEnd;
    }
    return { complete: false, timestamp: null };
}

function readExifTimestamp(bytes, tiffStart, tiffEnd) {
    if (tiffStart + 8 > tiffEnd) {
        return null;
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const byteOrder = String.fromCharCode(bytes[tiffStart], bytes[tiffStart + 1]);
    if (byteOrder !== "II" && byteOrder !== "MM") {
        return null;
    }
    const littleEndian = byteOrder === "II";
    if (view.getUint16(tiffStart + 2, littleEndian) !== 42) {
        return null;
    }

    function readIfd(relativeOffset) {
        const ifdStart = tiffStart + relativeOffset;
        if (ifdStart + 2 > tiffEnd) {
            return null;
        }
        const count = view.getUint16(ifdStart, littleEndian);
        const entries = new Map();
        for (let index = 0; index < count; index += 1) {
            const entry = ifdStart + 2 + index * 12;
            if (entry + 12 > tiffEnd) {
                break;
            }
            const tag = view.getUint16(entry, littleEndian);
            const type = view.getUint16(entry + 2, littleEndian);
            const valueCount = view.getUint32(entry + 4, littleEndian);
            if (type !== 2 || valueCount < 1 || valueCount > 64) {
                continue;
            }
            const valueOffset = valueCount <= 4
                ? entry + 8
                : tiffStart + view.getUint32(entry + 8, littleEndian);
            if (valueOffset + valueCount > tiffEnd) {
                continue;
            }
            const value = new TextDecoder().decode(bytes.subarray(valueOffset, valueOffset + valueCount));
            entries.set(tag, value.replace(/\0.*$/, ""));
        }
        return entries;
    }

    const firstIfdOffset = view.getUint32(tiffStart + 4, littleEndian);
    const firstIfd = readIfd(firstIfdOffset);
    if (!firstIfd) {
        return null;
    }
    const firstIfdStart = tiffStart + firstIfdOffset;
    let exifIfd = null;
    const firstIfdEntryCount = view.getUint16(firstIfdStart, littleEndian);
    for (let index = 0; index < firstIfdEntryCount; index += 1) {
        const entry = firstIfdStart + 2 + index * 12;
        if (entry + 12 > tiffEnd) {
            break;
        }
        const tag = view.getUint16(entry, littleEndian);
        const type = view.getUint16(entry + 2, littleEndian);
        const count = view.getUint32(entry + 4, littleEndian);
        if (tag === 0x8769 && type === 4 && count === 1) {
            exifIfd = readIfd(view.getUint32(entry + 8, littleEndian));
            break;
        }
    }

    const timestampText = exifIfd?.get(0x9003) || exifIfd?.get(0x9004) || firstIfd.get(0x0132);
    const match = timestampText?.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
    if (!match) {
        return null;
    }
    const [, year, month, day, hour, minute, second] = match;
    return Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
}

async function getCaptureDate(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Image metadata request failed (${response.status}).`);
    }
    if (!response.body) {
        const result = readExifDate(new Uint8Array(await response.arrayBuffer()));
        return result.timestamp;
    }

    const reader = response.body.getReader();
    let bytes = new Uint8Array();
    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                return readExifDate(bytes).timestamp;
            }
            const combined = new Uint8Array(bytes.length + value.length);
            combined.set(bytes);
            combined.set(value, bytes.length);
            bytes = combined;
            const result = readExifDate(bytes);
            if (result.complete) {
                await reader.cancel();
                return result.timestamp;
            }
        }
    } finally {
        reader.releaseLock();
    }
}

async function getCaptureDates(files) {
    const dates = new Array(files.length);
    let nextIndex = 0;
    const workerCount = Math.min(MAX_METADATA_REQUESTS, files.length);
    await Promise.all(Array.from({ length: workerCount }, async () => {
        while (nextIndex < files.length) {
            const index = nextIndex;
            nextIndex += 1;
            try {
                dates[index] = await getCaptureDate(files[index].download_url);
            } catch (error) {
                console.warn(`Could not read capture date for ${files[index].name}.`, error);
                dates[index] = null;
            }
        }
    }));
    return dates;
}

async function loadGallery(gallery) {
    const year = gallery.dataset.galleryYear;
    const status = document.createElement("p");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.textContent = "Loading photos…";
    gallery.before(status);

    try {
        const folder = `${year}pic`;
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_REPOSITORY}/contents/${folder}`,
            { headers: { Accept: "application/vnd.github+json" } },
        );
        if (!response.ok) {
            throw new Error(`GitHub returned ${response.status} for ${folder}/.`);
        }

        const entries = await response.json();
        if (!Array.isArray(entries)) {
            throw new Error(`GitHub did not return a file list for ${folder}/.`);
        }

        const files = entries.filter((entry) =>
            entry.type === "file" && IMAGE_EXTENSIONS.test(entry.name) && entry.download_url
        );
        const dates = await getCaptureDates(files);
        const datedFiles = files.map((file, index) => ({ file, date: dates[index] }));
        datedFiles.sort((left, right) => {
            if (left.date === null && right.date !== null) return 1;
            if (left.date !== null && right.date === null) return -1;
            if (left.date !== right.date) return (right.date ?? 0) - (left.date ?? 0);
            return left.file.name.localeCompare(right.file.name, undefined, { numeric: true, sensitivity: "base" });
        });

        gallery.replaceChildren();
        datedFiles.forEach(({ file }) => {
            const image = document.createElement("img");
            image.src = file.download_url;
            image.alt = file.name;
            gallery.append(image);
        });
        status.textContent = datedFiles.length
            ? `Showing ${datedFiles.length} photo${datedFiles.length === 1 ? "" : "s"}.`
            : `No photos found in ${folder}/.`;
    } catch (error) {
        status.textContent = "Could not load photos. Check the connection and try again later.";
        console.error(`Could not load the ${year} photo gallery.`, error);
    }
}

const gallery = document.querySelector(".image-gallery");
if (gallery) {
    loadGallery(gallery);
}
