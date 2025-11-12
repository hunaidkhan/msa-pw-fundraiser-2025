# Admin API Documentation

## Team Deletion Endpoint

### DELETE `/api/admin/teams/[slug]`

Deletes a team by its slug. This endpoint requires admin authentication.

#### Authentication

Add the `x-admin-api-key` header with your admin API key:

```bash
x-admin-api-key: your-secure-admin-api-key-here
```

#### Setup

1. Add `ADMIN_API_KEY` to your `.env.local` file:
   ```
   ADMIN_API_KEY=your-secure-admin-api-key-here
   ```

2. Generate a secure random string for production. You can use:
   ```bash
   # Generate a secure random key (Unix/Mac)
   openssl rand -hex 32

   # Or use Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. For Vercel deployment, add the environment variable in your project settings.

#### Usage Example

```bash
# Delete a team
curl -X DELETE https://your-domain.com/api/admin/teams/team-slug \
  -H "x-admin-api-key: your-secure-admin-api-key-here"
```

#### Response

**Success (200):**
```json
{
  "ok": true,
  "message": "Team deleted successfully.",
  "slug": "team-slug"
}
```

**Unauthorized (401):**
```json
{
  "error": "Unauthorized. Valid admin API key required."
}
```

**Not Found (404):**
```json
{
  "error": "Team not found."
}
```

## Security Notes

- The admin API key is required for all DELETE operations
- If `ADMIN_API_KEY` is not configured, all delete requests will be denied
- Keep your admin API key secret and never commit it to version control
- Use strong, randomly generated keys in production
