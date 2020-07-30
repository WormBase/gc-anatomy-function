#!/usr/bin/env python3

import argparse
import json
import logging
import falcon

from wsgiref import simple_server
from falcon import HTTPStatus
from backend.dbmanager import DBManager


class HandleCORS(object):
    def process_request(self, req, resp):
        allow_headers = req.get_header(
            'Access-Control-Request-Headers',
            default='*'
        )
        resp.set_header('Access-Control-Allow-Origin', '*')
        resp.set_header('Access-Control-Allow-Methods', '*')
        resp.set_header('Access-Control-Allow-Headers', allow_headers)
        resp.set_header('Access-Control-Max-Age', 1728000)  # 20 days
        if req.method == 'OPTIONS':
            raise HTTPStatus(falcon.HTTP_200, body='\n')


class StorageEngine(object):

    def __init__(self, dbname, user, password, host):
        self.dbname = dbname
        self.user = user
        self.password = password
        self.host = host
        self.db_manager = None

    def __enter__(self):
        self.db_manager = DBManager(self.dbname, self.user, self.password, self.host)

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.db_manager.close()

    def get_anatomy_function_annotations(self, paper_id):
        return self.db_manager.get_anatomy_function_annotations(paper_id)

    def save_anatomy_function_annotations(self, annotations):
        return self.db_manager.save_anatomy_function_annotations(annotations)


class AnatomyFunctionAnnotationReader:

    def __init__(self, storage_engine: StorageEngine):
        self.db = storage_engine
        self.logger = logging.getLogger(__name__)

    def on_post(self, req, resp):
        with self.db:
            if "paper_id" in req.media:
                annotations = self.db.get_anatomy_function_annotations(req.media["paper_id"])
                resp.body = '{{"annotations": {}}}'.format(json.dumps(annotations))
                resp.status = falcon.HTTP_OK
            else:
                resp.status = falcon.HTTP_BAD_REQUEST


class AnatomyFunctionAnnotationWriter:

    def __init__(self, storage_engine: StorageEngine):
        self.db = storage_engine
        self.logger = logging.getLogger(__name__)

    def on_post(self, req, resp):
        with self.db:
            if "annotations" in req.media:
                annotations = req.media["annotations"]
                self.db.save_anatomy_function_annotations(annotations)
                resp.status = falcon.HTTP_OK
            else:
                resp.status = falcon.HTTP_BAD_REQUEST


def main():
    parser = argparse.ArgumentParser(description="Find new documents in WormBase collection and pre-populate data "
                                                 "structures for Author First Pass")
    parser.add_argument("-N", "--db-name", metavar="db_name", dest="db_name", type=str)
    parser.add_argument("-U", "--db-user", metavar="db_user", dest="db_user", type=str)
    parser.add_argument("-P", "--db-password", metavar="db_password", dest="db_password", type=str, default="")
    parser.add_argument("-H", "--db-host", metavar="db_host", dest="db_host", type=str)
    parser.add_argument("-l", "--log-file", metavar="log_file", dest="log_file", type=str, default=None,
                        help="path to the log file to generate. Default ./afp_pipeline.log")
    parser.add_argument("-L", "--log-level", dest="log_level", choices=['DEBUG', 'INFO', 'WARNING', 'ERROR',
                                                                        'CRITICAL'], default="INFO",
                        help="set the logging level")
    parser.add_argument("-p", "--port", metavar="port", dest="port", type=int, help="API port")
    args = parser.parse_args()

    logging.basicConfig(filename=args.log_file, level=args.log_level,
                        format='%(asctime)s - %(name)s - %(levelname)s:%(message)s')

    app = falcon.API(middleware=[HandleCORS()])
    db_manager = StorageEngine(args.db_name, args.db_user, args.db_password, args.db_host)
    anatomy_function_annotation_reader = AnatomyFunctionAnnotationReader(storage_engine=db_manager)
    anatomy_function_annotation_writer = AnatomyFunctionAnnotationWriter(storage_engine=db_manager)
    app.add_route('/get_anatomy_function_annotations', anatomy_function_annotation_reader)
    app.add_route('/save_anatomy_function_annotations', anatomy_function_annotation_writer)

    httpd = simple_server.make_server('0.0.0.0', args.port, app)
    httpd.serve_forever()


if __name__ == '__main__':
    main()
else:
    import os
    app = falcon.API(middleware=[HandleCORS()])
    db_manager = StorageEngine(os.environ['DB_NAME'], os.environ['DB_USER'], os.environ['DB_PASSWORD'],
                               os.environ['DB_HOST'])
    anatomy_function_annotation_reader = AnatomyFunctionAnnotationReader(storage_engine=db_manager)
    anatomy_function_annotation_writer = AnatomyFunctionAnnotationWriter(storage_engine=db_manager)
    app.add_route('/get_anatomy_function_annotations', anatomy_function_annotation_reader)
    app.add_route('/save_anatomy_function_annotations', anatomy_function_annotation_writer)
