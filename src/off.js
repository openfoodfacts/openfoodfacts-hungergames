

export const getCookie = name => {
    const cookies = document.cookie.split(';').filter((item) => item.trim().startsWith(`${name}=`));
    if (cookies.length) {
        const cookie = cookies[0];
        return cookie.split("=", 2)[1];
    }
    return "";
}

export const getUsername = () => {
    const sessionCookie = getCookie("session");

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
}