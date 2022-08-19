import {
  DosEmulator,
  GameTools,
  DropJoystick,
  GamepadController,
  AsciiMapping,
} from '../../api/api.js';
import { buttons } from './tower-controls.js';
import { PixelListener } from '../../api/lib/PixelListener.js';
import { TOWER_DIGITS } from './tower-digits.js';
import { Ocr } from '../../api/lib/Ocr.js';
import { emergeGamingSDK } from '../../api/emergamingSDK.js';
import { DropJoystickImpl } from 'src/api/lib/DropJoystickImpl.js';

/**
 * ### DIGGER LOGIC ###
 * ---------------------
 *
 * Pass through global variables (from other script tags) and/or required DOM elements that the game needs to run
 * @param dos the JsDos "dos" element
 * @param canvasContainer the container in which JsDos can pop all it's elements (i.e. the DOS game canvas)
 * @param emulators a required DOSBox global variable
 * @param controlCanvas the canvas (overlay) that we created in order to display the DropJoystick over the game canvas
 * @param instructions the instructions "screen". Think DIV
 * @param loading the loading "screen". Think DIV
 * @param window the DOM window object
 */
export const runTower = (
  dos: any,
  canvasContainer: HTMLDivElement,
  emulators: any,
  controlCanvas: HTMLCanvasElement,
  loading: HTMLElement,
  instructions: HTMLDivElement,
  window: Window
) => {
  /*** Setup ***/
  GameTools.disableBrowserShortcuts();

  let startX = 12;
  let startY = 0;
  let charWidth = 10;
  let charHeight = 12;
  let charSpacing = 2;
  let numChars = 5;

  let ocr: Ocr = new Ocr(
    startX,
    startY,
    charWidth,
    charHeight,
    charSpacing,
    numChars,
    0,
    TOWER_DIGITS
  );

  /*** Setup and Start DOS Game ***/
  let dosGame = new DosEmulator(dos, canvasContainer, emulators);

  instructions.addEventListener('click', () => {
    // console.log ("CLICK")
    instructions.style.display = 'none';
    loading.style.display = 'none';

    dosGame.start('/games/tower/tower.jsdos').then((_ci) => {
      /*** Setup Joystick ***/
      let joystick: DropJoystick = new DropJoystick(
        window,
        controlCanvas,
        buttons,
        dosGame
      );

      //joystick.overrideDirections({up:null, down:null, left:188, right:191})
      //let gamepad:GamepadController = new GamepadController(dosGame, buttons);

      //   document.addEventListener('keydown', (e) => {
      //     if (e.key == ' ') {
      //       dosGame.pressAndReleaseKey(112);
      //       e.preventDefault();
      //       e.stopImmediatePropagation();
      //     }
      //   });

      //dosGame.overrideKey(" ", 112)

      /*** Setup Main Loop **/
      // joystick.addTicker(() => {
      //     gamepad.update();
      // })

      /*** Resize Canvas ***/
      window.addEventListener('resize', () => joystick.resize());

      /** Watch Pixels **/
      let pixelListener: PixelListener = dosGame.getPixelListenerInstance();
      pixelListener.addWatch(0, 97);

      setInterval(() => {
        pixelListener.query().then((values) => {
          console.log(values);
        });

        dosGame.getScreenshot().then((values) => {
          console.log(values);
        });
      }, 1000);

      /** State Machine **/
      //     setInterval(() => pixelListener.query().then((values) => {
      //         switch(values[0]) {
      //             case '#000000':
      //                 let started = false
      //                 setTimeout(() => {
      //                     console.log("Enter pressed...")
      //                     dosGame.pressAndReleaseKey(13);
      //                 }, 300)
      //                 setTimeout(() => {
      //                     loading.style.display = 'none'
      //                 }, 400)
      //                 if (!started) {
      //                     // emergeGamingSDK.startLevel();
      // 					window.parent.postMessage({event: "LEVEL_START"}, '*')
      //                     started = true}
      //                 break;
      //             case '#55ffff':
      //                 break;
      //             case '#ffffff':
      //                 let submitted = false;
      //                 setTimeout(() => {
      //                     dosGame.getScreenshot().then((imageData) => ocr.readDigits(imageData).then((score) => {
      //                         console.log ("GAME OVER: " + score);
      //                         if(!submitted){
      //                             // emergeGamingSDK.endLevel(score);
      // 							window.parent.postMessage({event: "LEVEL_END", score: score, gameID: 'digger'}, '*')
      //                             submitted = true;
      //                         }
      //                         setTimeout(() => {
      //                             window.location.reload()
      //                         }, 400);
      //                     }))
      //                 }, 500);
      //             break;
      //         default:
      //            console.debug('Colour from another mother');
      //     }
      // }), 1000);
    });
  });
};
