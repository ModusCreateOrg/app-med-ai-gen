# Frontend Technology Stack Documentation

## Core Technologies

### Ionic + React
- **Purpose**: Cross-platform user interface core that enables building high-quality native and web app experiences
- **Benefits**: 
  - Single codebase for iOS, Android, and web
  - Extensive library of UI components
  - Native device functionality access
  - Optimized performance
- **Key Components**:
  - Ionic components (`IonPage`, `IonContent`, etc.)
  - React Navigation integration
  - Platform-specific styling

### React
- **Version**: Latest stable (18+)
- **Features Used**:
  - Functional components
  - React Hooks (useState, useEffect, useContext, useRef)
  - Context API for global state
  - Error boundaries

## Data Management

### Axios
- **Purpose**: HTTP client for making API requests
- **Implementation**:
  - Centralized API instance with interceptors
  - Request/response transformations
  - Automatic error handling
  - Request cancellation support

### TanStack Query (React Query)
- **Purpose**: Asynchronous state management, caching, and data fetching
- **Key Features**:
  - Automatic caching and background refetching
  - Pagination and infinite scroll support
  - Optimistic updates
  - Prefetching capabilities
  - Devtools for debugging

## UI Components & Styling

### Font Awesome
- **Purpose**: Comprehensive icon library
- **Implementation**:
  - Specific icon subset import to reduce bundle size
  - Standard usage pattern for consistent icon presentation

### Google Fonts
- **Purpose**: Rich typography
- **Fonts Used**:
  - Primary: [Specify primary font]
  - Secondary: [Specify secondary font]
  - Loading strategy: Web Font Loader with fallbacks

### Remark Markdown
- **Purpose**: Markdown renderer for content display
- **Features**:
  - Custom renderers for application-specific components
  - Syntax highlighting for code blocks
  - Security measures for user-generated content

### Tailwind CSS
- **Purpose**: Utility-first CSS framework
- **Configuration**:
  - Custom theme extending Tailwind defaults
  - Component-specific extensions
  - Responsive design utilities
  - Dark mode support

## Testing Infrastructure

### Vitest
- **Purpose**: Core test framework
- **Configuration**:
  - Component testing setup
  - Integration with React Testing Library
  - Coverage reporting

### React Testing Library
- **Purpose**: User-centric approach for UI component tests
- **Practices**:
  - Testing user interactions over implementation details
  - Accessibility testing integration
  - Common testing patterns and utilities

### Mock Service Worker
- **Purpose**: API mocking for tests and development
- **Implementation**:
  - Request interception
  - Realistic API simulation
  - Testing scenarios setup

## Cursor Rules & Code Style Guidelines

### General Formatting
- Indent using 2 spaces
- Maximum line length: 100 characters
- UTF-8 encoding for all files
- LF line endings

### React Component Structure
```jsx
// Imports grouped by:
// 1. React/framework imports
// 2. Third-party libraries
// 3. Local components
// 4. Utilities/helpers
// 5. Assets/styles

// Component interfaces/types at the top
interface ComponentProps {
  // ...
}

// Functional component with explicit return type
const ComponentName: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Hooks at the top
  const [state, setState] = useState<StateType>(initialState);
  
  // Effects after hooks
  useEffect(() => {
    // Effect content
  }, [dependencies]);
  
  // Event handlers and other functions
  const handleEvent = () => {
    // ...
  };
  
  // Return JSX with consistent formatting
  return (
    <div className="tailwind-classes">
      {/* Components with more than 3 props on separate lines */}
      <ChildComponent
        prop1={value1}
        prop2={value2}
        prop3={value3}
      />
    </div>
  );
};

// Default export at the bottom
export default ComponentName;
```

### Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile`)
- **Files**: 
  - Component files: PascalCase matching component name (e.g., `UserProfile.tsx`)
  - Utility files: camelCase (e.g., `formatDate.ts`)
