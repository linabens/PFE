/**
 * Utilities to parse the URL for QR parameters
 */

export const getQrFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('qr'); // Expecting ?qr=xyz
};

/**
 * Clean the URL from query parameters after parsing
 */
export const clearUrlParams = () => {
  window.history.replaceState({}, document.title, window.location.pathname);
};
