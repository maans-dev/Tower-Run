import * as PIXI from '../../pixi/pixi.js'
import { DropJoystickControls } from "./ControlTypes.js";
import {DosEmulator} from "../api.js";

interface SpritableControl extends DropJoystickControls{
    sprite?:PIXI.Sprite | PIXI.Container;
    active?:boolean
}

interface DirectionMapping {
    'up':number | null,
    'down':number | null,
    'left':number | null,
    'right':number | null
}

/**
 * Implementation of the DropJoystick API
 * Instantiate this class via DropJoystick in api.ts
 * @author Mark van Wyk
 */
export abstract class DropJoystickImpl {

    private readonly canvas:HTMLCanvasElement;
    private readonly pixiApp:PIXI.Application;
    private readonly window:Window;
    private readonly target:DosEmulator;
    private readonly buttons:SpritableControl[];
    private circle:PIXI.Sprite | undefined;
    private ring:PIXI.Sprite | undefined;

    private directionMapping:{[key: string]:number | null}  = {
        'up': 38,
        'down': 40,
        'left': 37,
        'right': 39
    };

    /**
     *
     * @param _window a reference to the DOM window object
     * @param canvas a canvas that overlays the game that can be used to display and control the DropJoystick
     * @param buttons DropJoystickControls[] a list of buttons with their colours, icons and press and release actions
     * @param target At the moment it expects a DosEmulator instance
     * @protected do not call this class directly. Call DropJoystick in api.ts
     */
    protected constructor(_window:Window, canvas:HTMLCanvasElement, buttons:DropJoystickControls[], target:DosEmulator) {
        this.canvas = canvas;
        this.window = _window;
        this.pixiApp = new PIXI.Application({width: this.window.innerWidth, height: this.window.innerHeight, view: canvas, resizeTo:this.window, antialias:true});
        this.pixiApp.renderer.backgroundAlpha = 0;
        this.buttons = <SpritableControl[]>buttons;
        this.target = target;
        this.setupGraphics();
        this.start();

        // dont show touch controls if there are no touch points
        if (!navigator.maxTouchPoints || navigator.maxTouchPoints == 0) {
            this.canvas.style.display = 'none'
        }

    }

    /**
     * PIXI has a main event loop. Add all your main control loop functions to be executed it here.
     * @param ticker a function that must be executed in the main control loop
     */
    public addTicker(ticker:PIXI.TickerCallback<any>) {
        this.pixiApp.ticker.add(ticker)
    }

    /**
     * Resize the canvas and reposition the buttons.
     */
    public resize() {
        this.repositionButtons();
        this.pixiApp.renderer.resize(window.innerWidth, window.innerHeight);
    }

    /**
     * Allow overriding of touch drag directions to ASCII keys. Defaults to arrow keys but can be remapped
     * with this method
     * @param directionMapping a new direction mapping.
     */
    public overrideDirections(directionMapping:DirectionMapping) {
        this.directionMapping.up = directionMapping.up;
        this.directionMapping.down = directionMapping.down;
        this.directionMapping.left = directionMapping.left;
        this.directionMapping.right = directionMapping.right;
    }

    /*** Private Methods **/

