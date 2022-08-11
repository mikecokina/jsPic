$(function () {
    /**
     * Python pop-like method.
     */
    Object.prototype.pop = function () {
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
     * Enumerates array in pythonic way.
     *
     * @param {Iterable} it
     * @param {Number} start
     */
    function* enumerate (it, start = 0) {
        let i = start
        for (const x of it) { yield [i++, x] }
    }

    /**
     * Asynchronously load foreground and background images, create canvas,
     * draw images with desired parameters and return Promise for result.
     *
     * @param {Array<String | Image | Promise>} images
     * @param {Array<Number>} size
     * @param {Object} ctx
     * @param {Object} config
     * @return {Promise<String>}
     */
    const fetchImage = (
        images,
        size,
        ctx,
        config,
    ) => {
        return new Promise((resolve, reject) => {
            Promise.all(images.map((entry) => {
                if (typeof entry === 'string')
                    // Expecting image url.
                    return loadImage(entry)
                else if (typeof entry === 'object' && (!!entry['src'] || entry instanceof Promise))
                    // Expecting instance of Image object or Promise.
                    return entry
                throw 'Invalid type of input object. Requires {String | Image | Promise}'
            })).then(
                (images) => {
                    // Prepare transparent base.
                    ctx.canvas.width = config.baseWidth
                    ctx.canvas.height = config.baseHeight
                    ctx.fillStyle = 'rgba(0, 0, 0, 0)'
                    ctx.fillRect(0, 0, config.width, config.height)

                    for (const [i, img] of enumerate(images)) {
                        const conf = config.images[i]
                        ctx.drawImage(img, conf.xPos, conf.yPos, conf.width, conf.height)
                    }
                    try { resolve(canvasReadyCallback(ctx)) } catch (e) { reject(e) }
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
        const [scale_w, scale_h] = [width / config.baseWidth, height / config.baseHeight]

        config.baseWidth = width
        config.baseHeight = height

        for (const value of config.images) {
            value.xPos = Math.ceil(scale_w * value.xPos)
            value.yPos = Math.ceil(scale_h * value.yPos)
            value.width = Math.ceil(scale_w * value.width)
            value.height = Math.ceil(scale_h * value.height)
        }
        return config
    }

    /**
     * Create composition of two images and return promise on such composition.
     *
     * @param {Array<String | Image | Promise>} images
     * @param {Array<Number>} size
     * @param {Object} config
     * @return {Object}
     */
    const fetchCompositionImage = (
        images,
        size,
        config,
    ) => {
        // Create new canvas.
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d');
        // Re-compute image size to desired resolution.
        const config_ = reScale(size, {...config})

        // Fetch image.
        return fetchImage(images, size, ctx, config_)
    }

// Example
    const main = (solution) => {
        /* *********************************
         * String feed solution.
         ********************************* */
        if (solution === 'string') {
            const conf = {
                baseWidth: 3000,
                baseHeight: 3000,
                images: [
                    {
                        xPos: 0,
                        yPos: 0,
                        width: 3000,
                        height: 3000
                    },
                    {
                        xPos: 778,
                        yPos: 442,
                        width: 1437,
                        height: 2021
                    }
                ]
            }
            const images = ["backgrounds/1007_DMA_Product Mockups_v2_1500px2.jpg", "portrait.png"]
            const promise = fetchCompositionImage(images, [600, 600], conf)

            promise.then((result) => {
                const contentElement = document.getElementById('content')
                const imageElement = document.createElement('img')
                imageElement.setAttribute('src', result)
                contentElement.appendChild(imageElement)
            })
        }

        /* *********************************
         * Image instance feed solution.
         ********************************* */
        if (solution === 'image') {
            const conf = {
                baseWidth: 3000,
                baseHeight: 3000,
                images: [
                    {
                        xPos: 0,
                        yPos: 0,
                        width: 3000,
                        height: 3000
                    },
                    {
                        xPos: 778,
                        yPos: 442,
                        width: 1437,
                        height: 2021
                    }
                ]
            }

            const fgImagePromise = loadImage("portrait.png")
            fgImagePromise.then((fg) => {

                const images = ["backgrounds/1007_DMA_Product Mockups_v2_1500px2.jpg",  fg]

                const promise = fetchCompositionImage(images, [600, 600], conf)
                promise.then((result) => {
                    const contentElement = document.getElementById('content')
                    const imageElement = document.createElement('img')
                    imageElement.setAttribute('src', result)
                    contentElement.appendChild(imageElement)
                })
            })
        }
        /* *********************************
         * Promise feed solution.
         ********************************* */
        if (solution === 'promise') {
            const conf = {
                baseWidth: 3000,
                baseHeight: 3000,
                images: [
                    {
                        xPos: 0,
                        yPos: 0,
                        width: 3000,
                        height: 3000
                    },
                    {
                        xPos: 778,
                        yPos: 442,
                        width: 1437,
                        height: 2021
                    },
                    {
                        xPos: 778,
                        yPos: 442,
                        width: 1437,
                        height: 2021
                    }
                ]
            }
            const images = [
                "backgrounds/1007_DMA_Product Mockups_v2_1500px2.jpg",
                loadImage("portrait.png"),
                loadImage("signature.png")
            ]

            const promise = fetchCompositionImage(images, [600, 600], conf)
            promise.then((result) => {
                const contentElement = document.getElementById('content')
                const imageElement = document.createElement('img')
                imageElement.setAttribute('src', result)
                contentElement.appendChild(imageElement)
            })
        }
    }
    main("string")
})
