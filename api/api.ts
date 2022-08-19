import {DropJoystickImpl} from "./lib/DropJoystickImpl.js";
import {GamepadControllerImpl} from "./lib/GamepadControllerImpl.js"
import {GamepadControls, DropJoystickControls} from "./lib/ControlTypes.js";
import {DosEmulatorImpl} from "./lib/DosEmulatorImpl.js";
import {GameTools as GameTools} from "./lib/GameTools.js";
import {AsciiMapping} from "./lib/AsciiMapping.js";

export class DosEmulator extends DosEmulatorImpl {
    constructor(dos:any, canvasContainer:HTMLDivElement, emulators:any) {
        super(dos, canvasContainer, emulators);
    }
}

export class DropJoystick extends DropJoystickImpl {
    constructor(_window:Window, canvas:HTMLCanvasElement, buttons:DropJoystickControls[], target:DosEmulator) {
        super(_window, canvas, buttons, target);
    }
}

export class GamepadController extends GamepadControllerImpl {
    constructor(target:DosEmulator, buttons:GamepadControls[]) {
        super(target, buttons);
    }
}

export {GameTools, AsciiMapping, GamepadControls, DropJoystickControls}
