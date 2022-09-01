$(function () {
    /**
     * Get image resolution.
     *
     * @param {String|Promise} img
     * @return {Promise<Object>}
     */
    const imageResolution = (img) => {
        return new Promise((resolve, reject) => {
            const image = img instanceof Promise ? img : loadImage(img)
            image.then((im) => {
                resolve({width: im?.width, height: im?.height})
            }).catch((err) => {reject(err)})
        })
    }

    /**
     * Get image orientation portrait/landscape based on width/height ratio.
     *
     * @param {String|Promise} img
     * @return {Promise<Object>}
     */
    const imageOrientation = (img) => {
        return new Promise((resolve, reject) => {
            imageResolution(img).then((res) => {
                resolve(res.width / res.height > 1 ? 'landscape' : 'portrait')
            }).catch((err) => { reject(err) })
        })
    }

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
            image.setAttribute('crossorigin', 'anonymous')
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
     * @param {String} fillStyle
     * @return {Promise<String>}
     */
    const fetchImage = (
        images,
        size,
        ctx,
        config,
        fillStyle = 'rgba(0, 0, 0, 0)'
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

                    ctx.fillStyle = fillStyle
                    ctx.fillRect(0, 0, config.baseWidth, config.baseHeight)

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
            value.width = Math.floor(scale_w * value.width)
            value.height = Math.floor(scale_h * value.height)
        }
        return config
    }

    /**
     * Create composition of two images and return promise on such composition.
     *
     * @param {Array<String | Image | Promise>} images
     * @param {Array<Number>} size
     * @param {Object} config
     * @param {String} fillStyle
     * @return {Object}
     */
    const fetchCompositionImage = (
        images,
        size,
        config,
        fillStyle = 'rgba(0, 0, 0, 0)'
    ) => {
        // Create new canvas.
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d');

        // Re-compute image size to desired resolution.
        const config_ = reScale(size, {...config})

        // Fetch image.
        return fetchImage(images, size, ctx, config_, fillStyle)
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
            const promise = fetchCompositionImage(images, [750, 750], conf)

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

    /**
     * Create squared thumbnail of any image.
     *
     * @param {String|Promise} src
     * @param {Number} size
     * @param {String} bgColor
     * @return {Promise}
     */
    const getSquaredThumbnail = (src, size, bgColor = 'rgba(0, 0, 0, 0)') => {
        return new Promise(((resolve, reject) => {
            Promise.all([imageResolution(src), imageOrientation(src)]).then(
                ([resolution, orientation]) => {
                    const a = Math.max(resolution.width, resolution.height)
                    const conf = {
                        baseWidth: a,
                        baseHeight: a,
                        images: [ {xPos: 0, yPos: 0, width: resolution.width, height: resolution.height}]
                    }

                    if (orientation === 'portrait') { conf.images[0].xPos = (a / 2) - (resolution.width / 2) }
                    if (orientation === 'landscape') { conf.images[0].yPos = (a / 2) - (resolution.height / 2) }
                    resolve(fetchCompositionImage([src], [size, size], conf, bgColor))
                }
            ).catch((err) => { reject(err) })
        }))
    }

    const src = './landscape.png'
    const im = loadImage(src)
    getSquaredThumbnail(im, 150, 'rgba(0, 0, 0)').then((r) => {
        $('#img').attr('src', String(r))
    })


    // main("string")
    // const config = [
    //     {
    //         image: 'backgrounds/1007_DMA_Product Mockups_Light Wood_1.jpg',
    //         orientation: 'portrait',
    //         baseWidth: 1500,
    //         baseHeight: 1500,
    //         images: [
    //             {
    //                 xPos: 0,
    //                 yPos: 0,
    //                 height: 1500,
    //                 width: 1500
    //             },
    //             {
    //                 xPos: 661,
    //                 yPos: 177,
    //                 height: 673,
    //                 width: 479
    //             },
    //         ]
    //     },
    //     {
    //         image: 'backgrounds/1007_DMA_Product Mockups_Light Wood_2.jpg',
    //         orientation: 'portrait',
    //         baseWidth: 1500,
    //         baseHeight: 1500,
    //         images: [
    //             {
    //                 xPos: 0,
    //                 yPos: 0,
    //                 height: 1500,
    //                 width: 1500
    //             },
    //             {
    //                 xPos: 387,
    //                 yPos: 220,
    //                 height: 1013,
    //                 width: 720
    //             },
    //         ]
    //     },
    //     {
    //         image: 'backgrounds/1007_DMA_Product Mockups_Light Wood_3.jpg',
    //         orientation: 'portrait',
    //         baseWidth: 1500,
    //         baseHeight: 1500,
    //         images: [
    //             {
    //                 xPos: 0,
    //                 yPos: 0,
    //                 height: 1500,
    //                 width: 1500
    //             },
    //             {
    //                 xPos: 738,
    //                 yPos: 326,
    //                 height: 447,
    //                 width: 318
    //             },
    //         ]
    //     },
    //     {
    //         image: 'backgrounds/1007_DMA_Product Mockups_Light Wood_4.jpg',
    //         orientation: 'portrait',
    //         baseWidth: 1500,
    //         baseHeight: 1500,
    //         images: [
    //             {
    //                 xPos: 0,
    //                 yPos: 0,
    //                 height: 1500,
    //                 width: 1500
    //             },
    //             {
    //                 xPos: 565,
    //                 yPos: 263,
    //                 height: 675,
    //                 width: 480
    //             },
    //         ]
    //     },
    //     {
    //         image: 'backgrounds/1007_DMA_Product Mockups_Light Wood_5.jpg',
    //         orientation: 'landscape',
    //         baseWidth: 1500,
    //         baseHeight: 1500,
    //         images: [
    //             {
    //                 xPos: 0,
    //                 yPos: 0,
    //                 height: 1500,
    //                 width: 1500
    //             },
    //             {
    //                 xPos: 661,
    //                 yPos: 297,
    //                 height: 479,
    //                 width: 673
    //             },
    //         ]
    //     },
    //     {
    //         image: 'backgrounds/1007_DMA_Product Mockups_Light Wood_6.jpg',
    //         orientation: 'landscape',
    //         baseWidth: 1500,
    //         baseHeight: 1500,
    //         images: [
    //             {
    //                 xPos: 0,
    //                 yPos: 0,
    //                 height: 1500,
    //                 width: 1500
    //             },
    //             {
    //                 xPos: 315,
    //                 yPos: 224,
    //                 height: 720,
    //                 width: 1013
    //             },
    //         ]
    //     },
    //     {
    //         image: 'backgrounds/1007_DMA_Product Mockups_Light Wood_7.jpg',
    //         orientation: 'landscape',
    //         baseWidth: 1500,
    //         baseHeight: 1500,
    //         images: [
    //             {
    //                 xPos: 0,
    //                 yPos: 0,
    //                 height: 1500,
    //                 width: 1500
    //             },
    //             {
    //                 xPos: 720,
    //                 yPos: 423,
    //                 height: 320,
    //                 width: 450
    //             },
    //         ]
    //     },
    //     {
    //         image: 'backgrounds/1007_DMA_Product Mockups_Light Wood_8.jpg',
    //         orientation: 'landscape',
    //         baseWidth: 1500,
    //         baseHeight: 1500,
    //         images: [
    //             {
    //                 xPos: 0,
    //                 yPos: 0,
    //                 height: 1500,
    //                 width: 1500
    //             },
    //             {
    //                 xPos: 403,
    //                 yPos: 415,
    //                 height: 480,
    //                 width: 675
    //             },
    //         ]
    //     },
    // ]
    //
    //
    // const total = new Promise((resolve, reject) => {
    //     const callback = {}
    //     for (let [i, c] of enumerate(config)) {
    //         const img_0 = c.pop('image')
    //         const img_1 = c.pop('orientation') + ".png"
    //         const images = [img_0, img_1]
    //
    //         const promise = fetchCompositionImage(images, [750, 750], c)
    //         promise.then((result) => {
    //             const imageElement = document.createElement('img')
    //             imageElement.setAttribute('src', result)
    //             const div = document.createElement('div')
    //             div.setAttribute('id', i)
    //             div.appendChild(imageElement)
    //             callback[i] = div
    //         })
    //     }
    //
    //     let interval = setInterval(function () {
    //         if (Object.entries(callback).length === 8) {
    //             clearInterval(interval)
    //             resolve(callback)
    //         }
    //     }, 100)
    // })
    //
    // total.then((r) => {
    //     const contentElement = document.getElementById('content')
    //     for (let i = 0; i < Object.entries(r).length; ++i)
    //         contentElement.appendChild(r[i])
    // })
})
