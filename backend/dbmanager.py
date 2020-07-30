import logging
import re
import datetime
import psycopg2 as psycopg2

from collections import defaultdict
from copy import copy
from dataclasses import dataclass, field
from backend.query_templates import *

logger = logging.getLogger(__name__)


OPTIONS = ['Sufficient', 'Insufficient', 'Necessary', 'Unnecessary']


@dataclass
class Entity(object):
    created_time: str = ''
    entity_id: str = ''
    entity_name: str = ''
    options: set = field(default_factory=set)


@dataclass
class Annotation(object):
    annotation_id: str = ''
    phenotype: Entity = field(default_factory=Entity)
    genes: list = field(default_factory=list)
    involved_option: str = ''
    remarks: set = field(default_factory=set)
    noctuamodel: str = ''
    genotypes: set = field(default_factory=set)
    assay: str = ''
    created_time: str = ''
    anatomy_terms: list = field(default_factory=list)
    evidence: str = ''

    def to_dict(self):
        return {"annotationId": 'existing' + self.annotation_id,
                "phenotype": {"value": self.phenotype.entity_name,
                              "modId": self.phenotype.entity_id,
                              "options": {option: (1 if option in self.phenotype.options else 0) for option in OPTIONS}
                              },
                "genes": [{"value": gene.entity_name, "modId": gene.entity_id} for gene in self.genes],
                "involved": self.involved_option,
                "anatomyTerms": [{"value": term.entity_name,
                                  "modId": term.entity_id,
                                  "options": {option: (1 if option in term.options else 0) for option in OPTIONS}}
                                 for term in self.anatomy_terms],
                "remark": '\n\n'.join(self.remarks),
                "noctuamodel": self.noctuamodel,
                "genotype": '\n\n'.join(self.genotypes),
                "assay": {"value": self.assay},
                "dateAssigned": datetime.datetime.timestamp(self.created_time) * 1000,
                "evidence": self.evidence
                }

    @staticmethod
    def from_dict(annotation_dict):
        annot = Annotation()
        annot.annotation_id = annotation_dict["annotationId"]
        annot.phenotype.entity_id = annotation_dict["phenotype"]["modId"]
        annot.phenotype.entity_name = annotation_dict["phenotype"]["value"]
        annot.genes = [Entity(entity_id=gene["modId"], entity_name=gene["value"]) for gene in annotation_dict["genes"]]
        annot.involved_option = annotation_dict["involved"]
        annot.anatomy_terms = [Entity(entity_id=term["modId"], entity_name=term["value"],
                                      options=set([opt for opt, value in term["options"].items() if value == 1])) for
                               term in annotation_dict["anatomyTerms"]]
        annot.remarks = [annotation_dict["remark"]]
        annot.noctuamodel = annotation_dict["noctuamodel"]
        annot.genotypes = [annotation_dict["genotype"]]
        annot.assay = annotation_dict["assay"]["value"]
        annot.created_time = datetime.datetime.fromtimestamp(annotation_dict["dateAssigned"] / 1000)
        annot.evidence = annotation_dict["evidence"]
        return annot


