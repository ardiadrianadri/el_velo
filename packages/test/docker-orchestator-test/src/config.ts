import type { Service } from '@el_velo/docker-orchestator';

export const ENVIRONMENT_CONFIG: Service[] = [
    {
        image: 'traefik/whoami',
        name: 'backend'
    },
    {
        image: 'nginx:alpine',
        name: 'frontend',
        volumes: ['./src/files/nginx.conf:/etc/nginx/conf.d/default.conf:ro'],
        exposePorts: ['80'],
        portsMapping: ['8080:80']
    }
];