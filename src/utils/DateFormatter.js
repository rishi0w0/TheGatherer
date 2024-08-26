function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error(`Error formatting date: ${error.message}`);
        return dateString;
    }
}

module.exports = { formatDate };
