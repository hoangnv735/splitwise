# SettleUp Picnics

SettleUp Picnics is a Next.js application designed to simplify expense sharing for group picnics. It allows users to:

- List picnic attendees.
- Log expenses, specifying who paid and who participated.
- Get AI-powered suggestions for expense attribution based on descriptions.
- Calculate individual balances (who owes whom and how much).
- View optimized transaction lists to minimize the number of payments needed to settle debts.

The application features a clean, user-friendly interface with a nature-inspired pastel color scheme.

## Core Features

- **Attendee Management**: Easily add and remove picnic attendees.
- **Expense Input**: A straightforward form to log expenses, including description, amount, payer, and participants.
- **AI-Powered Expense Attribution**: Leverages a GenAI model to suggest which participants might be associated with an expense based on its description.
- **Balance Calculation**: Automatically computes how much each attendee owes or is owed.
- **Transaction Optimization**: Minimizes the number of payments required for everyone to settle up.
- **Clear Summaries**: Displays detailed expense lists, individual balances, and a clear list of who needs to pay whom.

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Shadcn/ui (for UI components)
- Genkit (for AI flow integration)

## Getting Started

To get this project up and running on your local machine, follow these steps:

1.  **Clone the repository** (if applicable, or ensure you have the project files).
2.  **Install dependencies**:
    ```bash
    npm install
    ```
    or
    ```bash
    yarn install
    ```
3.  **Set up environment variables**:
    If the application uses any GenAI services requiring API keys (like Google AI for Genkit), create a `.env` file in the root directory and add your keys:
    ```env
    GOOGLE_API_KEY=your_google_api_key_here 
    ```
    (Refer to Genkit and Google AI documentation for specifics on obtaining and setting up API keys.)

4.  **Run the development server**:
    ```bash
    npm run dev
    ```
    This will typically start the Next.js app on `http://localhost:9002` (as per `package.json` scripts) and the Genkit development server on its default port (usually `http://localhost:4000`).

5.  Open [http://localhost:9002](http://localhost:9002) in your browser to see the application.

## Building for Production

To build the application for production:

```bash
npm run build
```

Then, to start the production server:

```bash
npm run start
```

## Linting and Type Checking

- To lint the code:
  ```bash
  npm run lint
  ```
- To perform a TypeScript type check:
  ```bash
  npm run typecheck
  ```
