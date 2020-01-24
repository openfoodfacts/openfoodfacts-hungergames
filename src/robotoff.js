import axios from 'axios';
import { ROBOTOFF_API_URL } from "./const"

export const annotate = (insightId, annotation) => {
    return axios.post(
        `${ROBOTOFF_API_URL}/insights/annotate`,
        new URLSearchParams(
            `insight_id=${insightId}&annotation=${annotation}&update=1`,
        ),
        { withCredentials: true },
    );
};