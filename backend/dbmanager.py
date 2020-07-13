import logging
from collections import defaultdict
from dataclasses import dataclass, field
from string import Template

import psycopg2 as psycopg2

logger = logging.getLogger(__name__)


QUERY = Template('SELECT wbb_reference.joinkey, wbb_gene.wbb_gene, wbb_gene.wbb_evitype, wbb_gene.wbb_evidence, '
                 'wbb_${not_par}involved.wbb_${not_par}involved, wbb_${not_par}involved.wbb_evitype, '
                 'wbb_${not_par}involved.wbb_evidence, wbb_phenotype.wbb_phenotype, wbb_remark.wbb_remark, '
                 'wbb_assay.wbb_assay, wbb_reference.wbb_timestamp '
                 'FROM wbb_reference JOIN wbb_gene ON wbb_reference.joinkey = wbb_gene.joinkey '
                 'JOIN wbb_${not_par}involved ON wbb_reference.joinkey = wbb_${not_par}involved.joinkey '
                 'FUll outer JOIN wbb_remark ON wbb_reference.joinkey = wbb_remark.joinkey '
                 'JOIN wbb_phenotype ON wbb_reference.joinkey = wbb_phenotype.joinkey '
                 'JOIN wbb_assay ON wbb_reference.joinkey = wbb_assay.joinkey '
                 'WHERE wbb_reference.wbb_reference = \'WBPaper${paper_id}\'')

@dataclass
class Annotation(object):
    annotation_id: str = ''
    phenotype_id: str = ''
    phenotype_name: str = ''
    gene_id: str = ''
    gene_name: str = ''
    involved_option: str = ''
    remark: str = ''
    noctuamodel: str = ''
    genotype: str = ''
    assay: str = ''
    created_time: str = ''
    anatomy_terms: set = field(default_factory=set)
    anatomy_terms_options: dict = field(default_factory=dict)

    def to_dict(self):
        return {"annotationId": self.annotation_id,
                "phenotype": {"value": self.phenotype_name,
                              "modId": self.phenotype_id
                              },
                "gene": {"value": self.gene_name,
                         "modId": self.gene_id},
                "involved": self.involved_option,
                "anatomyTerms": [{"value": term.split(' ')[1].replace('(', '').replace(')', ''),
                                  "modId": term.split(' ')[0],
                                  "options": {k: v == 1 for k, v in self.anatomy_terms_options[term].items()}}
                                 for term in self.anatomy_terms],
                "remark": self.remark,
                "noctuamodel": self.noctuamodel,
                "genotype": self.genotype,
                "assay": {"value": self.assay},
                "dateAssigned": self.created_time.isoformat(),
                "evidence": ""
                }


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

    @staticmethod
    def _extract_annotations(rows, not_par: str = ''):
        options = ['Sufficient', 'Necessary'] if not_par == '' else ['Insufficient', 'Unnecessary']
        annotations = defaultdict(Annotation)
        for row in rows:
            annotations[row[0]].annotation_id = row[0]
            annotations[row[0]].gene_id = row[1].split(' ')[0]
            if row[2] == "Published_as":
                annotations[row[0]].gene_name = row[3]
            annotations[row[0]].involved_option = 'involved' if not_par == '' else 'not_involved'
            annotations[row[0]].anatomy_terms.add(row[4])
            if row[5] in options and row[6] != "":
                if row[4] not in annotations[row[0]].anatomy_terms_options:
                    annotations[row[0]].anatomy_terms_options[row[4]] = {options[0]: False, options[1]: False}
                annotations[row[0]].anatomy_terms_options[row[4]][row[5]] = True
            annotations[row[0]].phenotype_id = row[7].split(' ')[0]
            annotations[row[0]].phenotype_name = row[7].split(' ')[1].replace('(', '').replace(')', '')
            if row[8]:
                annotations[row[0]].remark = row[8]
            annotations[row[0]].assay = row[9]
            annotations[row[0]].created_time = row[10]
        return [v.to_dict() for k, v in annotations.items()]

    def get_anatomy_function_annotations(self, wb_paper_id):
        annotations = []
        self.cur.execute(QUERY.substitute(not_par='', paper_id=wb_paper_id))
        rows = self.cur.fetchall()
        annotations.extend(self._extract_annotations(rows))
        self.cur.execute(QUERY.substitute(not_par='not', paper_id=wb_paper_id))
        rows = self.cur.fetchall()
        annotations.extend(self._extract_annotations(rows, not_par='not'))
        return annotations

    def get_gene_name_from_id(self, gene_id):
        return None
