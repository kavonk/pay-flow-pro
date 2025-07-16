# Pay Flow Pro

This project contains a FastAPI backend and a React + TypeScript frontend. It was originally built with Databutton but is now structured to run on Vercel.

## Stack

- React+TypeScript frontend using `yarn`.
- Python FastAPI server running on Vercel's Python runtime.

## Quickstart

1. Install dependencies:

```bash
make
```

2. Start the backend and frontend servers locally:

```bash
make run-backend
make run-frontend
```

3. Build the frontend for production:

```bash
yarn --cwd frontend build
```

## Deployment on Vercel

The project includes a `vercel.json` configuration. Vercel will build the frontend using the script above and expose the FastAPI app as a Serverless Function. Simply run:

```bash
vercel deploy
```

and follow the prompts.

## Gotchas

The backend server runs on port 8000 and the frontend development server runs on port 5173. The frontend Vite server proxies API requests to the backend on port 8000.

Visit <http://localhost:5173> to view the application.
