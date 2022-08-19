interface KeyMap {
    [key: number]:number;
}

/**
 * The JSDos Command Interfaace (ci) not longer accepts ASCII codes. They expect JS-Dos specific codes
 * which can be found here:
 * @see https://github.com/js-dos/emulators/blob/main/src/keys.ts
 */
export const reverseKeyMap:KeyMap = {

    /** Arrows **/
    38:265, // up
    40:264, // down
    37:263, // left
    39:262, // right

    /** Special Keys **/
    32:32,  // space
    13:257, // enter
    27:256, // escape

    /** Modifiers **/
    18:342, // alt
    16:340, // shift
    17:341, // left ctrl

    /** NUMBERS **/
    51:51,  // 3

    /** Letters **/
    65:65,  // a
    66:66,  // b
    69:69,  // e   
    72:72,  // h
    75:75,  // k
    83:83,  // s
    88:88,  // x
    80:80,  // p

    /** Punctuation **/
    190:46, // full-stop
    188:44, // comma
    191:47, // forward-slash

    /** Function Keys **/
    123:301,
    112:290
}
