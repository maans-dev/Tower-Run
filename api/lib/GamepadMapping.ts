/**
 * Gamepad API mapping of Gamepad controller keys to button id integers
 * @author Liam Searle and Mark van Wyk
 */
export const enum GamepadMapping {

    // Face Buttons For Playstation
    CROSS = 0,
    CIRCLE = 1, 
    SQUARE = 2, 
    TRIANGLE = 3, 

    // Face Buttons For XBox 
    A = 0,
    B = 1,
    X = 2,
    Y = 3,

    // Trigger and Bumper Buttons
    L1 = 4, 
    R1 = 5, 
    L2 = 6, 
    R2 = 7,

    // Navigation Buttons
    BACK = 8,
    START = 9, 

    //Joystick Buttons
    L_STICK_BUTTON = 10,
    R_STICK_BUTTON = 11,

    //Directional Pad Buttons
    DPAD_UP = 12,
    DPAD_LEFT = 13,
    DPAD_RIGHT = 14,
    DPAD_DOWN = 15,

    // PS4-Specific Buttons
    /* _PS4_HOME = 16, // - only use if you know what you are doing */
    PS4_TRACKPAD = 17
}

                             