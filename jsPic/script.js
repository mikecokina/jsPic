$(function () {
    const configuration = {
        lSize: {
            lightWood: {
                portrait: {
                    zoomOut: {
                        "image": "1007_DMA_Product Mockups_v2_1500px1.jpg",
                        "bgWidth": 3000,
                        "bgHeight": 3000,
                        "paintWidth": 955,
                        "paintHeight": 1342,
                        "xPos": 1325,
                        "yPos": 356
                    },
                    zoomIn: {
                        "image": "1007_DMA_Product Mockups_v2_1500px2.jpg",
                        "bgWidth": 3000,
                        "bgHeight": 3000,
                        "paintWidth": 1437,
                        "paintHeight": 2021,
                        "xPos": 778,
                        "yPos": 442
                    }
                },
                landscape: {
                    zoomOut: {
                        "image": "1007_DMA_Product Mockups_v2_1500px5.jpg",
                        "bgWidth": 3000,
                        "bgHeight": 3000,
                        "paintWidth": 1344,
                        "paintHeight": 956,
                        "xPos": 1324,
                        "yPos": 597
                    },
                    zoomIn: {
                        "image": "1007_DMA_Product Mockups_v2_1500px6.jpg",
                        "bgWidth": 3000,
                        "bgHeight": 3000,
                        "paintWidth": 2018,
                        "paintHeight": 1440,
                        "xPos": 632,
                        "yPos": 445
                    }
                }
            },
            darkWood: {},
            wineRed: {},
            turquoiseWood: {},
            whiteWood: {},
            blackWood: {}
        },
        mSize: {
            lightWood: {
                portrait: {
                    zoomOut: {
                        "image": "1007_DMA_Product Mockups_v2_1500px3.jpg",
                        "bgWidth": 3000,
                        "bgHeight": 3000,
                        "paintWidth": 639,
                        "paintHeight": 899,
                        "xPos": 1474,
                        "yPos": 650
                    },
                    zoomIn: {
                        "image": "1007_DMA_Product Mockups_v2_1500px4.jpg",
                        "bgWidth": 3000,
                        "bgHeight": 3000,
                        "paintWidth": 960,
                        "paintHeight": 1350,
                        "xPos": 1132,
                        "yPos": 530
                    }
                },
                landscape: {
                    zoomOut: {
                        "image": "1007_DMA_Product Mockups_v2_1500px7.jpg",
                        "bgWidth": 3000,
                        "bgHeight": 3000,
                        "paintWidth": 899,
                        "paintHeight": 639,
                        "xPos": 1442,
                        "yPos": 850
                    },
                    zoomIn: {
                        "image": "1007_DMA_Product Mockups_v2_1500px8.jpg",
                        "bgWidth": 3000,
                        "bgHeight": 3000,
                        "paintWidth": 1347,
                        "paintHeight": 958,
                        "xPos": 807,
                        "yPos": 829
                    }
                }
            },
            darkWood: {},
            wineRed: {},
            turquoiseWood: {},
            whiteWood: {},
            blackWood: {}
        }
    }

    /**
     * Python pop-like method.
     */
    Object.prototype.pop = function() {
        for (let key in this) {
            if (!Object.hasOwnProperty.call(this, key)) continue;
            let result = this[key];
            if (!delete this[key]) throw new Error();
            return result;
        }
    };

    /**
     * Convert canvas to image data.
     *
     * @param {Object} ctx
     * @return {String}
     */
    const canvasReadyCallback = (ctx) => {
        return ctx.canvas.toDataURL('image/png')
    }

    /**
     * Load image from url and return Promise on Image object.
     *
     * @param {String} imageSrc
     * @return {Promise<Image>}
     */
    const loadImage = (imageSrc) => {
        return new Promise((resolve, reject) => {
            let image = new Image()
            image.addEventListener("load", () => {
                resolve(image)
            })
            image.addEventListener("error", (err) => {
                reject(err)
            })
            image.setAttribute('src', imageSrc)
        })
    }

    /**
     * Asynchronously load foreground and background images, create canvas,
     * draw images with desired parameters and return Promise for result.
     *
     * @param {String | Image} background
     * @param {String | Image} foreground
     * @param {Array<Number>} size
     * @param {Object} ctx
     * @param {Object} config
     * @return {Promise<String>}
     */
    const fetchImage = (background, foreground, size, ctx, config) => {
        return new Promise((resolve, reject) => {
            Promise.all([background, foreground].map((entry) => {
                if (typeof entry === 'string')
                    // Expecting image url.
                    return loadImage(entry)
                else if (typeof entry === 'object' && !!entry['src'])
                    // Expecting instance of Image object.
                    return entry
                throw 'Invalid type of input object. Requires {String | Image}';

            })).then(
                (images) => {
                    const bgImage = images[0]
                    const fgImage = images[1]

                    ctx.canvas.width = config.bgWidth
                    ctx.canvas.height = config.bgHeight
                    ctx.drawImage(bgImage, 0, 0, config.bgWidth, config.bgHeight)
                    ctx.drawImage(fgImage, config.xPos, config.yPos, config.paintWidth, config.paintHeight)

                    try {
                        resolve(canvasReadyCallback(ctx))
                    } catch (e) {
                        reject(e)
                    }
                }
            )
        })
    }
    /**
     * Rescale configuration parameters of background and foreground to fit desired resolution.
     *
     * @param {Array<Number>} size
     * @param {Object} config
     * @return {Object}
     */
    const reScale = (size, config) => {
        const [width, height] = size
        const [scale_w, scale_h] = [width / config.bgWidth, height / config.bgHeight]

        config.bgWidth = width
        config.bgHeight = height
        config.paintWidth = Math.ceil(scale_w * config.paintWidth)
        config.paintHeight = Math.ceil(scale_h * config.paintHeight)
        config.xPos = Math.ceil(scale_w * config.xPos)
        config.yPos = Math.ceil(scale_h * config.yPos)

        return config
    }

    /**
     * Create composition of two images and return promise on such composition.
     *
     * @param {String | Image} background
     * @param {String | Image} foreground
     * @param {Array<Number>} size
     * @param {Object} config
     * @return {Object}
     */
    const fetchCompositionImage = (background, foreground, size, config) => {
        // Create new canvas.
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d');
        // Re-compute image size to desired resolution.
        const config_ = reScale(size, {...config})
        // Fetch image.
        return fetchImage(background, foreground, size, ctx, config_)
    }

// Example
    const main = (solution) => {
        /* *********************************
         * String feed solution.
         ********************************* */
        if (solution === 'string') {
            const fgMockup = {portrait: "portrait.png", landscape: "landscape.png"}
            const frame = "lightWood"

            for (let size of ["lSize", "mSize"]) {
                for (let zoom of ["zoomIn", "zoomOut"]) {
                    for (let orientation of ["portrait", "landscape"]) {
                        const fgSrc = fgMockup[orientation]
                        const conf = configuration[size][frame][orientation][zoom]
                        const bgSrc = "backgrounds/" + conf.pop("image")
                        const promise = fetchCompositionImage(bgSrc, fgSrc, [600, 600], conf)

                        promise.then((result) => {
                            const contentElement = document.getElementById('content')
                            const imageElement = document.createElement('img')
                            imageElement.setAttribute('src', result)
                            contentElement.appendChild(imageElement)
                        })

                        promise.then((result) => {
                            console.log(result)
                        })
                    }
                }
            }
        }

        /* *********************************
         * Image instance feed solution.
         ********************************* */
        if (solution === 'image') {
            const bg = "backgrounds/1007_DMA_Product Mockups_v2_1500px2.jpg"
            const fg = "portrait.png"
            const conf = {bgWidth: 3000, bgHeight: 3000, paintWidth: 1437, paintHeight: 2021, xPos: 778, yPos: 442}

            const fgImagePromise = loadImage(fg)
            fgImagePromise.then((fg) => {
                const promise = fetchCompositionImage(bg, fg, [600, 600], conf)
                promise.then((result) => {
                    const contentElement = document.getElementById('content')
                    const imageElement = document.createElement('img')
                    imageElement.setAttribute('src', result)
                    contentElement.appendChild(imageElement)
                })
            })
        }
    }
    main("string")
})