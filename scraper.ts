const electronPkg = require("electron");

export default function getPageTitle(url: string): Promise<string> {
  // If we're on Desktop use the Electron scraper
  if (electronPkg != null) {
    const { remote } = electronPkg;
    const { BrowserWindow } = remote;
    return new Promise<string>((resolve) => {
      try {
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

        window.webContents.on("did-finish-load", async () => {
          try {
            const title = window.webContents.getTitle();
            window.destroy();
            if (title != null && title != '') {
              resolve(title);
            } else {
              resolve("Title Unknown");
            }
          } catch (ex) {
            resolve("Title Unknown");
          }
        });

        window.loadURL(url);
      } catch (ex) {
        resolve("Site Unreachable");
      }
    });
    // Otherwise if we're on mobile use a CORS proxy
  } else {
    return new Promise<string>((resolve) => {
      // console.log(`Fetching ${text} for title`);
      //Because of CORS you can't fetch the site directly
      var corsed = `https://api.allorigins.win/get?url=${encodeURIComponent(
        url
      )}`;
      fetch(corsed)
        .then((response) => {
          return response.text();
        })
        .then((html) => {
          const doc = new DOMParser().parseFromString(html, "text/html");
          const title = doc.querySelectorAll("title")[0];
          if (title == null || title.innerText.length == 0) {
            // If site is javascript based and has a no-title attribute when unloaded, use it.
            var noTitle = title.getAttr("no-title");
            if (noTitle != null) return noTitle;

            // Otherwise if the site has no title/requires javascript simply return Title Unknown
            return resolve("Title Unknown");
          }
          return resolve(title.innerText);
        })
        .catch((error) => {
          console.error(error);
          return resolve("Site Unreachable");
        });
    });
  }
}