    private setupGraphics() {
        // let glowFilter = new PIXI.filters.GlowFilter({distance:25, outerStrength:2})

        /** PIXI:Graphics **/
        let graphicsCircle = new PIXI.Graphics();
        graphicsCircle.beginFill(0x33AAFF);
        graphicsCircle.lineStyle(0);
        graphicsCircle.drawCircle(0,0,30);
        graphicsCircle.endFill();
        graphicsCircle.interactive = false;

        let graphicsRing = new PIXI.Graphics();
        graphicsRing.lineStyle(8, 0x3355FF);
        graphicsRing.drawCircle(0,0,50);
        graphicsRing.interactive = false;

        /** PIXI:Sprite **/
        let circleTexture = this.pixiApp.renderer.generateTexture(graphicsCircle)
        this.circle = new PIXI.Sprite(circleTexture);
        this.circle.anchor.set(0.5)
        this.circle.visible = false;
        this.circle.alpha = 0.5
        this.pixiApp.stage.addChild(this.circle);

        let ringTexture = this.pixiApp.renderer.generateTexture(graphicsRing);
        this.ring = new PIXI.Sprite(ringTexture)
        this.ring.anchor.set(0.5)
        this.ring.visible = false;
        this.ring.alpha = 0.5
        this.ring.blendMode = PIXI.BLEND_MODES.ADD;
        this.pixiApp.stage.addChild(this.ring);

        for (let i = 0; i < this.buttons.length ; i++) {

            let iconPath = this.buttons[i].iconPath;
            let hexColour = this.buttons[i].hexColour

            if (iconPath && hexColour) {

                let graphicsButton = new PIXI.Graphics();
                graphicsButton.beginFill(this.buttons[i].hexColour);
                graphicsButton.lineStyle(0);
                graphicsButton.drawCircle(0,0,20);
                graphicsButton.endFill();

                graphicsButton.lineStyle(4, hexColour);
                graphicsButton.drawCircle(0,0,25);

                let buttonTexture = this.pixiApp.renderer.generateTexture(graphicsButton);

                let button = new PIXI.Sprite(buttonTexture);
                button.anchor.set(0.5)

                let svgTexture = PIXI.Texture.from(iconPath);

                let svgSprite = new PIXI.Sprite(svgTexture);
                svgSprite.anchor.set(0.5);

                let buttonContainer = new PIXI.Container();
                buttonContainer.addChild(button);
                buttonContainer.addChild(svgSprite);

                buttonContainer.alpha = 0.5;

                this.buttons[i].sprite = buttonContainer
                this.pixiApp.stage.addChild(buttonContainer);

            }

        }

        this.repositionButtons();

    }

    private repositionButtons() {
        let xStart = (window.innerWidth - 60)
        let yStart = window.innerHeight - 150;

        for (let i = 0; i < this.buttons.length ; i++) {
            if (this.buttons[i].hexColour) {
                let offSet = (i % 2 * -1 - 1) * 35;
                let sprite = this.buttons[i].sprite;
                if (sprite?.position) {
                    sprite.position.x = xStart + offSet;
                    sprite.position.y = yStart + (-i * 50);
                    sprite.visible = true;
                } else {
                    console.warn("Error. Button does not have an attached sprite");
                }
            }
        }
    }

