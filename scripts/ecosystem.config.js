// PM2 ecosystem — Rail APIs & Clients
//
// Run from anywhere; cwd paths are absolute.
//   pm2 start rail-projects/scripts/ecosystem.config.js   start all
//   pm2 stop  all                                          stop all
//   pm2 restart all                                        restart all
//   pm2 list                                               status overview
//   pm2 logs <name>                                        live logs for one service
//   pm2 monit                                              interactive dashboard
//
// Build the APIs first (they run from compiled dist/):
//   bash rail-projects/scripts/build-all.sh
//
// Ports follow the workspace api+1200 convention documented in
// rail-projects/CLAUDE.md "Ports and service map".

const BASE = process.env.HOME + '/Developer';

module.exports = {
  apps: [
    // ── Rail ID Service ───────────────────────────────── 3000 / 4200
    {
      name: 'rail-id-api',
      cwd: `${BASE}/Rail-ID-Service/api`,
      script: 'npm',
      args: 'run start:prod',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'rail-id-client',
      cwd: `${BASE}/Rail-ID-Service/client-ng`,
      script: 'npx',
      args: 'ng serve --proxy-config proxy.conf.json --port 4200',
    },

    // ── railML-Infrastructure ────────────────────────── 3005 / 4205
    {
      name: 'infrastructure-api',
      cwd: `${BASE}/railML-Infrastructure/api`,
      script: 'npm',
      args: 'run start:prod',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'infrastructure-client',
      cwd: `${BASE}/railML-Infrastructure/client-ng`,
      script: 'npx',
      args: 'ng serve --proxy-config proxy.conf.json --port 4205',
    },

    // ── railML-Timetable ─────────────────────────────── 3010 / 4210
    {
      name: 'timetable-api',
      cwd: `${BASE}/railML-Timetable/api`,
      script: 'npm',
      args: 'run start:prod',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'timetable-client',
      cwd: `${BASE}/railML-Timetable/client-ng`,
      script: 'npx',
      args: 'ng serve --proxy-config proxy.conf.json --port 4210',
    },

    // ── railML-RollingStock ──────────────────────────── 3015 / 4215
    {
      name: 'rolling-stock-api',
      cwd: `${BASE}/railML-RollingStock/api`,
      script: 'npm',
      args: 'run start:prod',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'rolling-stock-client',
      cwd: `${BASE}/railML-RollingStock/client-ng`,
      script: 'npx',
      args: 'ng serve --proxy-config proxy.conf.json --port 4215',
    },

    // ── railML-StockCrewPlan ─────────────────────────── 3020 / 4220
    {
      name: 'stock-crew-plan-api',
      cwd: `${BASE}/railML-StockCrewPlan/api`,
      script: 'npm',
      args: 'run start:prod',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'stock-crew-plan-client',
      cwd: `${BASE}/railML-StockCrewPlan/client-ng`,
      script: 'npx',
      args: 'ng serve --proxy-config proxy.conf.json --port 4220',
    },

    // ── railML-Crew ──────────────────────────────────── 3025 / 4225
    {
      name: 'crew-api',
      cwd: `${BASE}/railML-Crew/api`,
      script: 'npm',
      args: 'run start:prod',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'crew-client',
      cwd: `${BASE}/railML-Crew/client-ng`,
      script: 'npx',
      args: 'ng serve --proxy-config proxy.conf.json --port 4225',
    },
  ],
};
