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
// import { DropJoystickImpl } from 'src/api/lib/DropJoystickImpl.js';

/**
 * End State
 *  if (time = 0 && health = 0) {GAME OVER}
 * Play State
 *  if
 *
 *
 * Start State
 *  immediately press
 *  Then press Spacebar
 *
 *  if(!loading)
 *   Playing state
 *   do nothing
 */

/**
 * ### TOWER LOGIC ###
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

  // initialise the time OCR
  let startX = 145;
  let startY = 1;
  let charWidth = 7;
  let charHeight = 6;
  let charSpacing = 1;
  let numChars = 4;
  let ocrTime: Ocr = new Ocr(
    startX,
    startY,
    charWidth,
    charHeight,
    charSpacing,
    numChars,
    0,
    TOWER_DIGITS
  );

  // initialise the score OCR
  let startXScore = 1;
  let startYScore = 9;
  let charWidthScore = 7;
  let charHeightScore = 6;
  let charSpacingScore = 1;
  let numCharsScore = 8;
  let ocrScore: Ocr = new Ocr(
    startXScore,
    startYScore,
    charWidthScore,
    charHeightScore,
    charSpacingScore,
    numCharsScore,
    0,
    TOWER_DIGITS
  );

   //Setup & Start Dos Game
  let dosGame = new DosEmulator(dos, canvasContainer, emulators);

   //Start Loading
  instructions.addEventListener('click', () => {
    instructions.style.display = 'none';
    loading.style.display = 'block';
    window.parent.postMessage({ event: 'LEVEL_START' }, '*');

    //Start Game
    dosGame.start('/games/tower/tower.jsdos').then((_ci) => {
    //Setp Joystick
      let joystick: DropJoystick = new DropJoystick(
        window,
        controlCanvas,
        buttons,
        dosGame
      );

      //joystick.overrideDirections({up:null, down:null, left:188, right:191})
      //let gamepad:GamepadController = new GamepadController(dosGame, buttons);

      //dosGame.overrideKey(" ", 112)

      /*** Setup Main Loop **/
      // joystick.addTicker(() => {
      //     gamepad.update();
      // })

    //Resize Canvas
      window.addEventListener('resize', () => joystick.resize());

    //Watch Life Bar (Pixels)
      let pixelListener: PixelListener = dosGame.getPixelListenerInstance();
      pixelListener.addWatch(4, 20);

    //Query for pixels
      // setInterval(() => {
      // pixelListener.query().then((values) => {
      //   console.log('COLOUR: ', values);
      // });

    //Query screenshot
      // dosGame.getScreenshot().then((values) => {
      //   console.log(values);
      // });

      //   dosGame.getScreenshot().then((imageData) =>
      //     ocrTime.readDigits(imageData).then((time) => {
      //       console.log('TIME:  ' + time);
      //     })
      //   );
      // }, 1000);

      
      enum state {
        LOADING,
        PLAYING,
        GAME_OVER,
      }

      let currentState = state.LOADING;

      /** State Machine **/
      setInterval(
        () =>
          pixelListener.query().then((values) => {
            dosGame.getScreenshot().then((imageData) => {
              ocrTime.readDigits(imageData).then((time) => {
                if (
                  (time == 0 || values[0] == '#000000') &&
                  currentState == state.PLAYING
                ) 
                {
                  console.log('Game Over');
                  currentState = state.GAME_OVER;
                  console.log('STATE: ', currentState);
                  //submit the score & reload
                  dosGame.getScreenshot().then((imageData) =>
                    ocrScore.readDigits(imageData).then((score) => {
                      console.log('GAME OVER: ' + score);
                      window.parent.postMessage(
                        { event: 'LEVEL_END', score: score, gameID: 'tower' },
                        '*'
                      );
                      setTimeout(() => {
                        window.location.reload();
                      }, 500);
                    })
                  );

                  window.location.reload();
                } else if (currentState == state.LOADING) {
                  console.log('Loading State')
                  dosGame.pressAndReleaseKeySynch(AsciiMapping.N);
                  // console.log('Pressing N');
                  setTimeout(() => {
                    dosGame.pressAndReleaseKey(AsciiMapping.SPACE);
                    // console.log('Pressing SPACE');
                    currentState = state.PLAYING;
                  }, 1000);
                }
                // else if (currentState == state.GAME_OVER) {
                //   console.log('Game Over');
                //   //submit the score & reload
                //   window.location.reload();
                // }
                else {
                  console.log('Playing State');
                  loading.style.display = 'none';
                }
              });
            });

            // START END GAME
            // if (
            //   values[0] === '#000000' ||

            //   (dosGame.getScreenshot().then((imageData) =>
            //     ocrTime.readDigits(imageData).then((time) => {

            //     })
            //   )
            // ))
            // {
            //   //do stuff
            // }
            // // END END GAME
            // else if (values[0] === '#ff55ff') {
            // }
          }),
        1000
      );
    });
  });
};
