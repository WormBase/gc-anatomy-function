from string import Template


QUERY_INVOLVED_TEMPLATE = Template('SELECT wbb_involved.joinkey, wbb_involved.wbb_involved, wbb_involved.wbb_evitype, '
                                   'wbb_involved.wbb_evidence, wbb_involved.wbb_timestamp '
                                   'FROM wbb_involved '
                                   'JOIN wbb_reference '
                                   'ON wbb_involved.joinkey = wbb_reference.joinkey '
                                   'WHERE wbb_reference.wbb_reference = \'WBPaper${paper_id}\'')


QUERY_NOTINVOLVED_TEMPLATE = Template('SELECT wbb_notinvolved.joinkey, wbb_notinvolved.wbb_notinvolved, '
                                      'wbb_notinvolved.wbb_evitype, wbb_notinvolved.wbb_evidence, '
                                      'wbb_notinvolved.wbb_timestamp '
                                      'FROM wbb_notinvolved '
                                      'JOIN wbb_reference '
                                      'ON wbb_notinvolved.joinkey = wbb_reference.joinkey '
                                      'WHERE wbb_reference.wbb_reference = \'WBPaper${paper_id}\'')


QUERY_GENE_TEMPLATE = Template('SELECT wbb_gene.joinkey, wbb_gene.wbb_gene, wbb_gene.wbb_evitype, '
                               'wbb_gene.wbb_evidence, wbb_gene.wbb_timestamp '
                               'FROM wbb_gene '
                               'JOIN wbb_reference '
                               'ON wbb_gene.joinkey = wbb_reference.joinkey '
                               'WHERE wbb_reference.wbb_reference = \'WBPaper${paper_id}\' '
                               'ORDER BY wbb_gene.wbb_timestamp')


QUERY_PHENOTYPE_TEMPLATE = Template('SELECT wbb_phenotype.joinkey, wbb_phenotype.wbb_phenotype, '
                                    'wbb_phenotype.wbb_evitype, wbb_phenotype.wbb_evidence '
                                    'FROM wbb_phenotype '
                                    'JOIN wbb_reference '
                                    'ON wbb_phenotype.joinkey = wbb_reference.joinkey '
                                    'WHERE wbb_reference.wbb_reference = \'WBPaper${paper_id}\' '
                                    'ORDER BY wbb_phenotype.wbb_timestamp')

QUERY_ASSAY_TEMPLATE = Template('SELECT wbb_assay.joinkey, wbb_assay.wbb_assay, '
                                'wbb_assay.wbb_cond, wbb_assay.wbb_timestamp '
                                'FROM wbb_assay '
                                'JOIN wbb_reference '
                                'ON wbb_assay.joinkey = wbb_reference.joinkey '
                                'WHERE wbb_reference.wbb_reference = \'WBPaper${paper_id}\' '
                                'ORDER BY wbb_assay.wbb_order, wbb_assay.wbb_timestamp')

QUERY_REMARK_TEMPLATE = Template('SELECT wbb_remark.joinkey, wbb_remark.wbb_remark, '
                                 'wbb_remark.wbb_cond, wbb_assay.wbb_timestamp '
                                 'FROM wbb_assay '
                                 'JOIN wbb_reference '
                                 'ON wbb_assay.joinkey = wbb_reference.joinkey '
                                 'WHERE wbb_reference.wbb_reference = \'WBPaper${paper_id}\' '
                                 'ORDER BY wbb_assay.wbb_order, wbb_assay.wbb_timestamp')


QUERY_GENE_NAME_TEMPLATE = Template('SELECT gin_locus FROM gin_locus JOIN gin_wbgene '
                                    'ON gin_locus.joinkey = gin_wbgene.joinkey WHERE gin_wbgene = \'${gene_id}\'')


QUERY_ANNOTATIONS_TEMPLATE = Template('SELECT wbb_wbbtf.joinkey, wbb_wbbtf.wbb_timestamp FROM wbb_wbbtf '
                                      'JOIN wbb_reference ON wbb_wbbtf.joinkey = wbb_reference.joinkey WHERE '
                                      'wbb_reference = \'WBPaper${paper_id}\'')


GET_MAX_JOINKEY = 'SELECT max(joinkey::INTEGER) from wbb_wbbtf'


INSERT_GENE_TEMPLATE = Template('INSERT INTO wbb_gene (joinkey, wbb_gene, wbb_evitype, wbb_evidence) '
                                'VALUES (\'${joinkey}\', \'${gene_id} (${gene_name})\', \'Published_as\', '
                                '\'${gene_name}\'), (\'${joinkey}\', \'${gene_id} (${gene_name})\', \'none\', \'\')')


