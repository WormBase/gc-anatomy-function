from string import Template


QUERY_INVOLVED_TEMPLATE = Template('SELECT joinkey, wbb_order, wbb_involved, wbb_evitype, wbb_evidence, wbb_timestamp '
                                   'FROM wbb_involved WHERE joinkey in (SELECT joinkey FROM wbb_reference '
                                   'WHERE wbb_reference = \'WBPaper${paper_id}\') '
                                   'ORDER BY wbb_timestamp DESC')


QUERY_NOTINVOLVED_TEMPLATE = Template('SELECT joinkey, wbb_order, wbb_notinvolved, wbb_evitype, wbb_evidence, '
                                      'wbb_timestamp '
                                      'FROM wbb_notinvolved WHERE joinkey IN (SELECT joinkey FROM wbb_reference WHERE '
                                      'wbb_reference = \'WBPaper${paper_id}\') '
                                      'ORDER BY wbb_timestamp DESC')


QUERY_GENE_TEMPLATE = Template('SELECT joinkey, wbb_gene, wbb_evitype, wbb_evidence, wbb_timestamp '
                               'FROM wbb_gene WHERE joinkey IN (SELECT joinkey FROM wbb_reference WHERE '
                               'wbb_reference = \'WBPaper${paper_id}\') '
                               'ORDER BY wbb_timestamp')


QUERY_PHENOTYPE_TEMPLATE = Template('SELECT joinkey, wbb_phenotype, wbb_evitype, wbb_evidence '
                                    'FROM wbb_phenotype WHERE joinkey IN (SELECT joinkey FROM wbb_reference WHERE '
                                    'wbb_reference = \'WBPaper${paper_id}\') '
                                    'ORDER BY wbb_timestamp')


QUERY_ASSAY_TEMPLATE = Template('SELECT joinkey, wbb_assay, wbb_cond, wbb_timestamp '
                                'FROM wbb_assay WHERE joinkey IN (SELECT joinkey FROM wbb_reference WHERE '
                                'wbb_reference = \'WBPaper${paper_id}\') '
                                'ORDER BY wbb_order, wbb_timestamp')


QUERY_REMARK_TEMPLATE = Template('SELECT joinkey, wbb_order, wbb_remark '
                                 'FROM wbb_remark WHERE joinkey IN (SELECT joinkey from wbb_reference '
                                 'WHERE wbb_reference = \'WBPaper${paper_id}\') '
                                 'ORDER BY wbb_remark.wbb_timestamp DESC, -(wbb_remark.wbb_order::INTEGER) ASC')


QUERY_GENE_NAME_TEMPLATE = Template('SELECT gin_locus FROM gin_locus JOIN gin_wbgene '
                                    'ON gin_locus.joinkey = gin_wbgene.joinkey WHERE gin_wbgene = \'${gene_id}\'')


QUERY_ANATOMYTERM_NAME_TEMPLATE = Template('SELECT obo_name_anatomy FROM obo_name_anatomy '
                                           'WHERE joinkey = \'${term_id}\'')


QUERY_ANNOTATIONS_TEMPLATE = Template('SELECT joinkey, wbb_timestamp FROM wbb_wbbtf '
                                      'WHERE joinkey IN (SELECT joinkey from wbb_reference WHERE '
                                      'wbb_reference = \'WBPaper${paper_id}\')')


QUERY_ALL_REFERENCES = Template('SELECT joinkey, wbb_reference, wbb_timestamp FROM wbb_reference where joinkey IN '
                                '(SELECT joinkey FROM wbb_reference WHERE wbb_reference = \'WBPaper${paper_id}\')')


GET_MAX_JOINKEY = 'SELECT max(joinkey::INTEGER) from wbb_wbbtf'


GET_MAX_ORDER_INVOLVED = Template('SELECT max(wbb_order::INTEGER) from wbb_involved WHERE joinkey = \'${joinkey}\'')


GET_MAX_ORDER_NOTINVOLVED = Template('SELECT max(wbb_order::INTEGER) from wbb_notinvolved '
                                     'WHERE joinkey = \'${joinkey}\'')


GET_MAX_ORDER_REMARK = Template('SELECT max(wbb_order::INTEGER) from wbb_remark WHERE joinkey = \'${joinkey}\'')


INSERT_GENE_TEMPLATE = Template('INSERT INTO wbb_gene (joinkey, wbb_gene, wbb_evitype, wbb_evidence) '
                                'VALUES (\'${joinkey}\', \'${gene}\', \'Published_as\', '
                                '\'${gene_name}\'), (\'${joinkey}\', \'${gene}\', \'none\', \'\')')


INSERT_PHENOTYPE_TEMPLATE = Template('INSERT INTO wbb_phenotype (joinkey, wbb_phenotype, wbb_evitype, wbb_evidence) '
                                     'VALUES (\'${joinkey}\', \'${phenotype}\', \'Autonomous\', \'${autonomous}\'), '
                                     '(\'${joinkey}\', \'${phenotype}\', \'Nonautonomous\', \'${nonautonomous}\'), '
                                     '(\'${joinkey}\', \'${phenotype}\', \'Remark\', \'\'), '
                                     '(\'${joinkey}\', \'${phenotype}\', \'none\', \'\')')


INSERT_INVOLVED_TEMPLATE = Template('INSERT INTO wbb_involved (joinkey, wbb_order, wbb_involved, wbb_evitype, '
                                    'wbb_evidence) VALUES (\'${joinkey}\', \'${order}\', \'${term}\','
                                    ' \'Sufficient\', \'${sufficient}\'), (\'${joinkey}\', \'${order}\', \'${term}\', '
                                    '\'Necessary\', \'${necessary}\'), (\'${joinkey}\', \'${order}\','
                                    ' \'${term}\', \'Remark\', \'\'), (\'${joinkey}\', \'${order}\', '
                                    '\'${term}\', \'none\', \'\')')


INSERT_NOTINVOLVED_TEMPLATE = Template('INSERT INTO wbb_notinvolved (joinkey, wbb_order, wbb_notinvolved, wbb_evitype, '
                                       'wbb_evidence) VALUES (\'${joinkey}\', \'${order}\', \'${term}\', '
                                       '\'Insufficient\', \'${insufficient}\'), (\'${joinkey}\', \'${order}\', '
                                       '\'${term}\', \'Unnecessary\', \'${unnecessary}\'), (\'${joinkey}\', '
                                       '\'${order}\', \'${term}\', \'Remark\', \'\'), (\'${joinkey}\', \'${order}\', '
                                       '\'${term}\', \'none\', \'\')')


INSERT_ASSAY_TEMPLATE = Template('INSERT INTO wbb_assay (joinkey, wbb_order, wbb_assay) '
                                 'VALUES (\'${joinkey}\', \'1\', \'${assay}\')')


INSERT_REMARK_TEMPLATE = Template('INSERT INTO wbb_remark (joinkey, wbb_order, wbb_remark, wbb_evitype, wbb_evidence) '
                                  'VALUES (\'${joinkey}\', \'${order}\', \'${remark}\', \'none\', \'\')')


INSERT_REFERENCE_TEMPLATE = Template('INSERT INTO wbb_reference (joinkey, wbb_reference) '
                                     'VALUES (\'${joinkey}\', \'${paper_id}\')')


INSERT_JOINKEY_TEMPLATE = Template('INSERT INTO wbb_wbbtf (joinkey, wbb_wbbtf) VALUES (\'${joinkey}\', \'${num}\')')

