export const entitiesAreEqual = (e1, e2) => {
    if (e1.value !== undefined) {
        return e1.value === e2.value && e1.modId === e2.modId && (e1.options === undefined && e2.options === undefined || Object.entries(e1.options).every(([k, v]) => e2.options[k] === v))
    } else {
        return e1 === e2;
    }
}

export const annotationsAreEqual = (a1, a2) => {
    return a1.annotationId === a2.annotationId && Object.entries(a1).every(([a1key, a1value]) => {
        if (Array.isArray(a1value)) {
            return a1value.every((t, idx) => {return entitiesAreEqual(t, a2[a1key][idx])})
        } else {
            return entitiesAreEqual(a1value, a2[a1key]);
        }});
}

export const getAnnotationDiff = (oldAnnotations, newAnnotations) => {
    let modifiedAnnotIds = new Set();
    let deletedAnnotIds = new Set();
    let addedAnnotIds = new Set();
    if (oldAnnotations !== undefined && newAnnotations !== undefined) {
        let newIds = new Set([...newAnnotations.map(a => a.annotationId)]);
        let oldIds = new Set([...oldAnnotations.map(a => a.annotationId)]);
        deletedAnnotIds = new Set([...oldIds].filter(x => !newIds.has(x)))
        addedAnnotIds = new Set([...newIds].filter(x => !oldIds.has(x)));
        newAnnotations.forEach((newAnnot) => {
            if (!oldAnnotations.some((oldAnnot) => annotationsAreEqual(newAnnot, oldAnnot))) {
                modifiedAnnotIds.add(newAnnot.annotationId);
            }
        });
        modifiedAnnotIds = new Set([...modifiedAnnotIds].filter(x => !addedAnnotIds.has(x)));
    }
    return {modifiedIds: modifiedAnnotIds, newIds: addedAnnotIds, deletedIds: deletedAnnotIds};
}