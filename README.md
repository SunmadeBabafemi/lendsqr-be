# lendsqr-be

db-diagram-link = https://dbdocs.io/babafemiolasunmade/lendsqr-ass-babafemi

## Description

[LendSQR](https://github.com/SunmadeBabafemi/lendsqr-be) a backend server for a mobile app that requires wallet functionality. This is needed as borrowers need a wallet to receive the loans they have been granted and also send the money for repayments.

1. User Account Creation: Users can create their accounts with basic information (email, password, etc.).
2. Fund Wallet: Users can deposit money into their wallets.
3. Inter-wallet Transfer: Users can send funds between wallets within the system.
4. Withdraw Funds: Users can withdraw funds from their wallets to external accounts.
5. Unit Tests: The project comes with unit tests to validate the core functionalities.

## Technologies Used

1. Node.js - Backend framework for handling API requests.
2. Express - Web framework for building the API.
3. MySQL - Database for storing user and wallet data.
4. Jest - Unit testing framework used for testing core functionalities.
5. KnexJS - An SQL Object-Relational Mapping tool for Node.js.

## API Documentation

https://documenter.getpostman.com/view/15148492/2sAY5191Q2

## Installation

```bash
$ npm install
```

## Database Migration

```bash
$ npx run migration
```

## Running the app

```bash

# development: watch mode

$ npm run dev
```

## Test

```bash

# unit tests

$ npx jest
```
