import { getLang } from "./settings";
import { OFF_API_URL, OFF_IMAGE_URL, OFF_URL } from "./const";
import axios from 'axios';
import combineURLs from 'axios/lib/helpers/combineURLs';


export default {
  getCookie(name) {
    const cookies = document.cookie.split(';').filter((item) => item.trim().startsWith(`${name}=`));
    if (cookies.length) {
      const cookie = cookies[0];
      return cookie.split("=", 2)[1];
    }
    return "";
  },

  getUsername() {
    const sessionCookie = this.getCookie("session");

    if (!sessionCookie.length) {
      return "";
    }

    let isNext = false;
    let username = "";
    sessionCookie.split("&").forEach(el => {
      if (el === "user_id") {
        isNext = true;
      } else if (isNext) {
        username = el;
        isNext = false;
      }
    });
    return username;
  },

  getProduct(barcode) {
    return axios.get(
      `${OFF_API_URL}/product/${barcode}.json?fields=product_name,brands,ingredients_text,countries_tags,images`
    )
  },

  getProductUrl(barcode) {
    const lang = getLang();
    return `https://world${lang === 'en' ? '' : '-' + lang}.openfoodfacts.org/product/${barcode}`
  },

  getProductEditUrl(barcode) {
    const lang = getLang();
    return `https://world${lang === 'en' ? '' : '-' + lang}.openfoodfacts.org/cgi/product.pl?type=edit&code=${barcode}`;
  },

  getImageUrl(imagePath) {
    return combineURLs(OFF_IMAGE_URL, imagePath)
  },

  getTableExtractionAI({ img, x0, y0, x1, y1 }) {
    return `https://off-nutri-test.azurewebsites.net/api/get-nutri-table?name=${img}%7C(${x0},${y0},${x1},${y1})`;
  },

  getNutritionToFillUrl(pageNumber) {
    return `${OFF_URL}/state/photos-validated/state/nutrition-facts-to-be-completed/${pageNumber}.json?fields=code,lang,image_nutrition_url,product_name,nutriments,images`;
  },
};
