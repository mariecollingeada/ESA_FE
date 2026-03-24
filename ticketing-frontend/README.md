# Petbook Frontend

React + Vite frontend for authentication and pet management.

## Stack

- React 19
- Vite 7
- React Router 7
- Axios
- Vitest + Testing Library
- ESLint 9

## Features

- User register/login/logout
- Password reset flow
- Home page pet cards
- Profile tabs:
	- My Profile
	- My Pets (create/edit/delete)
- Pet image upload flow
- API integration through centralized Axios client

## Requirements

- Node.js 20+ (recommended: 20.19 or newer)
- npm 10+

## Setup

```bash
npm install
```

Create/update `.env`:

```bash
VITE_API_BASE=http://localhost:8080
```

## Run Locally

```bash
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

## Scripts

- `npm run dev` : start development server
- `npm run build` : production build
- `npm run preview` : preview build locally
- `npm run lint` : run ESLint
- `npm run test` : run Vitest in watch mode
- `npm run test -- --run` : run tests once
- `npm run test:ui` : open Vitest UI
- `npm run test:coverage` : run tests with coverage
- `npx playwright test`: run e2e tests

## Testing and Coverage

Coverage uses the V8 provider via Vitest.

```bash
npm run test:coverage
```

E2E tests use playwright. You must ensure that the backend is running locally in order to be able to run playwright tests against it.

### Test Breakdown Summary

| Area | Test File | Coverage Focus |
|---|---|---|
| App shell | `src/App.test.jsx` | App renders without crashing |
| App bootstrap | `src/main.test.jsx` | React root creation and boot render |
| API client | `src/api/api.test.js` | Base URL, auth header, multipart behavior |
| Auth API wrappers | `src/api/auth.test.js` | Auth endpoint request wiring |
| Pets API wrappers | `src/api/pets.test.js` | Pets endpoint request wiring + upload payload |
| Navigation | `src/components/Nav.test.jsx` | Logged-in/out nav state and logout behavior |
| Home page | `src/pages/Home.test.jsx` | Pet list/detail rendering and edge/error states |
| Login page | `src/pages/Login.test.jsx` | Login success/error and forgot-password flow |
| Register page | `src/pages/Register.test.jsx` | Registration success and API error display |
| Reset password page | `src/pages/ResetPassword.test.jsx` | Validation, token parsing, API error, delayed redirect |
| Pets page | `src/pages/Pets.test.jsx` | CRUD, empty states, load errors, cancel flows |
| Profile page | `src/pages/Profile.test.jsx` | Profile tabs, pet CRUD branches, image upload validation/success/error |

Generated report:

- `coverage/index.html` (open in browser)

Note: `coverage/` is generated output and typically should not be committed.

## Project Structure

```text
src/
	api/
	components/
	pages/
	test/
```

Main route entry points are in `src/App.jsx`.

## Troubleshooting

- Engine warnings during install:
	Use Node 20+.

- API 404 in deployed frontend:
	Confirm your API base env value and backend route prefixes.

- Multipart upload fails with content-type errors:
	Ensure image upload requests are sent as `multipart/form-data` with field name `file`.