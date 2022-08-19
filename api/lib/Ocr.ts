/**
 * @author Mark van Wyk
 */
export class Ocr {

    private startX:number;
    private startY:number;
    private readonly charWidth:number;
    private readonly charHeight:number;
    private readonly charSpacing:number;
    private readonly numChars:number;
    private readonly thousandsSeparatorWidth: number;
    private referenceChars: string[];
    private processedReferenceChars: string[] = [];

    /**
     * Sets up a score reader, telling the OCR the location and dimensions of the digits on the screenshot.
     * Reference digits are passed in as data urls that the OCR will use to compare.
     *
     * @param startX x value of the top left corner where the first digit starts on the screenshot
     * @param startY y value of the top left corner where the first digit starts on the screenshot
     * @param charWidth width of each individual character to be lifted from the screenshot
     * @param charHeight
     * @param charSpacing
     * @param numChars
     * @param thousandsSeparatorWidth
     * @param referenceChars
     */
    public constructor(startX:number, startY:number, charWidth:number, charHeight:number, charSpacing:number, numChars:number, thousandsSeparatorWidth: number, referenceChars:string[]) {
        this.startX = startX;
        this.startY = startY;
        this.charWidth = charWidth;
        this.charHeight = charHeight;
        this.charSpacing = charSpacing;
        this.numChars = numChars;
        this.thousandsSeparatorWidth = thousandsSeparatorWidth;
        this.referenceChars = referenceChars;

        this.processReferenceChars(referenceChars)
    }

    public readDigits(screenshotImageData:string):Promise<number> {

        let stack:Promise<string>[] = [];
        let scoreChars:string[] = [];

        return new Promise(resolve => {
            for (let charNo:number = 0; charNo < this.numChars; charNo++) {
                let ifThousandSeparator = 0;
                if (this.thousandsSeparatorWidth > 0 && charNo <= this.numChars - 4) {
                    ifThousandSeparator = this.thousandsSeparatorWidth - this.charSpacing;
                }
                let promise:Promise<string> = <Promise<string>>Ocr.getSubImage(screenshotImageData, this.startX + (charNo * (this.charWidth + this.charSpacing)) - ifThousandSeparator, this.startY, this.charWidth, this.charHeight).then((dataUrl) => {
                    scoreChars[charNo] = dataUrl;
                });
                stack.push(promise)
            }
            Promise.all(stack).then(() => {
                let scoreString = "";
                for (let charNo:number = 0; charNo < scoreChars.length; charNo++) {
                    let currentChar = scoreChars[charNo];
                    let detectedChar = null;
                    for (let digitNo:number = 0; digitNo < 10; digitNo++) {
                        let currentDigit = this.processedReferenceChars[digitNo];
                        if (currentChar === currentDigit) {
                            detectedChar = digitNo;
                            break;
                        }
                    }
                    if (!detectedChar) {
                        if (currentChar === this.processedReferenceChars[10]) {
                            detectedChar = '-';
                        }
                    }
                    if (detectedChar || detectedChar === 0) {
                        scoreString += detectedChar;
                    }
                }
                resolve(parseInt(scoreString));
            })
        });
    }

    /*** Private Methods ***/

    private processReferenceChars(referenceChars:string[]):void {
        for (let charNo = 0; charNo < referenceChars.length; charNo ++) {
            Ocr.getSubImage(this.referenceChars[charNo], 0, 0, this.charWidth, this.charHeight).then((dataUrl:string) => {
                this.processedReferenceChars[charNo] = dataUrl;
            })
        }
    }

    /**
     * Takes an Data URL (i.e. screenshot) and creates another Data URL from a section of it (i.e. digit)
     * @param imageData the source data URL (like an image for example)
     * @param startX the top left corner x value (i.e. character)
     * @param startY the top left corner y value (i.e. character)
     * @param width the width of the sub image (i.e. character)
     * @param height the height of the sub image (i.e. character)
     */
    private static getSubImage(imageData:string, startX:number, startY:number, width:number, height:number):Promise<string> {
        return new Promise(resolve => {
            let image = new Image();
            image.addEventListener('load', () => {
                let canvas = window.document.createElement('canvas');
                let context:CanvasRenderingContext2D = <CanvasRenderingContext2D>canvas.getContext('2d')
                canvas.width = width;
                canvas.height = height;
                context.drawImage(image, startX, startY, width, height, 0, 0, width, height);
                resolve(canvas.toDataURL());
            });
            image.src = imageData;
        });
    }
}