class DBManager(object):

    def __init__(self, dbname, user, password, host):
        connection_str = "dbname='" + dbname
        if user:
            connection_str += "' user='" + user
        if password:
            connection_str += "' password='" + password
        connection_str += "' host='" + host + "'"
        self.conn = psycopg2.connect(connection_str)
        self.cur = self.conn.cursor()

    def close(self):
        self.conn.commit()
        self.cur.close()
        self.conn.close()

    def _extract_annotations(self, wb_paper_id):
        self.cur.execute(QUERY_ANNOTATIONS_TEMPLATE.substitute(paper_id=wb_paper_id))
        annotations = defaultdict(Annotation)
        rows = self.cur.fetchall()
        for row in rows:
            annotations[row[0]].annotation_id = row[0]
            annotations[row[0]].created_time = row[1]
            annotations[row[0]].evidence = 'WBPaper' + wb_paper_id
        return annotations

    def _extract_genes_data(self, wb_paper_id):
        self.cur.execute(QUERY_GENE_TEMPLATE.substitute(paper_id=wb_paper_id))
        rows = self.cur.fetchall()
        annot_gene = defaultdict(lambda: defaultdict(Entity))
        for row in rows:
            gene_id = row[1].split(' ')[0]
            annot_gene[row[0]][gene_id] = Entity(entity_id=gene_id)
            annot_gene[row[0]][gene_id].created_time = row[4]
            if row[2] == "Published_as":
                annot_gene[row[0]][gene_id].entity_name = row[3]
        return annot_gene

    def _extract_phenotye_data(self, wb_paper_id):
        self.cur.execute(QUERY_PHENOTYPE_TEMPLATE.substitute(paper_id=wb_paper_id))
        rows = self.cur.fetchall()
        annot_phenotype = defaultdict(Entity)
        remarks = defaultdict(str)
        for row in rows:
            annot_phenotype[row[0]].entity_id = row[1].split(' ')[0]
            annot_phenotype[row[0]].entity_name = row[1].split(' ')[1][1:-1].replace('_', ' ')
            if row[2] == 'Remark' and row[3] and row[3] != '' and row[3] != 'CHECKED':
                remarks[row[0]] = row[3]
            if row[2] in OPTIONS:
                annot_phenotype[row[0]].options.add(row[2])
        return annot_phenotype, remarks

    def _extract_assay_data(self, wb_paper_id):
        self.cur.execute(QUERY_ASSAY_TEMPLATE.substitute(paper_id=wb_paper_id))
        rows = self.cur.fetchall()
        annot_assay = defaultdict(str)
        remarks = defaultdict(list)
        genotypes = defaultdict(list)
        others = defaultdict(list)
        for row in rows:
            annot_assay[row[0]] = row[1]
            remarks[row[0]] = []
            genotypes[row[0]] = []
            others[row[0]] = []
            if row[2]:
                remarks[row[0]] = re.findall(".*Remark \"(.*)\".*", row[2])
                genotypes[row[0]] = re.findall(".*Genotype \"(.*)\".*", row[2])
                others[row[0]] = re.findall(".*Other \"(.*)\".*", row[2])
        return annot_assay, remarks, genotypes, others

    def _extract_involved_tissues(self, wb_paper_id, not_involved: bool = False):
        if not_involved:
            self.cur.execute(QUERY_NOTINVOLVED_TEMPLATE.substitute(paper_id=wb_paper_id))
        else:
            self.cur.execute(QUERY_INVOLVED_TEMPLATE.substitute(paper_id=wb_paper_id))
        rows = self.cur.fetchall()
        annot_involved = defaultdict(lambda: defaultdict(Entity))
        remarks = defaultdict(set)
        for row in rows:
            tissue_id = row[1].split(' ')[0]
            if not annot_involved[row[0]][tissue_id].created_time:
                annot_involved[row[0]][tissue_id] = Entity()
                annot_involved[row[0]][tissue_id].entity_id = tissue_id
                annot_involved[row[0]][tissue_id].created_time = row[4]
                annot_involved[row[0]][tissue_id].entity_name = row[1].split(' ')[1][1:-1]
            if row[3] and row[3] != '':
                if row[2] in OPTIONS:
                    annot_involved[row[0]][tissue_id].options.add(row[2])
                if row[3] != 'CHECKED':
                    remarks[row[0]].add(row[3])
        return annot_involved, remarks

    def _get_new_joinkey(self):
        self.cur.execute(GET_MAX_JOINKEY)
        max_joinkey = int(self.cur.fetchone()[0])
        new_joinkey = str(max_joinkey + 1).zfill(4)
        return new_joinkey

    def _save_annotation(self, annotation: Annotation, joinkey):
        self.cur.execute(INSERT_JOINKEY_TEMPLATE.substitute(joinkey=joinkey, num=int(joinkey)))
        for gene in annotation.genes:
            self.cur.execute(INSERT_GENE_TEMPLATE.substitute(joinkey=joinkey, gene_id=gene.entity_id,
                                                             gene_name=gene.entity_name))
        self.cur.execute(INSERT_PHENOTYPE_TEMPLATE.substitute(
            joinkey=joinkey, phenotype_id=annotation.phenotype.entity_id,
            phenotype_name=annotation.phenotype.entity_name.replace(' ', '_')))
        order_involved = 1
        order_notinvolved = 1
        for anatomy_term in annotation.anatomy_terms:
            if annotation.involved_option == "involved":
                self.cur.execute(INSERT_INVOLVED_TEMPLATE.substitute(
                    joinkey=joinkey, order=str(order_involved), term_id=anatomy_term.entity_id,
                    term_name=anatomy_term.entity_name, sufficient="CHECKED" if "Sufficient" in anatomy_term.options
                    else "", necessary="CHECKED" if "Necessary" in anatomy_term.options else ""))
                order_involved += 1
            else:
                self.cur.execute(INSERT_NOTINVOLVED_TEMPLATE.substitute(
                    joinkey=joinkey, order=str(order_notinvolved), term_id=anatomy_term.entity_id,
                    term_name=anatomy_term.entity_name, sufficient="CHECKED" if "Sufficient" in anatomy_term.options
                    else "", necessary="CHECKED" if "Necessary" in anatomy_term.options else ""))
                order_notinvolved += 1
        self.cur.execute(INSERT_REFERENCE_TEMPLATE.substitute(joinkey=joinkey, paper_id=annotation.evidence))
        self.cur.execute(INSERT_REMARK_TEMPLATE.substitute(joinkey=joinkey, remark='\n'.join(annotation.remarks)))
        self.cur.execute(INSERT_ASSAY_TEMPLATE.substitute(joinkey=joinkey, order="1", assay=annotation.assay,
                                                          paper_id=annotation.evidence,
                                                          genotype=("Genotype \"" + '\n'.join(annotation.genotypes) +
                                                                    "\"") if annotation.genotypes else ""))

    def _delete_existing_data(self, joinkey):
        self.cur.execute(DELETE_GENE_TEMPLATE.substitute(joinkey=joinkey))
        self.cur.execute(DELETE_PHENOTYPE_TEMPLATE.substitute(joinkey=joinkey))
        self.cur.execute(DELETE_INVOLVED_TEMPLATE.substitute(joinkey=joinkey))
        self.cur.execute(DELETE_NOTINVOLVED_TEMPLATE.substitute(joinkey=joinkey))
        self.cur.execute(DELETE_ASSAY_TEMPLATE.substitute(joinkey=joinkey))
        self.cur.execute(DELETE_REMARK_TEMPLATE.substitute(joinkey=joinkey))
        self.cur.execute(DELETE_REFERENCE_TEMPLATE.substitute(joinkey=joinkey))

    def get_anatomy_function_annotations(self, wb_paper_id):
        annotations_involved_dict = defaultdict(Annotation)
        annotations_notinvolved_dict = defaultdict(Annotation)
        annotations_dict = self._extract_annotations(wb_paper_id)
        for joinkey, genes_dict in self._extract_genes_data(wb_paper_id).items():
            annotations_dict[joinkey].genes = list(genes_dict.values())
        annot_pheno, remarks = self._extract_phenotye_data(wb_paper_id)
        for joinkey, phenotype in annot_pheno.items():
            if joinkey in annotations_dict:
                annotations_dict[joinkey].phenotype = phenotype
                annotations_dict[joinkey].remarks.add(remarks[joinkey])
        annot_assay, remarks, genotypes, others = self._extract_assay_data(wb_paper_id)
        for joinkey, assay in annot_assay.items():
            if joinkey in annotations_dict:
                annotations_dict[joinkey].assay = assay
                annotations_dict[joinkey].remarks.update(remarks[joinkey])
                annotations_dict[joinkey].genotypes.update(genotypes[joinkey])
        annot_involved, remarks = self._extract_involved_tissues(wb_paper_id)
        for joinkey, involved_tissues in annot_involved.items():
            if joinkey in annotations_dict:
                annotations_involved_dict[joinkey] = copy(annotations_dict[joinkey])
                annotations_involved_dict[joinkey].involved_option = 'involved'
                annotations_involved_dict[joinkey].anatomy_terms = list(involved_tissues.values())
                annotations_involved_dict[joinkey].remarks.update(remarks[joinkey])
        annot_notinvolved, remarks = self._extract_involved_tissues(wb_paper_id, not_involved=True)
        for joinkey, notinvolved_tissues in annot_notinvolved.items():
            if joinkey in annotations_dict:
                annotations_notinvolved_dict[joinkey] = copy(annotations_dict[joinkey])
                annotations_notinvolved_dict[joinkey].involved_option = 'not_involved'
                annotations_notinvolved_dict[joinkey].anatomy_terms = list(notinvolved_tissues.values())
                annotations_notinvolved_dict[joinkey].remarks.update(remarks[joinkey])
        res_annotations = list(annotations_involved_dict.values())
        res_annotations.extend(list(annotations_notinvolved_dict.values()))
        for annotation in res_annotations:
            for gene in annotation.genes:
                if not gene.entity_name:
                    gene.entity_name = self.get_gene_name_from_id(gene.entity_id)
        return [annot.to_dict() for annot in res_annotations]

    def get_gene_name_from_id(self, gene_id):
        self.cur.execute(QUERY_GENE_NAME_TEMPLATE.substitute(gene_id=gene_id))
        return self.cur.fetchone()

    def save_anatomy_function_annotations(self, annotations):
        annots = [Annotation.from_dict(annot) for annot in annotations]
        for annot in annots:
            if annot.annotation_id.startswith("existing"):
                joinkey = annot.annotation_id.replace("existing", "")
                self._delete_existing_data(joinkey)
            else:
                joinkey = self._get_new_joinkey()
            self._save_annotation(annot, joinkey)
        return None
