export abstract class GameTools {

    /**
     * Disables irritating browser shortcuts
     */
    static disableBrowserShortcuts() {
        document.addEventListener('keydown',(e) => {
            if (e.key === '/') e.preventDefault();
            if (e.key === ' ') e.preventDefault();
            if (e.key === 'AltLeft') e.preventDefault();
            if (e.key === 'AltRight') e.preventDefault();
        })

    }

    /**
     * Converts a single byte integer into a hex value
     */
    static getHexValue = (number:number):string => {
        return ("00" + number.toString(16)).slice(-2)
    }

}