    private start() {

        /** Variables **/

        let mouseState = 'none';
        let xc = 0, yc = 0;
        let lastX = 0;
        let lastY = 0;
        let lastDirection:string[] = [];

        this.pixiApp.stage.interactive = true;

        interface PIXIMouseEvent extends MouseEvent {
            data:any
        }

        this.pixiApp.renderer.plugins.interaction.on('pointerdown', (event:PIXIMouseEvent) => {

            /** MOUSEDOWN **/
            let x = event.data.global.x;
            let y = event.data.global.y;
            if (x < window.innerWidth - 200) {
                xc = x;
                yc = y;
                mouseState = 'just-down'
            } else {
                for (let i = 0; i < this.buttons.length; i++) {

                    let sprite = this.buttons[i].sprite;
                    if (sprite?.position) {
                        if (Math.abs(sprite.position.x - x) < 25 && Math.abs(sprite.position.y - y) < 25) {
                            this.buttons[i].active = true;
                            sprite.alpha = 1
                            this.buttons[i].pressFunction(this.target);
                            //window.navigator.vibrate(20);
                            // sprite.filters = [
                            //     glowFilter
                            // ]
                        }
                    }
                }
            }
        });

        this.pixiApp.renderer.plugins.interaction.on('pointermove', (event:PIXIMouseEvent) => {
            /** MOUSEMOVE **/
            let x = event.data.global.x;
            let y = event.data.global.y;
            if (x < window.innerWidth -200 && y < window.innerHeight && x > 0 && y > 0) {
                xc = x;
                yc = y;
            } else {
                xc = lastX;
                yc = lastY;
            }
        });

        this.pixiApp.renderer.plugins.interaction.on('pointerup', (event:PIXIMouseEvent) => {
            /** MOUSEUP **/
            let x = event.data.global.x;
            if (x < window.innerWidth - 200) {
                mouseState = 'just-up'
            } else {
                for (let i = 0; i < this.buttons.length; i++) {
                    let b:SpritableControl = this.buttons[i];
                    if (b?.active && b.sprite) {
                        b.active = false;
                        //window.navigator.vibrate(3);
                        b.sprite.alpha = 0.5
                        b.releaseFunction(this.target)
                        b.sprite.filters = []
                    }
                }
            }
        });

        this.pixiApp.ticker.add(() => {

            if (!this.circle || !this.ring) {
                console.error("ERROR: No Ring or Circle Sprite")
                return;
            }

            if (mouseState === 'just-down') {
                this.circle.position.x = xc;
                this.circle.position.y = yc;

                this.circle.visible = true;
                this.ring.visible = true;

                this.ring.position.x = this.circle.position.x;
                this.ring.position.y = this.circle.position.y;

                mouseState = 'down'
            }

            if (mouseState === 'down') {

                if (!this.circle || !this.ring) {
                    console.error("ERROR: No Ring or Circle Sprite")
                    return;
                }

                this.circle.position.x = xc;
                this.circle.position.y = yc;

                let xr = this.ring.position.x;
                let yr = this.ring.position.y;

                let dx = xc - xr;
                let dy = yc - yr;
                let control:string[] = [];

                let r = Math.hypot(dx, dy);

                /**s @TODO: We can make less controls **/
                if (r > 7 && r < 50) {
                    let rangeInner = dy * 0.38;
                    let rangeOuter = dy * 2.61;
                    if (dx < -Math.abs(rangeOuter)) {
                        control = ['left']
                    } else if (dy < 0 && dx < rangeInner) {
                        control = ['up', 'left']
                    } else if (dy < 0 && dx < Math.abs(rangeInner)) {
                        control = ['up']
                    } else if (dy < 0 && dx < -rangeOuter) {
                        control = ['up', 'right']
                    } else if (dx > Math.abs(rangeOuter)) {
                        control = ['right']
                    } else if (dy > 0 && dx < -Math.abs(rangeInner)) {
                        control = ['down', 'left']
                    } else if (dy > 0 && dx < rangeInner) {
                        control = ['down']
                    } else if (dy > 0 && dx < dy * rangeOuter) {
                        control = ['down', 'right']
                    } else {
                        console.error("Not a known angle / direction")
                    }
                    this.processDirectionChange(lastDirection, control)
                    lastDirection = control;
                }

                if (r > 50) {
                    let xDiff = xc - lastX;
                    let yDiff = yc - lastY;
                    this.ring.position.x += xDiff;
                    this.ring.position.y += yDiff;
                }
            }

            if (mouseState === 'just-up') {

                if (!this.circle || !this.ring) {
                    console.error("ERROR: No Ring or Circle Sprite")
                    return;
                }

                this.circle.visible = false;
                this.ring.visible = false

                mouseState = 'up'
                this.processDirectionChange(lastDirection, [])
                lastDirection = []
            }

            lastX = xc;
            lastY = yc;

        })
    }

    private processDirectionChange(was:string[], is:string[]) {

        let turnOff = was.filter(w => is.indexOf(w) === -1)
        let turnOn = is.filter(i => was.indexOf(i) === -1)

        turnOff.forEach((direction) => {
            //window.navigator.vibrate(3);
            let ascii = this.directionMapping[direction];
            if (ascii) this.target.pressKey(ascii, false);

        });

        turnOn.forEach((direction) => {
            //window.navigator.vibrate(20);
            let ascii = this.directionMapping[direction]
            if (ascii) this.target.pressKey(ascii, true);
        });
    }

    // @TODO: What if the the keycode is not found in the map?
    private getDirectionMapping(direction:string):number | null {
        return this.directionMapping[direction]
    }
}
