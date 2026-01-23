# Firebase Login Steps

## Important: Firebase Login is Interactive

Firebase CLI uses browser-based OAuth authentication. You need to run the login command yourself in your terminal.

## Steps to Login

### 1. Open your terminal and run:
```bash
firebase login
```

### 2. This will:
- Open your default browser
- Show a Firebase login page
- Ask you to sign in with your Google account

### 3. Use these credentials:
- **Email**: evgeny.r@melonad.io
- **Password**: GP7315Eq3x#E@&81*

### 4. After logging in:
- The browser will show "Firebase CLI Login Successful"
- You can close the browser
- Return to your terminal

### 5. Verify login:
```bash
firebase projects:list
```

You should see your Firebase projects listed.

## After Login - Deploy

Once logged in, run:

```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/frontend"
npm install
npm run build
firebase deploy --only hosting:af-affiliate-portal-b831d
```

## Alternative: Non-Interactive Login (for CI/CD)

If you need non-interactive login (for scripts), you can use:

```bash
firebase login:ci
```

This generates a token that can be used in scripts, but still requires initial browser authentication.

## Security Note

⚠️ **Never share your Firebase credentials in code or scripts!**
- The `firebase login` command handles authentication securely
- Credentials are stored in your system's secure credential store
- This is the recommended and secure way to authenticate