- **Functions**: camelCase (e.g., `handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- **Interfaces/Types**: PascalCase with prefix (e.g., `IUserData` or `TUserData`)
- **CSS Classes**: kebab-case (e.g., `user-profile-container`)

### API and Data Fetching
- Use TanStack Query hooks for all data fetching
- Centralize API calls in dedicated service files
- Implement proper error handling for all requests
- Use consistent data transformation patterns

### State Management
- Prefer local component state for component-specific state
- Use Context API for shared state across multiple components
- Implement TanStack Query for server state
- Document all context providers and their purpose

### Testing Standards
- Minimum test coverage: 80%
- Test user interactions, not implementation details
- One test file per component/utility (e.g., `Component.test.tsx`)
- Use meaningful test descriptions that explain expected behavior

### Performance Considerations
- Memoize expensive calculations with useMemo
- Optimize renders with React.memo for pure components
- Use useCallback for function references passed as props
- Implement virtualization for long lists

### Accessibility Standards
- All interactive elements must be keyboard accessible
- Proper ARIA roles and attributes where applicable
- Maintain proper heading hierarchy
- Ensure sufficient color contrast
- Support screen readers with appropriate alt text and aria labels

## Version Control Guidelines
- Use feature branches for all new development
- Conventional commit messages (feat, fix, docs, style, refactor, test, chore)
- Pull request templates must be followed
- Code must pass all automated checks before review 

## Helpful Hints

### Data

This project's API integration uses the simulated REST endpoints made available by [JSON Placeholder](https://jsonplaceholder.typicode.com/).

### Authentication

When running the application, you may sign in with any of the JSON Placeholder [Users](https://jsonplaceholder.typicode.com/users). Simply enter the _Username_ value from any user in the API and use any value for the _Password_. For example, try username `Bret` and password `abc123`.

### Easter Eggs

#### Diagnostics

Many applications, particularly mobile applications, have a hidden page which displays content useful for troubleshooting and support. To access the diagnostics page, go to the _Account_ page. Locate the _About_ section and click or tap the _Version_ item 7 times.

## About

This project was bootstrapped with the [Ionic CLI](https://ionicframework.com/docs/cli/commands/start).

```
ionic start ionic8-playground blank --type=react
```

### Code Formatting

The project includes a configuration file for the [Prettier](https://prettier.io/docs/en/configuration.html) code formatter. This allows all project contributors to share the same code formatting rules.

Adjust the Prettier configuration as desired.

## Installation

### Prerequistes


### Clone the Repository

Open the [repository][repo] in a browser. Follow the instructions to clone the repository to your local machine.

### Install the Dependencies

To install the project dependencies, navigate into the frontend folder and issue the following commands at a terminal prompt in the project base directory:

```bash
# Switch to the project node version...
nvm use

# Install project dependencies
npm install
```

### After Installation

The installation is now complete! You may open the project in your favorite source code editor (we recommend [Visual Studio Code](https://code.visualstudio.com/)).

We recommend the following VS Code extensions:

- Prettier - Code formatter (required)
- ESLint - Source code analysis (strongly recommended)
- Ionic (optional)
- Indent Rainbow (optional)
- GitLens (optional)
- Dotenv Official +Vault (optional)
- GitHub Actions (optional)

Install the _Prettier_ extension to ensure that all project participants' contributions are formatted using the same rules. The extension leverages project-specific rules found in the `.prettierrc` file in the project base directory.

## Configuration

The application is configured using Environment Variables. Because single-page applications are static, environment variable values are injected into the application during the build. The environment variables may be sourced from the environment or `.env` files as described in the [Vite documentation](https://vitejs.dev/guide/env-and-mode.html).

> **NOTE:** Ionic Config provides a way to change the properties of Ionic components globally. This is different from application configuration. See the [Ionic Config](https://ionicframework.com/docs/developing/config) docs for more details.

### `.env` files

> **NOTE:** Because they may contain sensitive information, `.env` files are not committed to the repository.

> **TIP:** When configuration values are modified, notify your DevOps team to modify the values in automation pipelines accordingly.

After project installation and before running the application locally, create the following `.env` files in the project base directory. Learn more in the official [Vite guide for environment variables and modes](https://vitejs.dev/guide/env-and-mode.html).

#### `.env.local`

The `.env.local` configuration file provides the configuration values when the application is started on a developer's local machine.

```
# Provided by Pipeline (Simulated)
VITE_BUILD_DATE=1970-01-01
VITE_BUILD_TIME=00:00:00
VITE_BUILD_TS=1970-01-01T00:00:00+0000
VITE_BUILD_COMMIT_SHA=local
VITE_BUILD_ENV_CODE=local
VITE_BUILD_WORKFLOW_RUNNER=local
VITE_BUILD_WORKFLOW_NAME=local
VITE_BUILD_WORKFLOW_RUN_NUMBER=1
VITE_BUILD_WORKFLOW_RUN_ATTEMPT=1

# API Configuration
VITE_BASE_URL_API=https://jsonplaceholder.typicode.com

# Toasts Configuration
VITE_TOAST_AUTO_DISMISS_MILLIS=5000
```

#### `.env.test.local`

The `.env.test.local` configuration file provides configuration values used when tests are executed on a developer's local machine.

> **NOTE:** Use the same values when running tests in a CI/CD pipeline.

```
# Provided by Pipeline (Simulated)
VITE_BUILD_DATE=1970-01-01
VITE_BUILD_TIME=00:00:00
VITE_BUILD_TS=1970-01-01T00:00:00+0000
VITE_BUILD_COMMIT_SHA=test
VITE_BUILD_ENV_CODE=test
VITE_BUILD_WORKFLOW_RUNNER=test
VITE_BUILD_WORKFLOW_NAME=test
VITE_BUILD_WORKFLOW_RUN_NUMBER=1
VITE_BUILD_WORKFLOW_RUN_ATTEMPT=1

# API Configuration
VITE_BASE_URL_API=https://jsonplaceholder.typicode.com

# Toasts Configuration
VITE_TOAST_AUTO_DISMISS_MILLIS=1500
```

# Available Scripts

Many of the scripts leverage the [Ionic CLI](https://ionicframework.com/docs/cli), the [Vite CLI](https://vitejs.dev/guide/cli.html), or the [Vitest CLI](https://vitest.dev/guide/cli.html). Read more about them in their respective official guides.

In the project base directory, the following commands are available to run.

### `npm run dev`

Runs the app in the development mode.
Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

The page will reload if you make edits.

### `npm test`

Launches the test runner in the interactive watch mode.
See the section about [running tests](https://vitest.dev/guide/cli.html) for more information.

### `npm run test:coverage`

Runs the test suites once and produces a coverage report. A detailed test coverage report is created in the `./coverage` directory.

### `npm run test:ci`

Executes the test runner in `CI` mode and produces a coverage report. With `CI` mode enabled, the test runner executes all tests one time and prints a summary report to the console. A code coverage report is printed to the console immediately following the test summary.

A detailed test coverage report is created in the `./coverage` directory.

> **NOTE:** This is the command which should be utilized by CI/CD platforms.

### `npm run test:e2e`

Runs all end-to-end (e2e) tests using the Cypress framework. See the [Cypress CLI](https://docs.cypress.io/guides/guides/command-line) documentation for more information.

### `npm run build`

Builds the app for production to the `dist` folder.
It correctly bundles in production mode and optimizes the build for the best performance.

See the official guide for more information about [building for production](https://vitejs.dev/guide/build.html) and [deploying a static site](https://vitejs.dev/guide/static-deploy.html).

### `npm run lint`

Runs the [ESLint][eslint] static code analysis and prints the results to the console.

## DevOps

### Cloud Resources

The AWS resources for this application component are provisioned via AWS CloudFormation. The `template.yml` file is the CloudFormation template.

The resources provisioned are:

| Resource                | Description                                                                   |
| ----------------------- | ----------------------------------------------------------------------------- |
| S3 Bucket               | Contains the published application.                                           |
| S3 Bucket Policy        | Provides access to the S3 Bucket from AWS CloudFront.                         |
| CloudFront Distribution | A CloudFront distribution to serve the SPA application.                       |
| CloudFront Distribution | A CloudFront distribution to serve the full-stack application (UI, API, etc). |
| Route53 RecordSet       | An `A` record for the application distribution.                               |
| Route53 RecordSet       | An `AAAA` record for the application distribution.                            |

### CI/CD Pipelines

This project uses GitHub Actions to perform DevOps automation activities such as Continuous Integration and Continous Deployment. See all project [GitHub Actions workflow runs](https://github.com/mwarman/ionic8-playground/actions).

| Workflow              | Trigger                        | Description                                                                          |
| --------------------- | ------------------------------ | ------------------------------------------------------------------------------------ |
| CI                    | Pull Request for `main` branch | Builds, lints, and tests the application. Validates the AWS CloudFormation template. |
| Deploy to Development | Push to `main` branch          | Deploys AWS CloudFormation stack. Builds and deploys the application.                |
| Deploy to QA          | Push to `release/*` branch     | Deploys AWS CloudFormation stack. Builds and deploys the application.                |
| Deploy to Production  | Publish a Release              | Deploys AWS CloudFormation stack. Builds and deploys the application.                |

## Related Information

- [Ionic][ionic]
- [Vite][vite]
- [React][react]
- [TanStack][tanstack]
- [Axios][axios]
- [Formik][formik]
- [Yup][yup]
- [Testing Library][testing-library]
- [Vitest][vitest]
- [Cypress][cypress]
- [ESLint][eslint]
- [GitHub Actions][ghactions]

[repo]: https://github.com/ModusCreateOrg/app-med-ai-gen 'GitHub Repository'
[nvm]: https://github.com/nvm-sh/nvm 'Node Version Manager'
[ionic]: https://ionicframework.com/docs/react 'Ionic with React'
[vite]: https://vitejs.dev/ 'Vite'
[react]: https://react.dev/ 'React'
[axios]: https://axios-http.com/ 'Axios'
[formik]: https://formik.org/ 'Formik'
[yup]: https://github.com/jquense/yup 'Yup'
[tanstack]: https://tanstack.com/ 'TanStack'
[testing-library]: https://testing-library.com/ 'Testing Library'
[vitest]: https://vitest.dev/ 'Vitest Testing Framework'
[ghactions]: https://docs.github.com/en/actions 'GitHub Actions'
[eslint]: https://eslint.org/docs/latest/ 'ESLint'
[cypress]: https://docs.cypress.io/guides/overview/why-cypress 'Cypress Testing Framework'