INSERT_PHENOTYPE_TEMPLATE = Template('INSERT INTO wbb_phenotype (joinkey, wbb_phenotype, wbb_evitype) '
                                     'VALUES (\'${joinkey}\', \'${phenotype_id} (${phenotype_name})\', '
                                     '\'Autonomous\'), (\'${joinkey}\', \'${phenotype_id} (${phenotype_name})\', '
                                     '\'Nonautonomous\'), (\'${joinkey}\', \'${phenotype_id} (${phenotype_name})\', '
                                     '\'Remark\'), (\'${joinkey}\', \'${phenotype_id} (${phenotype_name})\', '
                                     '\'none\')')


INSERT_INVOLVED_TEMPLATE = Template('INSERT INTO wbb_involved (joinkey, wbb_order, wbb_involved, wbb_evitype, '
                                    'wbb_evidence) VALUES (\'${joinkey}\', \'${order}\', \'${term_id} (${term_name})\','
                                    ' \'Sufficient\', \'${sufficient}\'), (\'${joinkey}\', \'${order}\', \'${term_id} '
                                    '(${term_name})\', \'Necessary\', \'${necessary}\'), (\'${joinkey}\', \'${order}\','
                                    ' \'${term_id} (${term_name})\', \'Remark\', \'\'), (\'${joinkey}\', \'${order}\', '
                                    '\'${term_id} (${term_name})\', \'none\', \'\')')


INSERT_NOTINVOLVED_TEMPLATE = Template('INSERT INTO wbb_notinvolved (joinkey, wbb_order, wbb_notinvolved, wbb_evitype, '
                                       'wbb_evidence) VALUES (\'${joinkey}\', \'${order}\', \'${term_id} '
                                       '(${term_name})\', \'Inufficient\', \'${insufficient}\'), (\'${joinkey}\', '
                                       '\'${order}\', \'${term_id} (${term_name})\', \'Unnecessary\', '
                                       '\'${unnecessary}\'), (\'${joinkey}\', \'${order}\', \'${term_id} '
                                       '(${term_name})\', \'Remark\', \'\'), (\'${joinkey}\', \'${order}\', '
                                       '\'${term_id} (${term_name})\', \'none\', \'\')')


INSERT_ASSAY_TEMPLATE = Template('INSERT INTO wbb_assay (joinkey, wbb_order, wbb_assay, wbb_cond) '
                                 'VALUES (\'${joinkey}\', \'${order}\', \'${assay}\', E\'${paper_id}_1\n${genotype}\')')


INSERT_REMARK_TEMPLATE = Template('INSERT INTO wbb_remark (joinkey, wbb_order, wbb_remark, wbb_evitype, wbb_evidence) '
                                  'VALUES (\'${joinkey}\', \'1\', \'${remark}\', \'Curator_confirmed\', \'\'), '
                                  '(\'${joinkey}\', \'1\', \'${remark}\', \'Person_evidence\', \'\'), '
                                  '(\'${joinkey}\', \'1\', \'${remark}\', \'none\', \'\')')


INSERT_REFERENCE_TEMPLATE = Template('INSERT INTO wbb_reference (joinkey, wbb_reference) '
                                     'VALUES (\'${joinkey}\', \'${paper_id}\')')


INSERT_JOINKEY_TEMPLATE = Template('INSERT INTO wbb_wbbtf (joinkey, wbb_wbbtf) VALUES (\'${joinkey}\', \'${num}\')')


DELETE_GENE_TEMPLATE = Template('DELETE FROM wbb_gene WHERE joinkey = \'${joinkey}\'')


DELETE_PHENOTYPE_TEMPLATE = Template('DELETE FROM wbb_phenotype WHERE joinkey = \'${joinkey}\'')


DELETE_INVOLVED_TEMPLATE = Template('DELETE FROM wbb_involved WHERE joinkey = \'${joinkey}\'')


DELETE_NOTINVOLVED_TEMPLATE = Template('DELETE FROM wbb_notinvolved WHERE joinkey = \'${joinkey}\'')


DELETE_REMARK_TEMPLATE = Template('DELETE FROM wbb_remark WHERE joinkey = \'${joinkey}\'')


DELETE_REFERENCE_TEMPLATE = Template('DELETE FROM wbb_reference WHERE joinkey = \'${joinkey}\'')


DELETE_ASSAY_TEMPLATE = Template('DELETE FROM wbb_assay WHERE joinkey = \'${joinkey}\'')
