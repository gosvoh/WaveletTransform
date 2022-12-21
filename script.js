"use strict";
let originalCanvas = document.getElementById("original");
let originalContext = originalCanvas.getContext("2d", {
    willReadFrequently: true,
});
let transformedCanvas = document.getElementById("transformed");
let transformedContext = transformedCanvas.getContext("2d", {
    willReadFrequently: true,
});
let transformedBackCanvas = document.getElementById("transformed-back");
let transformedBackContext = transformedBackCanvas.getContext("2d", {
    willReadFrequently: true,
});
let cutoffSlider = document.getElementById("cutoff");
let cutoffValue = document.getElementById("cutoff-value");
let img = new Image();
img.src = "./Lenna.png";
img.onload = () => {
    drawImage(img, originalCanvas);
    processImages();
};
document.addEventListener("DOMContentLoaded", () => {
    cutoffValue.value = cutoffSlider.value;
    drawImage(img, originalCanvas);
    processImages();
});
cutoffSlider.addEventListener("input", (event) => {
    cutoffValue.value = cutoffSlider.value;
    processImages();
});
cutoffValue.addEventListener("input", (event) => {
    cutoffSlider.value = cutoffValue.value;
    processImages();
});
const uploadImage = (event) => {
    if (event === null || event.target === null)
        return;
    let target = event.target;
    let files = target.files;
    if (files === null)
        return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        if (event.target === null)
            return;
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
};
function processImages() {
    let imgData = originalContext.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
    let transformedImgData = transform(imgData, parseInt(cutoffSlider.value));
    transformedContext.putImageData(transformedImgData, 0, 0);
    // imgData = transformedContext.getImageData(
    //   0,
    //   0,
    //   transformedCanvas.width,
    //   transformedCanvas.height
    // );
    let transformedBackImgData = transformBack(transformedImgData);
    transformedBackContext.putImageData(transformedBackImgData, 0, 0);
}
function transform(imageData, limit = 0) {
    let data = imageData.data;
    let newImageData = new ImageData(imageData.width, imageData.height);
    for (let i = 0, gs = 0, clr = 0, pos = 0; i < data.length; i += 4) {
        let r, g, b, a = 255;
        if (pos < imageData.width / 2) {
            r = (data[gs + 0] - data[gs + 4]) / 2;
            g = (data[gs + 1] - data[gs + 5]) / 2;
            b = (data[gs + 2] - data[gs + 6]) / 2;
            if (Math.abs(r) <= limit ||
                Math.abs(g) <= limit ||
                Math.abs(b) <= limit) {
                r = 0;
                g = 0;
                b = 0;
            }
            gs += 8;
        }
        else {
            r = (data[clr + 0] + data[clr + 4]) / 2;
            g = (data[clr + 1] + data[clr + 5]) / 2;
            b = (data[clr + 2] + data[clr + 6]) / 2;
            clr += 8;
        }
        newImageData.data[i + 0] = r;
        newImageData.data[i + 1] = g;
        newImageData.data[i + 2] = b;
        newImageData.data[i + 3] = a;
        pos = (pos + 1) % imageData.width;
    }
    return newImageData;
}
function transformBack(imageData) {
    let data = imageData.data;
    let newImageData = new ImageData(imageData.width, imageData.height);
    let dataLeft = new Array(data.length / 2);
    let dataRight = new Array(data.length / 2);
    for (let i = 0, gs = 0, clr = 0, pos = 0; i < data.length; i += 4) {
        if (pos < imageData.width / 2) {
            dataLeft[gs] = {
                r: data[i + 0],
                g: data[i + 1],
                b: data[i + 2],
            };
            gs++;
        }
        else {
            dataRight[clr] = {
                r: data[i + 0],
                g: data[i + 1],
                b: data[i + 2],
            };
            clr++;
        }
        pos = (pos + 1) % imageData.width;
    }
    for (let i = 0, pos = 0; i < newImageData.data.length; i += 8) {
        newImageData.data[i + 0] = dataRight[pos].r + dataLeft[pos].r;
        newImageData.data[i + 1] = dataRight[pos].g + dataLeft[pos].g;
        newImageData.data[i + 2] = dataRight[pos].b + dataLeft[pos].b;
        newImageData.data[i + 3] = 255;
        newImageData.data[i + 4] = dataRight[pos].r - dataLeft[pos].r;
        newImageData.data[i + 5] = dataRight[pos].g - dataLeft[pos].g;
        newImageData.data[i + 6] = dataRight[pos].b - dataLeft[pos].b;
        newImageData.data[i + 7] = 255;
        pos++;
    }
    return newImageData;
}
function drawImage(img, canvas) {
    let ctx = canvas.getContext("2d");
    let x = 0;
    let y = 0;
    let w = ctx.canvas.width;
    let h = ctx.canvas.height;
    // default offset is center
    let offsetX = 0.5;
    let offsetY = 0.5;
    let imgW = img.width, imgH = img.height, r = Math.min(w / imgW, h / imgH), nw = imgW * r, // new prop. width
    nh = imgH * r, // new prop. height
    cx, cy, cw, ch, ar = 1;
    // decide which gap to fill
    if (nw < w)
        ar = w / nw;
    if (Math.abs(ar - 1) < 1e-14 && nh < h)
        ar = h / nh; // updated
    nw *= ar;
    nh *= ar;
    // calc source rectangle
    cw = imgW / (nw / w);
    ch = imgH / (nh / h);
    cx = (imgW - cw) * offsetX;
    cy = (imgH - ch) * offsetY;
    // make sure source rectangle is valid
    if (cx < 0)
        cx = 0;
    if (cy < 0)
        cy = 0;
    if (cw > imgW)
        cw = imgW;
    if (ch > imgH)
        ch = imgH;
    // fill image in dest. rectangle
    ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
}
function downloadImage(id) {
    let canvas = document.getElementById(id);
    let a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${id}.png`;
    a.click();
}
