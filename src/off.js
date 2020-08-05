import { getLang } from "./settings";
import { OFF_API_URL, OFF_IMAGE_URL } from "./const"
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
  }
}
