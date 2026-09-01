(function (Scratch) {
    "use strict";

    if (!Scratch.extensions.unsandboxed) {
        throw new Error("Extension này cần Run without sandbox");
    }

    const runtime = Scratch.vm.runtime;

    class OutsideStage {
        constructor() {
            this.enabled = false;

            this.canvas =
                document.createElement("canvas");

            this.ctx =
                this.canvas.getContext("2d", {
                    alpha: true,
                    willReadFrequently: false
                });

            Object.assign(this.canvas.style, {
                position: "fixed",
                left: "0",
                top: "0",
                width: "100vw",
                height: "100vh",
                pointerEvents: "none",
                zIndex: "2147483647"
            });

            document.body.appendChild(
                this.canvas
            );

            this.effectCanvas =
                document.createElement("canvas");

            this.effectCtx =
                this.effectCanvas.getContext("2d", {
                    alpha: true
                });

            this.resize =
                this.resize.bind(this);

            this.loop =
                this.loop.bind(this);

            window.addEventListener(
                "resize",
                this.resize
            );

            this.resize();

            requestAnimationFrame(
                this.loop
            );
        }

        getInfo() {
            return {
                id: "outsidestage",

                name: "Outside Stage",

                color1: "#9966FF",
                color2: "#855CD6",
                color3: "#774DCB",

                blocks: [
                    {
                        opcode: "enable",
                        blockType:
                            Scratch.BlockType.COMMAND,
                        text:
                            "cho phép sprite ra ngoài Stage"
                    },

                    {
                        opcode: "disable",
                        blockType:
                            Scratch.BlockType.COMMAND,
                        text:
                            "tắt sprite ra ngoài Stage"
                    }
                ]
            };
        }

        enable() {
            this.enabled = true;
        }

        disable() {
            this.enabled = false;
            this.clear();
        }

        clear() {
            const dpr =
                window.devicePixelRatio || 1;

            this.ctx.setTransform(
                dpr,
                0,
                0,
                dpr,
                0,
                0
            );

            this.ctx.clearRect(
                0,
                0,
                window.innerWidth,
                window.innerHeight
            );
        }

        resize() {
            const dpr =
                window.devicePixelRatio || 1;

            this.canvas.width =
                Math.round(
                    window.innerWidth * dpr
                );

            this.canvas.height =
                Math.round(
                    window.innerHeight * dpr
                );

            this.canvas.style.width =
                window.innerWidth + "px";

            this.canvas.style.height =
                window.innerHeight + "px";

            this.ctx.setTransform(
                dpr,
                0,
                0,
                dpr,
                0,
                0
            );
        }

        getSkin(target) {
            const renderer =
                runtime.renderer;

            if (!renderer) {
                return null;
            }

            const drawable =
                renderer._allDrawables?.[
                    target.drawableID
                ];

            if (!drawable) {
                return null;
            }

            return drawable.skin || null;
        }

        getEffects(target) {
            const e =
                target.effects || {};

            return {
                color:
                    Number(e.color || 0),

                fisheye:
                    Number(e.fisheye || 0),

                whirl:
                    Number(e.whirl || 0),

                pixelate:
                    Number(e.pixelate || 0),

                mosaic:
                    Number(e.mosaic || 0),

                brightness:
                    Number(e.brightness || 0),

                ghost:
                    Number(e.ghost || 0)
            };
        }

        prepareEffectCanvas(
            source,
            width,
            height
        ) {
            if (
                this.effectCanvas.width !==
                width
            ) {
                this.effectCanvas.width =
                    width;
            }

            if (
                this.effectCanvas.height !==
                height
            ) {
                this.effectCanvas.height =
                    height;
            }

            this.effectCtx.clearRect(
                0,
                0,
                width,
                height
            );

            this.effectCtx.drawImage(
                source,
                0,
                0,
                width,
                height
            );
        }

        applyBrightness(
            width,
            height,
            value
        ) {
            if (!value) {
                return;
            }

            const image =
                this.effectCtx.getImageData(
                    0,
                    0,
                    width,
                    height
                );

            const data =
                image.data;

            const amount =
                Math.max(
                    -100,
                    Math.min(
                        100,
                        value
                    )
                );

            if (amount < 0) {
                const factor =
                    1 + amount / 100;

                for (
                    let i = 0;
                    i < data.length;
                    i += 4
                ) {
                    data[i] *= factor;
                    data[i + 1] *= factor;
                    data[i + 2] *= factor;
                }
            } else {
                const factor =
                    amount / 100;

                for (
                    let i = 0;
                    i < data.length;
                    i += 4
                ) {
                    data[i] =
                        data[i] +
                        (255 - data[i]) *
                        factor;

                    data[i + 1] =
                        data[i + 1] +
                        (255 - data[i + 1]) *
                        factor;

                    data[i + 2] =
                        data[i + 2] +
                        (255 - data[i + 2]) *
                        factor;
                }
            }

            this.effectCtx.putImageData(
                image,
                0,
                0
            );
        }

        applyColor(
            width,
            height,
            value
        ) {
            if (!value) {
                return;
            }

            const image =
                this.effectCtx.getImageData(
                    0,
                    0,
                    width,
                    height
                );

            const data =
                image.data;

            const hue =
                ((value % 200) / 200) *
                360;

            for (
                let i = 0;
                i < data.length;
                i += 4
            ) {
                const r =
                    data[i] / 255;

                const g =
                    data[i + 1] / 255;

                const b =
                    data[i + 2] / 255;

                const max =
                    Math.max(
                        r,
                        g,
                        b
                    );

                const min =
                    Math.min(
                        r,
                        g,
                        b
                    );

                let h = 0;

                const d =
                    max - min;

                if (d !== 0) {
                    if (max === r) {
                        h =
                            60 *
                            (
                                (g - b) / d
                            );
                    } else if (
                        max === g
                    ) {
                        h =
                            60 *
                            (
                                2 +
                                (b - r) / d
                            );
                    } else {
                        h =
                            60 *
                            (
                                4 +
                                (r - g) / d
                            );
                    }
                }

                if (h < 0) {
                    h += 360;
                }

                h =
                    (h + hue) % 360;

                const s =
                    max === 0
                        ? 0
                        : d / max;

                const v = max;

                const c =
                    v * s;

                const hh =
                    h / 60;

                const x =
                    c *
                    (
                        1 -
                        Math.abs(
                            (hh % 2) - 1
                        )
                    );

                let rr = 0;
                let gg = 0;
                let bb = 0;

                if (hh < 1) {
                    rr = c;
                    gg = x;
                } else if (hh < 2) {
                    rr = x;
                    gg = c;
                } else if (hh < 3) {
                    gg = c;
                    bb = x;
                } else if (hh < 4) {
                    gg = x;
                    bb = c;
                } else if (hh < 5) {
                    rr = x;
                    bb = c;
                } else {
                    rr = c;
                    bb = x;
                }

                const m =
                    v - c;

                data[i] =
                    (rr + m) * 255;

                data[i + 1] =
                    (gg + m) * 255;

                data[i + 2] =
                    (bb + m) * 255;
            }

            this.effectCtx.putImageData(
                image,
                0,
                0
            );
        }

applyPixelate(
            width,
            height,
            value
        ) {
            if (value <= 0) {
                return;
            }

            const amount =
                Math.max(
                    1,
                    Math.round(value / 10)
                );

            const image =
                this.effectCtx.getImageData(
                    0,
                    0,
                    width,
                    height
                );

            const data =
                image.data;

            for (
                let y = 0;
                y < height;
                y += amount
            ) {
                for (
                    let x = 0;
                    x < width;
                    x += amount
                ) {
                    const index =
                        (
                            y *
                            width +
                            x
                        ) * 4;

                    const r =
                        data[index];

                    const g =
                        data[index + 1];

                    const b =
                        data[index + 2];

                    const a =
                        data[index + 3];

                    for (
                        let yy = y;
                        yy <
                        Math.min(
                            y + amount,
                            height
                        );
                        yy++
                    ) {
                        for (
                            let xx = x;
                            xx <
                            Math.min(
                                x + amount,
                                width
                            );
                            xx++
                        ) {
                            const i =
                                (
                                    yy *
                                    width +
                                    xx
                                ) * 4;

                            data[i] = r;
                            data[i + 1] = g;
                            data[i + 2] = b;
                            data[i + 3] = a;
                        }
                    }
                }
            }

            this.effectCtx.putImageData(
                image,
                0,
                0
            );
        }

        applyMosaic(
            width,
            height,
            value
        ) {
            if (value <= 0) {
                return;
            }

            const n =
                Math.max(
                    1,
                    Math.floor(value / 10)
                );

            const temp =
                document.createElement(
                    "canvas"
                );

            temp.width = width;
            temp.height = height;

            const tctx =
                temp.getContext("2d");

            tctx.drawImage(
                this.effectCanvas,
                0,
                0,
                width,
                height
            );

            this.effectCtx.clearRect(
                0,
                0,
                width,
                height
            );

            for (
                let yy = 0;
                yy < n;
                yy++
            ) {
                for (
                    let xx = 0;
                    xx < n;
                    xx++
                ) {
                    const sx =
                        xx *
                        width /
                        n;

                    const sy =
                        yy *
                        height /
                        n;

                    const sw =
                        width / n;

                    const sh =
                        height / n;

                    this.effectCtx.drawImage(
                        temp,
                        0,
                        0,
                        width,
                        height,
                        sx,
                        sy,
                        sw,
                        sh
                    );
                }
            }
        }

        drawSprite(
            target,
            stageRect
        ) {
            const skin =
                this.getSkin(target);

            if (!skin) {
                return;
            }

            const source =
                skin._canvas;

            if (!source) {
                return;
            }

            const skinSize =
                skin._size;

            if (
                !skinSize ||
                skinSize.length < 2
            ) {
                return;
            }

            const costumeWidth =
                Number(skinSize[0]);

            const costumeHeight =
                Number(skinSize[1]);

            if (
                costumeWidth <= 0 ||
                costumeHeight <= 0
            ) {
                return;
            }

            let centerX =
                costumeWidth / 2;

            let centerY =
                costumeHeight / 2;

            const rc =
                skin._rotationCenter;

            if (
                rc &&
                rc.length >= 2
            ) {
                centerX =
                    Number(rc[0]);

                centerY =
                    Number(rc[1]);
            }

            const scaleX =
                stageRect.width / 480;

            const scaleY =
                stageRect.height / 360;

            const spriteScale =
                Number(target.size) / 100;

            const spriteX =
                stageRect.left +
                stageRect.width / 2 +
                Number(target.x) *
                scaleX;

            const spriteY =
                stageRect.top +
                stageRect.height / 2 -
                Number(target.y) *
                scaleY;

            const width =
                costumeWidth *
                scaleX *
                spriteScale;

            const height =
                costumeHeight *
                scaleY *
                spriteScale;

            const left =
                spriteX -
                centerX *
                scaleX *
                spriteScale;

            const right =
                spriteX +
                (
                    costumeWidth -
                    centerX
                ) *
                scaleX *
                spriteScale;

            const top =
                spriteY -
                centerY *
                scaleY *
                spriteScale;

            const bottom =
                spriteY +
                (
                    costumeHeight -
                    centerY
                ) *
                scaleY *
                spriteScale;

            if (
                left >= stageRect.left &&
                right <= stageRect.right &&
                top >= stageRect.top &&
                bottom <= stageRect.bottom
            ) {
                return;
            }

            if (
                right < 0 ||
                left > window.innerWidth ||
                bottom < 0 ||
                top > window.innerHeight
            ) {
                return;
            }

            const effects =
                this.getEffects(target);

            const w =
                source.width;

            const h =
                source.height;

            this.prepareEffectCanvas(
                source,
                w,
                h
            );

            this.applyBrightness(
                w,
                h,
                effects.brightness
            );

            this.applyColor(
                w,
                h,
                effects.color
            );

            this.applyPixelate(
                w,
                h,
                effects.pixelate
            );

            this.applyMosaic(
                w,
                h,
                effects.mosaic
            );

            const direction =
                Number(
                    target.direction
                );

            const rotation =
                (
                    direction - 90
                ) *
                Math.PI /
                180;

            const alpha =
                Math.max(
                    0,
                    Math.min(
                        1,
                        1 -
                        effects.ghost / 100
                    )
                );

            const ctx =
                this.ctx;

            ctx.save();

            ctx.globalAlpha =
                alpha;

            ctx.beginPath();

            ctx.rect(
                0,
                0,
                window.innerWidth,
                window.innerHeight
            );

            ctx.rect(
                stageRect.left,
                stageRect.top,
                stageRect.width,
                stageRect.height
            );

            ctx.clip("evenodd");

            ctx.translate(
                spriteX,
                spriteY
            );

            ctx.rotate(
                rotation
            );

            ctx.scale(
                scaleX * spriteScale,
                scaleY * spriteScale
            );

            ctx.drawImage(
                this.effectCanvas,
                0,
                0,
                w,
                h,
                -centerX,
                -centerY,
                costumeWidth,
                costumeHeight
            );

            ctx.restore();

            ctx.globalAlpha = 1;
        }

        update() {
            this.clear();

            if (!this.enabled) {
                return;
            }

            const renderer =
                runtime.renderer;

            if (!renderer) {
                return;
            }

            const stageCanvas =
                renderer.canvas;

            if (!stageCanvas) {
                return;
            }

            const stageRect =
                stageCanvas.getBoundingClientRect();

            for (
                const target
                of runtime.targets
            ) {
                if (target.isStage) {
                    continue;
                }

                if (!target.visible) {
                    continue;
                }

                if (
                    target.drawableID ===
                    undefined
                ) {
                    continue;
                }

                this.drawSprite(
                    target,
                    stageRect
                );
            }
        }

        loop() {
            this.update();

            requestAnimationFrame(
                this.loop
            );
        }
    }

    Scratch.extensions.register(
        new OutsideStage()
    );

})(Scratch);
