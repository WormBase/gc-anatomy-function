export const getNewAnnotations = store => store ? store.newAnnotations : [];
export const getOldAnnotations = store => store ? store.oldAnnotations : [];
export const isLoading = store => store ? store.isLoading : false;
export const getLoadStatus = store => store ? store.loadStatus : null;
export const getSaveStatus = store => store ? store.saveStatus : null;