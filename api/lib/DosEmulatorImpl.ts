import { reverseKeyMap } from "./jsDosReverseKeyMap.js";
import { PixelListener} from "./PixelListener.js";

interface KeyMapping {
    targetKey: string
    replacementKeyCode: number
}

export abstract class DosEmulatorImpl {

    private readonly dos:any;
    private canvasContainer:any;
    private canvas:HTMLCanvasElement | undefined;
    private emulators:any;
    private ci:any;
    private webGLContext:WebGLRenderingContext | undefined;
    private keysToReplace:KeyMapping[] = []
    private readonly forceKeyPress:boolean = false;
    private keysDown:string[] = []

    private readonly dosboxPath:string = '/jsdos/';

    /**
     * Create a new JsDOS / DosBox Emulator Instance
     * @param dos the reference to window.DOS from Js-Dos 7
     * @param canvasContainer the DIV element in which to put the container
     * @param emulators the reference to window.emulators from Js-Dos 7
     */
    protected constructor(dos:any, canvasContainer:HTMLDivElement, emulators:any) {
        this.dos = dos;
        this.canvasContainer = canvasContainer;
        this.emulators = emulators;
    }

    /**
     * Initialise the Js-Dos 7 emulator, unpack and run the bundle specified in bundlePath
     * @param bundlePath the path to where the .jsdos bundle file for the game can be found.
     */
    start(bundlePath:string) {
        return new Promise(async (resolve) => {
            this.emulators.pathPrefix = this.dosboxPath;
            this.dos(this.canvasContainer).run(bundlePath).then((ci:any)=>{
                this.ci = ci;
                this.canvas = <HTMLCanvasElement>this.canvasContainer.getElementsByTagName('canvas')[0];
                this.webGLContext = this.canvas.getContext("webgl")!;
                resolve(ci);
            });
        })
    }

    /**
     * Presses an ASCII key (true) or releases it (false)
     * @param ascii the ascii code (e.g. AsciiMapping.ENTER maps to 13)
     * @param pressed true if pressed, false if released
     */
    pressKey(ascii:number | null, pressed:boolean) {
        if (!ascii) {
            console.warn("pressKey was called with a null ASCII code")
            return
        }
        let jsDosKeyCode =  reverseKeyMap[ascii];
        if (!jsDosKeyCode) throw new Error("No Jsdos 7 Key Code Mapping for ASCII " + ascii);
        this.ci.sendKeyEvent(jsDosKeyCode, pressed)
    }

    pressAndReleaseKeySynch(ascii:number, wait:number = 0):Promise<any> {
        return new Promise<unknown>((resolve, reject) =>
            setTimeout (() => {
                this.pressKey(ascii, true);
                setTimeout(() => this.pressKey(ascii, false), 100);
                if (wait > 0 && resolve) resolve(null);
            }, wait)
        )
    }

    pressAndReleaseKey(ascii:number) {
        this.pressKey(ascii, true);
        setTimeout(() => this.pressKey(ascii, false), 100);
    }

    /**
     * Returns a Promise that resolves a PNG DataURL of the PNG image.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
     */
    getScreenshot():Promise<string> {
        return new Promise((resolve, reject) => {
            let tempCanvas = window.document.createElement("canvas");
            tempCanvas.width = 320;
            tempCanvas.height = 200;
            let tempCanvasContext:CanvasRenderingContext2D = <CanvasRenderingContext2D>tempCanvas.getContext("2d")!;
            this.ci.screenshot().then((imageData:ImageData) => {
                tempCanvasContext.putImageData(imageData, 0, 0);
                let pngData = tempCanvas.toDataURL("image/png")
                resolve (pngData);
            });
        });
    }

    /**
     * Capture a key (hopefully before the emulator gets it and replace it with a different key
     * @param targetKey the event.key (not the ascii code) we're looking for.
     * @param replacementKeyCode the ASCII key to send to DOSBox
     * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
     */
     public overrideKey(targetKey:string, replacementKeyCode:number):void {
        if (this.keysToReplace.length === 0) this.addKeyEventListeners()
        this.keysToReplace.push({targetKey:targetKey, replacementKeyCode:replacementKeyCode})
    }

    /**
     * Create key event listeners
     * @private
     */
     private addKeyEventListeners() {
        window.addEventListener('keyup', this.handleKeyEvent.bind(this))
        window.addEventListener('keydown', this.handleKeyEvent.bind(this))
    }

     /**
     * When a key is pressed (keydown) or released (keyup), check to see if it's a mapped key and rather send the
     * preferred key to DosBox.
     * @param event KeyboardEvent of the pressed or released key
     * @private
     */
      private handleKeyEvent(event:KeyboardEvent) {

        if ((event.type === 'keydown' || event.type === 'keyup') && event.metaKey == false) {
            let keyCode = this.findReplacementKeyCode(event.key);
            if (keyCode) {
                if (event.type === 'keydown' && !this.keysDown.includes(event.key)) {
                    this.forceKeyPress ? this.ci.sendKeyEvent(keyCode, true) : this.ci.sendKeyEvent(keyCode, true)
                    this.keysDown.push(event.key)
                }
                if (event.type === 'keyup' && this.keysDown.includes(event.key)) {
                    this.forceKeyPress ? this.ci.sendKeyEvent(keyCode, false) : this.ci.sendKeyEvent(keyCode, false)
                    this.keysDown.splice(this.keysDown.indexOf(event.key),1);
                }
                event.stopImmediatePropagation();
                event.stopPropagation();
                event.preventDefault();
            }
        }
    }

    private findReplacementKeyCode(key:string) {
        return this.keysToReplace.find(item => item.targetKey == key)?.replacementKeyCode || null;
    }


    /**
     * Returns the Dos7 Command Interface (ci)
     */
    public getCommandInterface():any {
        return this.ci;
    }

    /**
     * Returns a Pixel Listener
     */
    public getPixelListenerInstance() {
        return PixelListener.getInstance(this);
    }
}

