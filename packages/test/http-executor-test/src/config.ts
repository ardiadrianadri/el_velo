import type { Service } from '@el_velo/common';
import { HttpMethod } from '@el_velo/http-executor';

export const ENVIRONMENT_CONFIG: Service[] = [
    {
        image: 'dhi.io/httpbin:0-debian-dev',
        name: 'backend',
        exposePorts: ['8080'],
        portsMapping: ['8080:8080']
    }
];

export const EXPECTED_RESPONSES = [{
    test: {
        url: 'get?pp="hello"',
        method: HttpMethod.GET,
    },
    response: {
        status: 200,
        'headers': {
            'server': 'gunicorn',
            'connection': 'keep-alive',
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
            'access-control-allow-credentials': 'true'
        },
        'body': {
            'args': {
                'pp': '"hello"'
            },
            'headers': {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Encoding': 'gzip, compress, deflate, br',
                'Connection': 'keep-alive',
                'User-Agent': 'axios/1.18.1'
            }
        }
    }
}, {
    test: {
        url: 'post',
        method: HttpMethod.POST,
        body: {
            hello: 'world'
        }
    },
    response: {
        status: 200,
        'headers': {
            'server': 'gunicorn',
            'connection': 'keep-alive',
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
            'access-control-allow-credentials': 'true'
        },
        'body': {
            'args': {},
            'data': '{"hello":"world"}',
            'files': {},
            'form': {},
            'headers': {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Encoding': 'gzip, compress, deflate, br',
                'Connection': 'keep-alive',
                'Content-Length': '17',
                'Content-Type': 'application/json',
                'User-Agent': 'axios/1.18.1'
            },
            'json': {
                'hello': 'world'
            }
        }
    }
}, {
    test: {
        url: 'put',
        method: HttpMethod.PUT,
        body: {
            hello: 'world'
        }
    },
    response: {
        status: 200,
        'headers': {
            'server': 'gunicorn',
            'connection': 'keep-alive',
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
            'access-control-allow-credentials': 'true'
        },
        'body': {
            'args': {},
            'data': '{"hello":"world"}',
            'files': {},
            'form': {},
            'headers': {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Encoding': 'gzip, compress, deflate, br',
                'Connection': 'keep-alive',
                'Content-Length': '17',
                'Content-Type': 'application/json',
                'User-Agent': 'axios/1.18.1'
            },
            'json': {
                'hello': 'world'
            }
        }

    }
}, {
    test: {
        url: 'delete',
        method: HttpMethod.DELETE
    },
    response: {
        status: 200,
        'headers': {
            'server': 'gunicorn',
            'connection': 'keep-alive',
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
            'access-control-allow-credentials': 'true'
        },
        'body': {
            'args': {},
            'data': '',
            'files': {},
            'form': {},
            'headers': {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Encoding': 'gzip, compress, deflate, br',
                'Connection': 'keep-alive',
                'User-Agent': 'axios/1.18.1'
            },
            'json': null
        }
    }
}];