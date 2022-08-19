import {DosEmulator} from "../api.js";
import {GamepadMapping} from "./GamepadMapping.js";

/**
 * Common to both DropJoystick and Gamepad
 */
export interface ButtonFunctions {
    name?:string
    pressFunction:(dosGame:DosEmulator) => void,
    releaseFunction:(dosGame:DosEmulator) => void
}

/**
 * DropJoystick only. Will be merged with ButtonFunctions
 */
export interface DropJoystickButtons {
    iconPath?:string,
    hexColour?:number,
}

/**
 * Gamepad only. Will be merged with ButtonFunctions
 */
export interface GamepadButtons {
    gamepadButton:GamepadMapping
}

/**
 * GamepadControls merges Gamepad Buttons & ButtonFunctions
 */
export type GamepadControls = GamepadButtons & ButtonFunctions

/**
 * DropJoystickControls merges Dropjoystick Buttons & ButtonFunctions
 */
export type DropJoystickControls = DropJoystickButtons & ButtonFunctions
