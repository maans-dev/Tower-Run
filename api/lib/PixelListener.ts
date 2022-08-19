
import {DosEmulatorImpl} from "./DosEmulatorImpl.js";
import {GameTools} from "../api.js";

interface PixelWatcher {
    x:number;
    y:number;
}

export class PixelListener {

    private watchers:PixelWatcher[] = [];
    private static instance:PixelListener | undefined;
    private readonly dosEmulator:DosEmulatorImpl

    private constructor(dosEmulator:DosEmulatorImpl) {
        this.dosEmulator = dosEmulator;
    }

    static getInstance(dosEmulator:DosEmulatorImpl) {
        if (!this.instance) this.instance = new PixelListener(dosEmulator);
        return this.instance;
    }

    /**
     * Add a pixel to be returned during query();
     * @param x the x coordinate
     * @param y the y coordinate
     */
    addWatch(x:number, y:number):void {
        let watcher:PixelWatcher;
        watcher = {x:x, y:y};
        this.watchers.push(watcher);
    }

    /**
     *
     */
    query():Promise<string[]> {
        return new Promise((resolve, reject) => {
            let tempCanvas = window.document.createElement("canvas");
            tempCanvas.width = 320;
            tempCanvas.height = 200;
            let tempCanvasContext: CanvasRenderingContext2D = <CanvasRenderingContext2D>tempCanvas.getContext("2d")!;
            this.dosEmulator.getCommandInterface().screenshot().then((imageData: ImageData) => {
                tempCanvasContext.putImageData(imageData, 0, 0);
                let values:string[] = [];
                this.watchers.forEach(watcher => {
                    let pixelColor: ImageData = tempCanvasContext.getImageData(watcher.x, watcher.y, 1, 1);
                    let hexValue:string = '#' + GameTools.getHexValue(pixelColor.data[0]) + GameTools.getHexValue(pixelColor.data[1]) + GameTools.getHexValue(pixelColor.data[2]);
                    values.push(hexValue);
                })
                resolve(values);
            });
        });
    }
}
