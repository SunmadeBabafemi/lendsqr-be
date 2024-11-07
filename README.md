# lendsqr-be

db-diagram-link = https://dbdocs.io/babafemiolasunmade/lendsqr-ass-babafemi

## Description

[LendSQR](https://github.com/SunmadeBabafemi/lendsqr-be) a backend server for a mobile app that requires wallet functionality. This is needed as borrowers need a wallet to receive the loans they have been granted and also send the money for repayments.

1. User Signup with first_name, last_name, email, password, phone_number etc
2. user login with email and password
3. user account funding
4. user interwallet transfer
5. user wallet withdrawal

## API Documentation

https://documenter.getpostman.com/view/15148492/2sAY5191Q2

## Installation

```bash
$ npm install
```

## Database Migration

```bash
$ npx prisma migrate dev --name init
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
