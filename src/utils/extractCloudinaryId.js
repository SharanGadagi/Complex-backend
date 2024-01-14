export const extractPublicIdFromUrl = (url) => {
  const publicIdRegex = /\/upload\/(.+)\/.+/;
  const match = url.match(publicIdRegex);
  return match ? match[1] : null;
};
