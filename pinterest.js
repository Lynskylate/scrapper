const puppeteer = require('puppeteer-core');
const https = require('https');
const path = require('path');
const fs = require('fs');



function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


(async () => {
    const queryString = "t-shirt"
    const cookies = []
    const destination_num = 10000
    const executablePath = "C:\\Program Files (x85)\\Google\\Chrome\\Application\\chrome.exe"


    // start the browser
    const browser = await puppeteer.launch({ headless: false, executablePath: executablePath});
    // open a new page
    const page = await browser.newPage();
    let cnt = 0

    // 将cookie导入到Puppeteer
    const original_urls = new Set()
    await page.setCookie(...cookies);

    const pageURL = `https://www.pinterest.com/search/pins/?q=${queryString}&rs=typed`;
    await page.setViewport({ width: 1080, height: 1024 });
    try {

        await page.goto(pageURL);
        console.log(`opened the page: ${pageURL}`);

        await page.screenshot({
            path: 'saved.png',
        });

        const imagestsDirectory = `./images/${queryString}`;
        if (!fs.existsSync(imagestsDirectory)) {
            fs.mkdirSync(imagestsDirectory);
        }

        await page.waitForSelector("[role='list']")
        console.log(`end wait`)

        while (cnt < destination_num) {
            // list all element
            let srcList = await page.evaluate(() => {
                return Array.from(document.querySelectorAll("[role='list'] > div")).map((e) => e.querySelector("img").src)
            })
            srcList = srcList.filter((v)=>!original_urls.has(v))
            for (const src of srcList) {
                if (original_urls.has(src)) {
                    continue
                }
                console.log(`start download ${src}`)
                const imagePage = await browser.newPage()
                const imagefileDL = await imagePage.goto(src);
                fs.writeFile(path.join(imagestsDirectory, src.substring(src.lastIndexOf("/") + 1)), await imagefileDL.buffer(), function (err) {
                    if (err) {
                        return console.log(err);
                    }

                    console.log("The file was saved!");
                });
                console.log(`End download ${src}`)
                original_urls.add(src)
                cnt += 1
                await imagePage.close()
            }
            await page.evaluate(() => {
                window.scrollBy(0, window.innerHeight);
            });

            await sleep(1000)
            console.log(`Current loading ${cnt} / ${destination_num}`)

        }

    } catch (error) {
        console.log(`failed to open the page: ${pageURL} with the error: ${error}`);
    }

    // all done, close the browser
    await browser.close();

    process.exit()
})();