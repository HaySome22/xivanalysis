# Install Dependencies

Download and install Node https://nodejs.org/en/

Navigate to inside `./xivanalysis`, open a terminal and run:

```
npm install --global pnpm
pnpm install
```

Open the `.env` file and enter your access token.

# Run

`pnpm run start`

Navigate to [localhost:3000](http://localhost:3000)

# Re-deployment

- `git reset --hard` -> undo all changes
- `git pull`
- `pnpm install` -> install dependencies
- Put key in `.env` file
- `pnpm run start-linux` -> starts frontend server
- `pnpm run server` in a separate terminal -> starts backend server
