export const metadata = {
  title: 'Terms of Service — ChampTeams.gg',
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 prose prose-sm dark:prose-invert">
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: April 14, 2026</p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using ChampTeams.gg, you agree to be bound by these Terms of Service. If you do not agree,
        do not use the service.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        ChampTeams.gg is a free, community-driven tool for building and sharing competitive Pokemon VGC teams for
        Pokemon Champions. The service includes a team builder, damage calculator, type coverage analysis, and
        community team sharing.
      </p>

      <h2>3. User Accounts</h2>
      <ul>
        <li>You are responsible for maintaining the security of your account credentials.</li>
        <li>You must not create accounts for the purpose of abuse, spam, or impersonation.</li>
        <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
      </ul>

      <h2>4. User Content</h2>
      <p>
        You retain ownership of the teams and content you create. By publishing a team, you grant ChampTeams.gg a
        non-exclusive license to display it to other users. You can unpublish or delete your content at any time.
      </p>
      <p>You must not publish content that is:</p>
      <ul>
        <li>Offensive, abusive, or harassing</li>
        <li>Spam or commercial advertising</li>
        <li>Infringing on intellectual property rights</li>
      </ul>

      <h2>5. Intellectual Property</h2>
      <p>
        Pokemon, Pokemon Champions, and related trademarks are property of Nintendo, The Pokemon Company, and Game
        Freak. ChampTeams.gg is a fan-made tool and is not affiliated with, endorsed by, or sponsored by these
        companies. Pokemon data is sourced from community projects (Smogon/Pokemon Showdown).
      </p>

      <h2>6. Availability</h2>
      <p>
        The service is provided &ldquo;as is&rdquo; without warranty. We do not guarantee uninterrupted availability. We may
        modify, suspend, or discontinue the service at any time without notice.
      </p>

      <h2>7. Limitation of Liability</h2>
      <p>
        ChampTeams.gg and its operators shall not be liable for any indirect, incidental, or consequential damages
        arising from your use of the service, including loss of data or teams.
      </p>

      <h2>8. Modifications</h2>
      <p>
        We may update these terms from time to time. Continued use of the service after changes constitutes
        acceptance of the updated terms.
      </p>

      <h2>9. Contact</h2>
      <p>
        For questions about these terms, reach out via our{' '}
        <a href="https://github.com/llhtoby38/champteams.gg/issues" target="_blank" rel="noopener noreferrer">
          GitHub Issues
        </a>.
      </p>
    </div>
  );
}
