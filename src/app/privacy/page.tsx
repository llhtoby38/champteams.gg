export const metadata = {
  title: 'Privacy Policy — ChampTeams.gg',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 prose prose-sm dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: April 14, 2026</p>

      <h2>1. Information We Collect</h2>
      <p>
        <strong>Account data:</strong> When you create an account, we collect your username and password (stored as a
        secure hash). Email is optional. If you sign in with Google, we receive your Google account ID, email, and
        display name.
      </p>
      <p>
        <strong>Team data:</strong> Pokemon teams you create, including species, moves, items, stat points, and any
        associated metadata (tags, descriptions).
      </p>
      <p>
        <strong>Usage data:</strong> Basic server logs (IP address, request timestamps) for security and abuse
        prevention. We do not use third-party analytics trackers.
      </p>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To provide and maintain the team builder service</li>
        <li>To save your teams and preferences across sessions</li>
        <li>To display published teams to other users (only if you choose to publish)</li>
        <li>To prevent abuse and maintain service security</li>
      </ul>

      <h2>3. Data Sharing</h2>
      <p>
        We do not sell, rent, or share your personal information with third parties. Published teams are visible to
        all users by design. We may disclose information if required by law.
      </p>

      <h2>4. Data Storage and Security</h2>
      <p>
        Your data is stored on secure servers hosted by Render (render.com). Passwords are hashed using bcrypt.
        We use HTTPS for all connections. While we take reasonable measures to protect your data, no system is
        100% secure.
      </p>

      <h2>5. Third-Party Services</h2>
      <ul>
        <li><strong>Google OAuth:</strong> If you choose to sign in with Google, Google&apos;s privacy policy applies to the
          authentication process. We only receive your basic profile information (name, email, account ID).</li>
        <li><strong>Pokemon Showdown CDN:</strong> Pokemon sprites are loaded from Showdown&apos;s servers.</li>
      </ul>

      <h2>6. Your Rights</h2>
      <p>You can:</p>
      <ul>
        <li>Update or delete your account information via the Profile page</li>
        <li>Delete your teams at any time</li>
        <li>Unpublish any published teams</li>
        <li>Request full account deletion by contacting us</li>
      </ul>

      <h2>7. Cookies</h2>
      <p>
        We use localStorage (not cookies) to store your session and preferences. No tracking cookies are used.
      </p>

      <h2>8. Children</h2>
      <p>
        ChampTeams.gg is not directed at children under 13. We do not knowingly collect information from children
        under 13.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update this policy from time to time. Changes will be posted on this page with an updated date.
      </p>

      <h2>10. Contact</h2>
      <p>
        For privacy-related questions, reach out via our{' '}
        <a href="https://github.com/llhtoby38/champteams.gg/issues" target="_blank" rel="noopener noreferrer">
          GitHub Issues
        </a>.
      </p>
    </div>
  );
}
