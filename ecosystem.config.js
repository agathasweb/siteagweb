module.exports = {
    apps: [
        {
            name: 'agathas-site',
            script: 'node_modules/next/dist/bin/next',
            args: 'start --port 3002',
            cwd: './',
            exec_mode: 'fork',
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            error_file: './logs/site-error.log',
            out_file: './logs/site-out.log',
            merge_logs: true,
            env: {
                NODE_ENV: 'production',
                PORT: 3002,
            },
            env_production: {
                NODE_ENV: 'production',
            }
        }
    ]
};
