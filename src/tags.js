export const getTagifyTagNames = (tags, currentTag) => {
    return tags
        .filter(tag => {
            return tag.name.toLowerCase().indexOf(currentTag.toLowerCase()) !== -1;
        })
        .map(tag => {
            return {
                text: tag.name
            };
        });
}

export { getTagifyTagNames as default };

