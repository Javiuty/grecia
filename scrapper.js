import puppeteer from 'puppeteer'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const pathToData = path.join(__dirname, 'flights.json')

const saveFlightsData = async (url) => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()

  const ua = 'Mozilla/8.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36'

  await page.setUserAgent(ua)

  await page.goto(url)

  // Espera a que los botones estén disponibles
  await page.waitForSelector('button[role="button"]');

  // Selecciona todos los botones que coinciden con el selector
  const buttons = await page.$$('button[role="button"]');

  // Selecciona el botón de rechazar cookies
  const lastButton = buttons[buttons.length - 1];

  if (lastButton) {
    await lastButton.click();
  }

  // wait till spinner price stop for fair price
  await new Promise((r) => setTimeout(r, 10000));

  const scrapeData = await page.evaluate(() => {
    const price = document.querySelector('[role="group"] [class*="price-text"]')?.textContent
    const cleanPrice = price?.replace(/\s+/g, '')
    const timestamp = new Date(Date.now())
    const actualTime = timestamp.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })

    return { price: cleanPrice, time: actualTime }
  })

  await browser.close()

  return scrapeData
}

saveFlightsData('https://www.kayak.es/flights/MAD-ATH/2025-05-30/2025-06-04?ucs=186au1b&sort=price_a&fs=stops=0').then((scrapeData) => {
  fs.readFile('flights.json', 'utf8', (err, readObj) => {
    if (err) return `Error reading file from disk: ${err}`

    const jsonParsed = JSON.parse(readObj)
    jsonParsed.push(scrapeData)

    fs.writeFile(path.resolve(pathToData), JSON.stringify(jsonParsed, null, 2), (err) => {
      if (err) return `Error writing file ${err}`

      return 'Data created correctly ✅'
    })
  })
})


