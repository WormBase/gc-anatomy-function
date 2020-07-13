export const getAnnotations = store => store ? store.annotations : [];
export const isLoading = store => store ? store.isLoading : false;
export const getError = store => store ? store.error : null;