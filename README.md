
# Splitwise

Splitwise is a Next.js application designed to simplify expense sharing for group activities. It allows users to:

- List activity attendees.
- Log expenses, specifying who paid and who participated.
- Create and manage groups of attendees for easier participant selection.
- Calculate individual balances (who owes whom and how much).
- View optimized transaction lists to minimize the number of payments needed to settle debts.
- Save and load project data.

The application features a clean, user-friendly interface.

## Core Features

- **Attendee Management**: Easily add and remove activity attendees.
- **Group Management**: Create named groups of attendees for quick participant selection.
- **Expense Input**: A straightforward form to log expenses, including description, amount, payer, and participants (selectable individually or by group).
- **Fast Expense Entry**: Quickly populate expense details using a comma-separated format.
- **Balance Calculation**: Automatically computes how much each attendee owes or is owed.
- **Transaction Optimization**: Minimizes the number of payments required for everyone to settle up, with an option to simplify individual payment chains.
- **Clear Summaries**: Displays detailed expense lists, individual balances, and a clear list of who needs to pay whom.
- **Data Persistence**: Save your entire project (attendees, groups, expenses) to a JSON file and load it back.
- **Export Options**: Export expense summaries to CSV and settlement details to text for easy sharing.
- **Flexible Layout**: Toggle between single and dual-column layouts.

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Shadcn/ui (for UI components)
- Genkit (Core framework, AI model usage removed)

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
    (Previously, this section mentioned API keys for GenAI services. As AI features have been removed, this specific setup is no longer required for core functionality.)

4.  **Run the development server**:
    ```bash
    npm run dev
    ```
    This will typically start the Next.js app on `http://localhost:9002` (as per `package.json` scripts). If you were previously running `genkit:dev` or `genkit:watch` for AI features, these are no longer necessary unless you re-introduce Genkit flows.

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
