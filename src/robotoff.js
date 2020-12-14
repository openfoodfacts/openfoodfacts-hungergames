import axios from 'axios';
import { ROBOTOFF_API_URL } from "./const"
import { getLang } from "./settings";
import { removeEmptyKeys } from './utils'

export default {

  annotate(insightId, annotation) {
    return axios.post(
      `${ROBOTOFF_API_URL}/insights/annotate`,
      new URLSearchParams(
        `insight_id=${insightId}&annotation=${annotation}&update=1`,
      ),
      { withCredentials: true },
    )
  },

  questions(sortBy, insightTypes, valueTag, brands, country, count = 10) {
    const lang = getLang();
    return axios.get(
      `${ROBOTOFF_API_URL}/questions/${sortBy}`, {
      params: removeEmptyKeys({
        count, lang, insight_types: insightTypes, value_tag: valueTag, brands, country
      })
    }
    ).then(result => {
      let questions = result.data.questions;
      result.data.questions = questions.filter(question => question.source_image_url);
      return result;
    })
  },

  loadLogo(logoId) {
    return axios.get(
      `${ROBOTOFF_API_URL}/images/logos/${logoId}`
    )
  },

  updateLogo(logoId, value, type) {
    return axios.put(
      `${ROBOTOFF_API_URL}/images/logos/${logoId}`, {
      removeEmptyKeys({
        withCredentials: true, value, type
      })
    }
    )
  },

  searchLogos(barcode, value, type, count = 25) {
    return axios.get(
      `${ROBOTOFF_API_URL}/images/logos`, {
      params: removeEmptyKeys({
        annotated: 1, barcode, value, type, count
      })
    }
    )
  },

  getLogoAnnotations(logoId, index, count) {
    const url = logoId.length > 0
      ? `${ROBOTOFF_API_URL}/ann/${logoId}`
      : `${ROBOTOFF_API_URL}/ann`;
    return axios.get(
      url, {
      params: removeEmptyKeys({
        index, count
      })
    }
    )
  },

  annotateLogos(annotations) {
    return axios.post(
      `${ROBOTOFF_API_URL}/images/logos/annotate`, {
      params: removeEmptyKeys({
        withCredentials: true, annotations,
      })
    }
    )
  },

  getInsights(barcode, insightTypes, valueTag, annotation, page, count = 25) {
    let annotated
    if (annotation.length && annotation == "not_annotated") {
      annotated = "0";
    }
    return axios.get(
      `${ROBOTOFF_API_URL}/insights`, {
      params: removeEmptyKeys({
        barcode, insight_types: insightTypes,
        value_tag: valueTag, annotation, page,
        annotated, count
      })
    }
    )
  },

  getUserStatistics(username) {
    return axios.get(`${ROBOTOFF_API_URL}/users/statistics/${username}`)
  },

  getCroppedImageUrl(imageUrl, boundingBox) {
    const [y_min, x_min, y_max, x_max] = boundingBox;
    return `${ROBOTOFF_API_URL}/images/crop?image_url=${imageUrl}&y_min=${y_min}&x_min=${x_min}&y_max=${y_max}&x_max=${x_max}`;
  },

  getLogosImages(logoIds) {
    return axios.get(
      `${ROBOTOFF_API_URL}/images/logos?logo_ids=${logoIds.join(",")}`
    )
  }
}
