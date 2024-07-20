# Install Dependencies

Download and install Node https://nodejs.org/en/

Navigate to inside `./xivanalysis`, open a terminal and run:

```
npm install --global yarn
yarn
```

Open the `.env` file and enter your access token.

# Run

`yarn start`

Navigate to [localhost:3000](http://localhost:3000)

# Re-deployment

- `git reset --hard` -> undo all changes
- `git pull`
- `yarn` -> install dependencies
- Put key in `.env` file
- `yarn start-linux` -> starts frontend server
- `yarn server` in a separate terminal -> starts backend server
