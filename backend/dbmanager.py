import logging
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
    gene: Entity = field(default_factory=Entity)
    involved_option: str = ''
    remarks: list = field(default_factory=list)
    noctuamodels: list = field(default_factory=list)
    genotypes: list = field(default_factory=list)
    authorstatements: list = field(default_factory=list)
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
                "gene": {"value": self.gene.entity_name, "modId": self.gene.entity_id} if self.gene.entity_id else '',
                "involved": self.involved_option,
                "anatomyTerms": [{"value": term.entity_name,
                                  "modId": term.entity_id,
                                  "options": {option: (1 if option in term.options else 0) for option in OPTIONS}}
                                 for term in self.anatomy_terms],
                "remarks": self.remarks,
                "noctuamodels": self.noctuamodels,
                "genotypes": self.genotypes,
                "authorstatements": self.authorstatements,
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
        annot.gene = Entity(entity_id=annotation_dict["gene"]["modId"], entity_name=annotation_dict["gene"]["value"])
        annot.involved_option = annotation_dict["involved"]
        annot.anatomy_terms = [Entity(entity_id=term["modId"], entity_name=term["value"],
                                      options=set([opt for opt, value in term["options"].items() if value == 1])) for
                               term in annotation_dict["anatomyTerms"]]
        annot.remarks = annotation_dict["remarks"]
        annot.noctuamodels = annotation_dict["noctuamodels"]
        annot.genotypes = annotation_dict["genotypes"]
        annot.authorstatements = annotation_dict["authorstatements"]
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
        annot_gene = defaultdict(Entity)
        for row in rows:
            gene_id = row[1].split(' ')[0]
            annot_gene[row[0]] = Entity(entity_id=gene_id)
            annot_gene[row[0]].created_time = row[4]
            if row[2] == "Published_as":
                annot_gene[row[0]].entity_name = row[3]
        return annot_gene

    def _extract_phenotye_data(self, wb_paper_id):
        self.cur.execute(QUERY_PHENOTYPE_TEMPLATE.substitute(paper_id=wb_paper_id))
        rows = self.cur.fetchall()
        annot_phenotype = defaultdict(Entity)
        for row in rows:
            annot_phenotype[row[0]].entity_id = row[1].split(' ')[0]
            if len(row[1].split(' ')) > 1:
                annot_phenotype[row[0]].entity_name = row[1].split(' ')[1][1:-1].replace('_', ' ')
            if row[2] in OPTIONS and row[3] != '':
                annot_phenotype[row[0]].options.add(row[2])
        return annot_phenotype

    def _extract_assay_data(self, wb_paper_id):
        self.cur.execute(QUERY_ASSAY_TEMPLATE.substitute(paper_id=wb_paper_id))
        rows = self.cur.fetchall()
        annot_assay = defaultdict(str)
        for row in rows:
            annot_assay[row[0]] = row[1]
        return annot_assay

    def _extract_involved_tissues(self, wb_paper_id, not_involved: bool = False):
        if not_involved:
            self.cur.execute(QUERY_NOTINVOLVED_TEMPLATE.substitute(paper_id=wb_paper_id))
        else:
            self.cur.execute(QUERY_INVOLVED_TEMPLATE.substitute(paper_id=wb_paper_id))
        rows = self.cur.fetchall()
        annot_involved = defaultdict(lambda: defaultdict(Entity))
        processed_orders = set()
        for row in rows:
            if (row[0], row[1], row[3]) in processed_orders:
                break
            processed_orders.add((row[0], row[1], row[3]))
            tissue_id = row[2].split(' ')[0]
            annot_involved[row[0]][tissue_id] = Entity()
            annot_involved[row[0]][tissue_id].entity_id = tissue_id
            annot_involved[row[0]][tissue_id].created_time = row[5]
            if len(row[2].split(' ')) > 1:
                annot_involved[row[0]][tissue_id].entity_name = row[2].split(' ')[1][1:-1]
            if row[4] and row[4] != '':
                if row[3] in OPTIONS:
                    annot_involved[row[0]][tissue_id].options.add(row[3])
        return annot_involved

    def _extract_remarks(self, wb_paper_id):
        self.cur.execute(QUERY_REMARK_TEMPLATE.substitute(paper_id=wb_paper_id))
        rows = self.cur.fetchall()
        annot_remarks = defaultdict(lambda: defaultdict(list))
        processed_orders = set()
        for row in rows:
            if (row[0], row[1]) in processed_orders:
                break
            processed_orders.add((row[0], row[1]))
            if row[2].startswith("Genotype"):
                annot_remarks[row[0]]["Genotypes"].append(row[2][9:][1:-1])
            elif row[2].startswith("Noctua Model"):
                annot_remarks[row[0]]["NoctuaModels"].append(row[2][13:][1:-1])
            elif row[2].startswith("Author Statement"):
                annot_remarks[row[0]]["AuthorStatements"].append(row[2][17:][1:-1])
            else:
                annot_remarks[row[0]]["Remarks"].append(row[2])
        return annot_remarks

    def _get_new_joinkey(self):
        self.cur.execute(GET_MAX_JOINKEY)
        max_joinkey = int(self.cur.fetchone()[0])
        new_joinkey = str(max_joinkey + 1).zfill(4)
        self.cur.execute(INSERT_JOINKEY_TEMPLATE.substitute(joinkey=new_joinkey, num=int(new_joinkey)))
        return new_joinkey

    def _save_annotation(self, annotation: Annotation, joinkey):
        self.cur.execute(INSERT_GENE_TEMPLATE.substitute(
            joinkey=joinkey, gene=annotation.gene.entity_id + " (" + annotation.gene.entity_name + ")"
            if annotation.gene.entity_id != "" else "", gene_name=annotation.gene.entity_name))
        self.cur.execute(INSERT_PHENOTYPE_TEMPLATE.substitute(
            joinkey=joinkey, phenotype=annotation.phenotype.entity_id + " (" +
            annotation.phenotype.entity_name.replace(' ', '_') + ")"
            if annotation.phenotype.entity_id else ""))
        self.cur.execute(GET_MAX_ORDER_INVOLVED.substitute(joinkey=joinkey))
        res = self.cur.fetchone()
        max_order_involved = int(res[0]) if res[0] else 0
        self.cur.execute(GET_MAX_ORDER_NOTINVOLVED.substitute(joinkey=joinkey))
        res = self.cur.fetchone()
        max_order_notinvolved = int(res[0]) if res[0] else 0
        self.cur.execute(GET_MAX_ORDER_REMARK.substitute(joinkey=joinkey))
        res = self.cur.fetchone()
        max_order_remark = int(res[0]) if res[0] else 0
        order_involved = 1
        order_notinvolved = 1
        for anatomy_term in annotation.anatomy_terms:
            if annotation.involved_option == "involved":
                self.cur.execute(INSERT_INVOLVED_TEMPLATE.substitute(
                    joinkey=joinkey, order=str(order_involved), term=anatomy_term.entity_id + " (" +
                                                                     anatomy_term.entity_name + ")",
                    sufficient="CHECKED" if "Sufficient" in anatomy_term.options else "",
                    necessary="CHECKED" if "Necessary" in anatomy_term.options else ""))
                order_involved += 1
            else:
                self.cur.execute(INSERT_NOTINVOLVED_TEMPLATE.substitute(
                    joinkey=joinkey, order=str(order_notinvolved), term=anatomy_term.entity_id + " (" +
                                                                        anatomy_term.entity_name + ")",
                    sufficient="CHECKED" if "Sufficient" in anatomy_term.options else "",
                    necessary="CHECKED" if "Necessary" in anatomy_term.options else ""))
                order_notinvolved += 1
        for order in range(max_order_involved - order_involved):
            self.cur.execute(INSERT_INVOLVED_TEMPLATE.substitute(joinkey=joinkey, order=str(order + 1), term="",
                                                                 sufficient="", necessary=""))
        for order in range(max_order_notinvolved - order_notinvolved):
            self.cur.execute(INSERT_NOTINVOLVED_TEMPLATE.substitute(joinkey=joinkey, order=str(order + 1), term="",
                                                                    sufficient="", necessary=""))
        self.cur.execute(INSERT_REFERENCE_TEMPLATE.substitute(joinkey=joinkey, paper_id=annotation.evidence))
        order_remarks = 1
        for general_remark in annotation.remarks:
            self.cur.execute(INSERT_REMARK_TEMPLATE.substitute(joinkey=joinkey, order=str(order_remarks),
                                                               remark=general_remark))
            order_remarks += 1
        for genotype_remark in annotation.genotypes:
            self.cur.execute(INSERT_REMARK_TEMPLATE.substitute(joinkey=joinkey, order=str(order_remarks),
                                                               remark="Genotype \"" + genotype_remark + "\""))
            order_remarks += 1
        for noctuamodel_remark in annotation.noctuamodels:
            self.cur.execute(INSERT_REMARK_TEMPLATE.substitute(joinkey=joinkey, order=str(order_remarks),
                                                               remark="Noctua Model \"" + noctuamodel_remark + "\""))
            order_remarks += 1
        for author_statement in annotation.authorstatements:
            self.cur.execute(INSERT_REMARK_TEMPLATE.substitute(joinkey=joinkey, order=str(order_remarks),
                                                               remark="Author Statement \"" + author_statement + "\""))
            order_remarks += 1
        for order in range(max_order_remark - order_remarks):
            self.cur.execute(INSERT_REMARK_TEMPLATE.substitute(joinkey=joinkey, order=str(order + 1), remark=""))
        self.cur.execute(INSERT_ASSAY_TEMPLATE.substitute(joinkey=joinkey, order="1", assay=annotation.assay))

    def get_anatomy_function_annotations(self, wb_paper_id):
        annotations_involved_dict = defaultdict(Annotation)
        annotations_notinvolved_dict = defaultdict(Annotation)
        annotations_dict = self._extract_annotations(wb_paper_id)
        for joinkey, gene in self._extract_genes_data(wb_paper_id).items():
            if joinkey in annotations_dict:
                annotations_dict[joinkey].gene = gene
        for joinkey, phenotype in self._extract_phenotye_data(wb_paper_id).items():
            if joinkey in annotations_dict:
                if phenotype.entity_id != '':
                    annotations_dict[joinkey].phenotype = phenotype
                else:
                    del annotations_dict[joinkey]
        for joinkey, assay in self._extract_assay_data(wb_paper_id).items():
            if joinkey in annotations_dict:
                annotations_dict[joinkey].assay = assay
        for joinkey, remarks_dict in self._extract_remarks(wb_paper_id).items():
            if joinkey in annotations_dict:
                annotations_dict[joinkey].remarks = remarks_dict["Remarks"]
                annotations_dict[joinkey].genotypes = remarks_dict["Genotypes"]
                annotations_dict[joinkey].noctuamodels = remarks_dict["NoctuaModels"]
                annotations_dict[joinkey].authorstatements = remarks_dict["AuthorStatements"]
        for joinkey, involved_tissues in self._extract_involved_tissues(wb_paper_id).items():
            if joinkey in annotations_dict:
                annotations_involved_dict[joinkey] = copy(annotations_dict[joinkey])
                annotations_involved_dict[joinkey].involved_option = 'involved'
                annotations_involved_dict[joinkey].anatomy_terms = list(involved_tissues.values())
        for joinkey, notinvolved_tissues in self._extract_involved_tissues(wb_paper_id, not_involved=True).items():
            if joinkey in annotations_dict:
                annotations_notinvolved_dict[joinkey] = copy(annotations_dict[joinkey])
                annotations_notinvolved_dict[joinkey].involved_option = 'not_involved'
                annotations_notinvolved_dict[joinkey].anatomy_terms = list(notinvolved_tissues.values())
        res_annotations = list(annotations_involved_dict.values())
        res_annotations.extend(list(annotations_notinvolved_dict.values()))
        for annotation in res_annotations:
            if not annotation.gene.entity_name:
                annotation.gene.entity_name = self.get_gene_name_from_id(annotation.gene.entity_id)
        return [annot.to_dict() for annot in res_annotations]

    def get_gene_name_from_id(self, gene_id):
        self.cur.execute(QUERY_GENE_NAME_TEMPLATE.substitute(gene_id=gene_id))
        return self.cur.fetchone()[0]

    def _get_existing_joinkeys(self, paper_id):
        self.cur.execute(QUERY_ANNOTATIONS_TEMPLATE.substitute(paper_id=paper_id))
        return [row[0] for row in self.cur.fetchall()]

    def save_changes(self, annotations, paper_id):
        existing_joinkeys = self._get_existing_joinkeys(paper_id)
        annots_to_save = [Annotation.from_dict(annot) for annot in annotations]
        joinkeys_to_keep = set()
        for annot in annots_to_save:
            if annot.annotation_id.startswith("existing"):
                joinkey = annot.annotation_id.replace("existing", "")
                joinkeys_to_keep.add(joinkey)
            else:
                joinkey = self._get_new_joinkey()
            self._save_annotation(annot, joinkey)
        empty_annot = Annotation()
        for joinkey_to_delete in set(existing_joinkeys) - joinkeys_to_keep:
            self._save_annotation(empty_annot, joinkey_to_delete)