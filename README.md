# Smart Medical Reports Explainer

[![MIT Licensed](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](./LICENSE)
[![Powered by Modus_Create](https://img.shields.io/badge/powered_by-Modus_Create-blue.svg?longCache=true&style=flat&logo=data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMzIwIDMwMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNOTguODI0IDE0OS40OThjMCAxMi41Ny0yLjM1NiAyNC41ODItNi42MzcgMzUuNjM3LTQ5LjEtMjQuODEtODIuNzc1LTc1LjY5Mi04Mi43NzUtMTM0LjQ2IDAtMTcuNzgyIDMuMDkxLTM0LjgzOCA4Ljc0OS01MC42NzVhMTQ5LjUzNSAxNDkuNTM1IDAgMCAxIDQxLjEyNCAxMS4wNDYgMTA3Ljg3NyAxMDcuODc3IDAgMCAwLTcuNTIgMzkuNjI4YzAgMzYuODQyIDE4LjQyMyA2OS4zNiA0Ni41NDQgODguOTAzLjMyNiAzLjI2NS41MTUgNi41Ny41MTUgOS45MjF6TTY3LjgyIDE1LjAxOGM0OS4xIDI0LjgxMSA4Mi43NjggNzUuNzExIDgyLjc2OCAxMzQuNDggMCA4My4xNjgtNjcuNDIgMTUwLjU4OC0xNTAuNTg4IDE1MC41ODh2LTQyLjM1M2M1OS43NzggMCAxMDguMjM1LTQ4LjQ1OSAxMDguMjM1LTEwOC4yMzUgMC0zNi44NS0xOC40My02OS4zOC00Ni41NjItODguOTI3YTk5Ljk0OSA5OS45NDkgMCAwIDEtLjQ5Ny05Ljg5NyA5OC41MTIgOTguNTEyIDAgMCAxIDYuNjQ0LTM1LjY1NnptMTU1LjI5MiAxODIuNzE4YzE3LjczNyAzNS41NTggNTQuNDUgNTkuOTk3IDk2Ljg4OCA1OS45OTd2NDIuMzUzYy02MS45NTUgMC0xMTUuMTYyLTM3LjQyLTEzOC4yOC05MC44ODZhMTU4LjgxMSAxNTguODExIDAgMCAwIDQxLjM5Mi0xMS40NjR6bS0xMC4yNi02My41ODlhOTguMjMyIDk4LjIzMiAwIDAgMS00My40MjggMTQuODg5QzE2OS42NTQgNzIuMjI0IDIyNy4zOSA4Ljk1IDMwMS44NDUuMDAzYzQuNzAxIDEzLjE1MiA3LjU5MyAyNy4xNiA4LjQ1IDQxLjcxNC01MC4xMzMgNC40Ni05MC40MzMgNDMuMDgtOTcuNDQzIDkyLjQzem01NC4yNzgtNjguMTA1YzEyLjc5NC04LjEyNyAyNy41NjctMTMuNDA3IDQzLjQ1Mi0xNC45MTEtLjI0NyA4Mi45NTctNjcuNTY3IDE1MC4xMzItMTUwLjU4MiAxNTAuMTMyLTIuODQ2IDAtNS42NzMtLjA4OC04LjQ4LS4yNDNhMTU5LjM3OCAxNTkuMzc4IDAgMCAwIDguMTk4LTQyLjExOGMuMDk0IDAgLjE4Ny4wMDguMjgyLjAwOCA1NC41NTcgMCA5OS42NjUtNDAuMzczIDEwNy4xMy05Mi44Njh6IiBmaWxsPSIjRkZGIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz4KPC9zdmc+)](https://moduscreate.com)

AI-powered medical report translator that simplifies complex medical documents for patients and caregivers. This application helps users understand their health conditions, diagnoses, and test results without relying on unreliable online searches.

This project proposes an AI-powered medical report translator that simplifies complex medical documents for patients and caregivers. By leveraging AI-driven text extraction and natural language processing (NLP), the system translates medical jargon into plain language, helping users understand their health conditions, diagnoses, and test results without relying on unreliable online searches.

## Application Workflow

<div align="center">
  <table>
    <tr>
      <td align="center"><b>Home Screen</b></td>
      <td align="center"><b>Document Upload</b></td>
      <td align="center"><b>Processing</b></td>
    </tr>
    <tr>
      <td><img src="docs/assets/images/1%20-%20Home.png" width="250"/></td>
      <td><img src="docs/assets/images/3%20-%20upload2.png" width="250"/></td>
      <td><img src="docs/assets/images/4%20-%20processing.png" width="250"/></td>
    </tr>
    <tr>
      <td align="center"><b>Results Analysis</b></td>
      <td align="center"><b>Results Archive</b></td>
      <td align="center"><b>AI Integration</b></td>
    </tr>
    <tr>
      <td><img src="docs/assets/images/5%20-%20Results%20analysis.png" width="250"/></td>
      <td><img src="docs/assets/images/6%20-%20Results%20Archive.png" width="250"/></td>
      <td><img src="docs/assets/images/8%20-%20%20AI.png" width="250"/></td>
    </tr>
  </table>
</div>


## Project Packages

| Package   | Description                       | Status    |
|-----------|-----------------------------------|-----------|
| Frontend  | Ionic/React mobile application    | Active    |
| Backend   | API and ML services               | Planned   |

## Getting Started

Please see individual package READMEs for setup instructions:

- [Frontend](./frontend/README.md)
<!-- - [Backend](./backend/README.md) (Coming soon) -->

- [Getting Started](#getting-started)
- [How it Works](#how-it-works)
- [Developing](#developing)
  - [Prerequisites](#prerequisites)
  - [Docker Setup](#docker-setup)
  - [Testing](#testing)
  - [Contributing](#contributing)
- [Modus Create](#modus-create)
- [Licensing](#licensing)

# Getting Started

To run the application using Docker:

```bash
# Start all services
npm run dev

# Stop all services
npm run down

# Clean up everything (removes volumes and orphaned containers)
npm run clean
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

# How it works

The application consists of two main components:
- A NestJS backend service that handles API requests and AI processing
- A Vue.js frontend that provides the user interface

Both services are containerized using Docker for consistent development and deployment.

# Developing

## Prerequisites

- Docker Engine 24.0.0+
- Node.js 20.x+ (for local development)
- npm 10.x+ (for local development)

## Docker Setup

The project uses Docker Compose for development. The setup includes:

```
medical-reports-explainer/
├── backend/           # NestJS backend application
├── frontend/          # Vue.js frontend application
├── docker-compose.yml # Docker services configuration
└── package.json      # Root level npm scripts
```

### Environment Variables

Backend:
```
NODE_ENV=development
PORT=3000
```

Frontend:
```
VITE_API_URL=http://backend:3000
```

### Troubleshooting

1. If containers fail to start:
```bash
npm run clean
npm run dev
```

2. For port conflicts:
```bash
# Find the process using the port
sudo lsof -i :3000  # or :5173
# Kill the process
kill -9 <PID>
```

3. View container logs:
```bash
# All containers
docker compose logs

# Specific service
docker compose logs backend
docker compose logs frontend
```

## Testing

{Notes on testing}

## Contributing

See [Contribution Guidelines](.github/CONTRIBUTING.md) and [Code of Conduct](.github/CODE_OF_CONDUCT.md).

# Modus Create

[Modus Create](https://moduscreate.com) is a digital product consultancy. We use a distributed team of the best talent in the world to offer a full suite of digital product design-build services; ranging from consumer facing apps, to digital migration, to agile development training, and business transformation.

<a href="https://moduscreate.com/?utm_source=labs&utm_medium=github&utm_campaign=PROJECT_NAME"><img src="https://res.cloudinary.com/modus-labs/image/upload/h_80/v1533109874/modus/logo-long-black.svg" height="80" alt="Modus Create"/></a>
<br />

This project is part of [Modus Labs](https://labs.moduscreate.com/?utm_source=labs&utm_medium=github&utm_campaign=PROJECT_NAME).

<a href="https://labs.moduscreate.com/?utm_source=labs&utm_medium=github&utm_campaign=PROJECT_NAME"><img src="https://res.cloudinary.com/modus-labs/image/upload/h_80/v1531492623/labs/logo-black.svg" height="80" alt="Modus Labs"/></a>

# Licensing

This project is [MIT licensed](./LICENSE).
