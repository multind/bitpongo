<template>
  <main class="terms">
    <header class="terms__header">
      <p class="terms__brand">BITPONGO</p>
      <h1>Terms of Service</h1>
      <p class="terms__date">Last updated: August 25, 2026</p>
    </header>

    <p class="terms__intro">
      These Terms govern your use of Bitpongo. By creating an account or using the service, you agree to them. If you do not agree, do not
      use Bitpongo.
    </p>

    <section>
      <h2>1. What Bitpongo Does</h2>
      <p>
        Bitpongo helps you connect supported exchange accounts, create automated recurring-purchase strategies, view positions, and receive
        optional Bark notifications. Bitpongo is a software tool, not a broker, custodian, exchange, or financial adviser.
      </p>
    </section>

    <section>
      <h2>2. Your Account and Credentials</h2>
      <p>
        You are responsible for your account, password, exchange API credentials, Bark push URL, and all activity performed through your
        account. Use only exchange accounts you are authorized to control. Grant API keys only the permissions needed for trading and do not
        enable withdrawals.
      </p>
    </section>

    <section>
      <h2>3. Trading Risks</h2>
      <p>
        Digital-asset trading is highly risky and may result in partial or total loss. Automated orders may be affected by price changes,
        slippage, liquidity, exchange rules, network delays, outages, or incorrect strategy settings. Bitpongo does not guarantee order
        execution, prices, availability, or returns. You remain responsible for reviewing every strategy and its results.
      </p>
    </section>

    <section>
      <h2>4. Third-Party Services</h2>
      <p>
        Binance, Bark, and other connected services are operated by third parties under their own terms and privacy policies. Their
        availability and actions are outside Bitpongo's control. You are responsible for complying with their rules and any laws that apply
        to you.
      </p>
    </section>

    <section>
      <h2>5. Acceptable Use</h2>
      <p>
        You must not use Bitpongo for unlawful activity, unauthorized access, market abuse, service disruption, security testing without
        permission, or attempts to bypass technical or account restrictions. Access may be limited or terminated when necessary to protect
        users, the service, or legal compliance.
      </p>
    </section>

    <section>
      <h2>6. Data and Account Deletion</h2>
      <p>
        Bitpongo processes account details, exchange credentials, strategy data, and Bark settings as needed to operate and secure the
        service. You may request account deletion in Account Settings. Deletion is irreversible, although limited records may be retained
        where required for security, dispute resolution, or legal compliance.
      </p>
    </section>

    <section>
      <h2>7. Availability and Liability</h2>
      <p>
        The service is provided on an "as is" and "as available" basis to the extent permitted by law. Features may change, pause, or end.
        Bitpongo is not responsible for trading losses, third-party failures, indirect losses, or interruptions outside its reasonable
        control.
      </p>
    </section>

    <section>
      <h2>8. Changes to These Terms</h2>
      <p>
        These Terms may be updated as the service changes. The updated date will appear at the top of this page. Continuing to use Bitpongo
        after an update means you accept the revised Terms.
      </p>
    </section>
  </main>
</template>

<style scoped lang="scss">
  .terms {
    box-sizing: border-box;
    width: 100%;
    max-width: 48rem;
    min-height: 100%;
    padding: 1.5rem 1rem 2.5rem;
    margin: 0 auto;
    font-size: 0.9375rem;
    line-height: 1.65;
    color: #202124;
  }

  .terms__header {
    margin-bottom: 1.5rem;
  }

  .terms__brand {
    margin: 0 0 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #777;
    letter-spacing: 0.12em;
  }

  h1 {
    margin: 0;
    font-size: 1.75rem;
    line-height: 1.25;
    color: #111;
  }

  .terms__date {
    margin: 0.4rem 0 0;
    font-size: 0.8125rem;
    color: #777;
  }

  .terms__intro {
    margin: 0 0 1.75rem;
    color: #444;
  }

  section + section {
    margin-top: 1.5rem;
  }

  h2 {
    margin: 0 0 0.4rem;
    font-size: 1.0625rem;
    line-height: 1.4;
    color: #111;
  }

  p {
    margin: 0;
  }
</style>
