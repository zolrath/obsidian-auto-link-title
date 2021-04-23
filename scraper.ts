import { remote } from "electron";
const { BrowserWindow, ipcMain } = remote;

export default function getPageTitle(url: string): Promise<string> {
  return new Promise<string>((resolve) => {
    const window = new BrowserWindow({
      width: 1000,
      height: 600,
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        images: false,
      },
      show: false,
    });

    // After page finishes loading send the head > title via a pageloaded event
    window.webContents.on("did-finish-load", async () => {
      await window.webContents.executeJavaScript(
        `require('electron').ipcRenderer.send('pageloaded', document.querySelector('head > title').innerText);`
      );
    });

    window.loadURL(url);

    // Clean up the title and remove the BrowserWindow
    ipcMain.on("pageloaded", (_event, title) => {
      window.destroy();

      resolve(title.replace(/^\s+|\s+$/g, '');
    });
  });
}
