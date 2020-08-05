import axios from 'axios';
import { ROBOTOFF_API_URL } from "./const"
import { getLang } from "./settings";
import {removeEmptyKeys} from './utils'

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

  questions(sortBy, insight_types, value_tag, brands, country, count=10) {
    const lang = getLang();
    return axios.get(
      `${ROBOTOFF_API_URL}/questions/${sortBy}`, {
        params : removeEmptyKeys({
          count, lang, insight_types, value_tag, brands, country
        })
      }
    )
  }
}
