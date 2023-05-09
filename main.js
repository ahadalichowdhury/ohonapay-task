const puppeteer = require("puppeteer");
const express = require("express");
const app = express();
const Q = require("q");
var searchTerm = "";
let products = [];

app.set("view engine", "ejs");


async function scrapeProducts(url) {
  products = [];
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  // Wait for the product grid to load
  await page.waitForSelector(".product__listing");

  // Get the product elements
  const productElements = await page.$$(".product__list--item");
  console.log(productElements.length);
  // Extract the name and price for each product
  for (const el of productElements) {
    const name = await el.$eval(".product-desc h3", (el) =>
      el.textContent.trim()
    );
    // get image source
    const img = await el.$eval(".js-gtm-product-link img", (el) => el.src);
    const price = await el.$eval(".product-price", (el) =>
      el.textContent.trim()
    );
    const priceNum = parseFloat(price.replace(/\D/g, ""));
    const dividedPrice = parseFloat(priceNum / 3.5).toFixed(2);
    const numPrice = parseFloat(dividedPrice);
    products.push({ name, img, price: `USD ${numPrice}` });
    if (products.length > 10) break;
  }

  await browser.close();
  return products;
}

app.listen(5500, () => {
  console.log("Server is running on port 5500");
});

app.get("/", (req, res) => {
  const fullUrl = `${req.protocol}://${req.headers.host}${req.url}`;
  const currentUrl = new URL(fullUrl);
  const search_params = currentUrl.searchParams;
  var query = search_params.get("q");
  console.log(query);
  if (query) {
    searchTerm = query;
    scrapeProducts(
      "https://www.luluhypermarket.com/en-ae/search/?text=" + searchTerm
    )
      .then((products) => {
        console.log(products);
        res.render('index', { products });
      })
      .catch((error) => console.error(error));
  } else {
    res.json(products);
  }
});
