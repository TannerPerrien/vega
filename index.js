'use strict'

require('draftlog').into(console)

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const puppeteer = require('puppeteer');

const adapter = new FileSync('db.json')
const db = low(adapter)
const phoneFrom = '+1'
const phoneTo = '+1'

db.defaults({ websites: [{
    name: 'Best Buy - Vega 64 - XFX',
    url: 'https://www.bestbuy.com/site/xfx-amd-radeon-rx-vega-64-8gb-hbm2-pci-express-3-0-graphics-card-black/6040105.p?skuId=6040105',
    css: '#pdp-add-to-cart-button > div > button',
    enabled: true
  }, {
    name: 'Best Buy - Vega 56 XFX',
    url: 'https://www.bestbuy.com/site/xfx-amd-radeon-rx-vega-56-8gb-hbm2-pci-express-3-0-graphics-card/6084601.p?skuId=6084601',
    css: '#pdp-add-to-cart-button > div > button',
    enabled: true
  }, {
    name: 'Newegg - Vega 64 - GIGABYTE',
    url: 'https://www.newegg.com/Product/Product.aspx?Item=N82E16814125996&ignorebbr=1&recaptcha=pass',
    css: '#landingpage-topshipping > div > div > span',
    enabled: true
  }, {
    name: 'Newegg - Vega 64 - XFX',
    url: 'https://www.newegg.com/Product/Product.aspx?Item=N82E16814150808&ignorebbr=1&recaptcha=pass',
    css: '#landingpage-cart > div > div > button > span',
    enabled: true
  }, {
    name: 'Newegg - Vega 64 - SAPPHIRE',
    url: 'https://www.newegg.com/Product/Product.aspx?Item=N82E16814202306&ignorebbr=1&recaptcha=pass',
    css: '#landingpage-topshipping > div > div > span',
    enabled: true
  }]}
).write()

const processAlert = alertString => {
  const accountSid = '';
  const authToken = '';
  const client = require('twilio')(accountSid, authToken);

  client.calls.create({
    url: 'http://demo.twilio.com/docs/voice.xml',
    to: phoneTo,
    from: phoneFrom,
  })
  .then(call => console.log(`Calling... ${call.sid}`));

  client.messages.create({
    body: alertString,
    to: phoneTo,
    from: phoneFrom
  })
  .then(sms => console.log(`Messaging... ${call.sid}`));
}

const processData = (site, logger, value) => {
  if (!site.enabled) {
    return;
  }
  let lastValue = site.lastValue
  site.lastValue = value
  site.lastUpdate = Date.now()
  if (value === undefined) {
    logger('Disabling site due to error')
    // site.enabled = false
    // processAlert(`Error: ${site.name}`)
  } else if (lastValue !== undefined && lastValue != value) {
    logger('Firing call alert')
    processAlert(`Alert for ${site.name}. Value ${value}`)
  } else {
    logger('No change')
  }
  db.write()
}

const datadir = '/tmp/profile/';
let browser;

const processSite = (site, logger) => {
  (async () => {
    logger('processing...')
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36')
    // await page.setRequestInterception(true);
    // page.on('request', request => {
    //   if (request.resourceType() === 'image') {
    //     request.abort();
    //   } else {
    //     request.continue();
    //   }
    // });
    
    await page.setViewport({ width: 1000, height: 1200});
    try {
      await page.goto(site.url, {"waitUntil" : "networkidle0"});
      // await page.goto("https://www.google.com", {"waitUntil" : "networkidle0"});
      await page.addScriptTag({ path: 'undetectable.js' });
    } catch(err) {
      console.log(err)
    }
    const html = await page.evaluate(sel => document.querySelector(sel).innerHTML, site.css);
    await page.close();
    processData(site, logger, html)
  })()
  .catch(err => {
    console.log(err)
    processData(site, logger)
  });
}

const formatMsg = (site, msg) => {
  return `${site.name}: ${msg}`
}

const sites = []
db.get('websites')
  .filter({ enabled: true })
  .value()
  .forEach(site => {
    let draft = console.draft(formatMsg(site, ''))
    sites.push({ site: site, logger: msg => { draft(formatMsg(site, msg))}})
  })
const work = () => {
  sites.forEach(val => processSite(val.site, val.logger))
}

(async() => {
  browser = await puppeteer.launch({
    headless: false,
    userDataDir: datadir
  });

  setInterval(work, 5 * 60 * 1000);
  // setInterval(work, 30 * 1000);
  work();
})()
