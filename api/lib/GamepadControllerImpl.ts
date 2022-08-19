import { GamepadControls } from "./ControlTypes";
import {DosEmulator} from "../api.js";

/**
 * Actual implementation of the Gamepad API
 * @author Mark van Wyk & Liam Searle
 */
export abstract class GamepadControllerImpl {

    private readonly target:DosEmulator;
    private readonly buttons:GamepadControls[] = [];
    private gamepad?:Gamepad | undefined | null;
    private oldState:boolean[] = [];

    protected constructor(target:DosEmulator, buttons:GamepadControls[]) {
        this.target = target;
        this.buttons = buttons;
        window.addEventListener("gamepadconnected", () => {
            this.gamepad = navigator.getGamepads() ? navigator.getGamepads()[0] : (<any>navigator).webkitGetGamepads()[0];
        });
        window.addEventListener("gamepaddisconnected", () => {
            this.gamepad = null;
        })
    }

    update() {
        if (this.gamepad) {
            let state = this.gamepad.buttons.map((button:GamepadButton) => button.pressed)
            if (this.oldState.join() !== state.join()) {
                // let x = this.oldState.filter((oldState, index) => oldState != state[index])
                this.oldState.forEach((value, index) => {
                    if (value !== state[index]) {
                        let mapping:GamepadControls | undefined = this.buttons.find((item) => item.gamepadButton === index);
                        if (mapping && state[index]) {
                            mapping.pressFunction(this.target);
                        } else if (mapping) {
                            mapping.releaseFunction(this.target);
                        }
                    }
                });
            }
            this.oldState = state;
        }
    }
}
