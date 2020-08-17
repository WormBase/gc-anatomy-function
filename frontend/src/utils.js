export const entitiesAreEqual = (e1, e2) => {
    return e1.value === e2.value && e1.modId === e2.modId && (e1.options === undefined && e2.options === undefined || Object.entries(e1.options).every(([k, v]) => e2.options[k] === v))
}

export const anatomyFnctAnnotationsAreEqual = (a1, a2) => {
    return a1.annotationId === a2.annotationId
        && entitiesAreEqual(a1.phenotype, a2.phenotype) && entitiesAreEqual(a1.gene, a2.gene)
        && a1.anatomyTerms.every((t, idx) => {return entitiesAreEqual(t, a2.anatomyTerms[idx])})
        && a1.remarks.every((r, idx) => {return r === a2.remarks[idx]}) && a1.genotypes.every((r, idx) => {return r === a2.genotypes[idx]})
        && a1.noctuamodels.every((r, idx) => {return r === a2.noctuamodels[idx]})
        && a1.authorstatements.every((r, idx) => {return r === a2.authorstatements[idx]}) && a1.assay.value === a2.assay.value
        && a1.evidence === a2.evidence && a1.dateAssigned === a2.dateAssigned;
}

export const getAnnotationsDiffStatus = (oldAnnotations, newAnnotations) => {
    let modifiedAnnotIds = new Set();
    let deletedAnnotIds = new Set();
    let addedAnnotIds = new Set();
    if (oldAnnotations !== undefined && newAnnotations !== undefined) {
        let newIds = new Set([...newAnnotations.map(a => a.annotationId)]);
        let oldIds = new Set([...oldAnnotations.map(a => a.annotationId)]);
        deletedAnnotIds = new Set([...oldIds].filter(x => !newIds.has(x)))
        addedAnnotIds = new Set([...newIds].filter(x => !oldIds.has(x)));
        newAnnotations.forEach((newAnnot) => {
            if (!oldAnnotations.some((oldAnnot) => anatomyFnctAnnotationsAreEqual(newAnnot, oldAnnot))) {
                modifiedAnnotIds.add(newAnnot.annotationId);
            }
        });
        modifiedAnnotIds = new Set([...modifiedAnnotIds].filter(x => !addedAnnotIds.has(x)));
    }
    return {modifiedIds: modifiedAnnotIds, newIds: addedAnnotIds, deletedIds: deletedAnnotIds};
}

export const diffAnatomyFunctionAnnotations = (oldAnnotations, newAnnotations) => {
    let diffAddOrMod = []
    let diffDel = []
    newAnnotations.forEach((newAnnot) => {
        if (!oldAnnotations.some((oldAnnot) => anatomyFnctAnnotationsAreEqual(newAnnot, oldAnnot))) {
            diffAddOrMod.push(newAnnot);
        }
    });
    oldAnnotations.forEach((oldAnnot) => {
        if (!newAnnotations.some((newAnnot) => anatomyFnctAnnotationsAreEqual(oldAnnot, newAnnot)) &&
            !diffAddOrMod.some((annotToMod) => {return annotToMod.annotationId === oldAnnot.annotationId})) {
            diffDel.push(oldAnnot);
        }
    });
    return {numChanges: diffAddOrMod.length + diffDel.length, diffAddOrMod: diffAddOrMod, diffDel: diffDel};
}