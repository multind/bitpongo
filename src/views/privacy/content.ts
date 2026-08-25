import type { LocaleKey } from '@/i18n';

export interface PrivacySection {
  title: string;
  paragraphs: string[];
  items?: string[];
}

export interface PrivacyCopy {
  title: string;
  updated: string;
  intro: string;
  sections: PrivacySection[];
  contactTitle: string;
  contactText: string;
  contactLabel: string;
}

export const privacyCopy: Record<LocaleKey, PrivacyCopy> = {
  'zh-cn': {
    title: '隐私政策',
    updated: '最后更新：2026 年 8 月 26 日',
    intro: '本隐私政策说明 Bitpongo 在你使用账户、自动化策略、交易所连接和通知功能时如何收集、使用、保存和保护信息。',
    sections: [
      {
        title: '1. 我们收集的信息',
        paragraphs: ['为了提供服务，我们可能收集和处理以下信息：'],
        items: [
          '账户信息：用户名、电子邮件地址、用户 ID 和经过哈希处理的密码。',
          '交易所连接信息：交易所名称、AccessKey、SecretKey，以及交易所要求的密码或口令。',
          '策略与财务信息：策略设置、资产配置、余额、持仓、订单和执行结果。',
          '通知信息：Bark 推送地址、通知偏好和发送结果。',
          '技术信息：为保障安全、诊断故障和维护服务所需的请求记录、错误记录及有限的网络信息。',
        ],
      },
      {
        title: '2. 信息的使用方式',
        paragraphs: [
          '我们仅将这些信息用于创建和管理账户、连接你授权的交易所、执行策略、展示持仓和订单、发送通知、提供客户支持，以及保障和改进服务。',
          'Bitpongo 不出售个人信息，不展示第三方广告，也不将信息用于跨 App 或跨网站跟踪。',
        ],
      },
      {
        title: '3. 交易所凭据与第三方服务',
        paragraphs: [
          '交易所 API 凭据会发送到 Bitpongo 服务端并保存，以便按照你的设置访问交易所和执行指令。界面会对凭据进行遮罩显示。请只授予交易所 API 交易所需的最小权限，并始终关闭提现权限。',
          '当你启用相关功能时，我们会根据你的指令向 Binance、Bark 或其他已连接服务传输完成请求所必需的数据。这些第三方依据各自的条款和隐私政策处理信息。',
        ],
      },
      {
        title: '4. 信息共享',
        paragraphs: [
          '除向你选择的交易所和通知服务发送必要数据外，我们可能与提供服务器、数据库、安全或运维支持的服务商共享履行服务所必需的信息。我们也可能在法律要求、保护用户与服务安全或处理合法争议时披露有限信息。',
        ],
      },
      {
        title: '5. 保存与删除',
        paragraphs: [
          '我们通常在账户存续期间保存提供服务所需的信息。你可以在“账号设置”中注销账号；注销后，账户及相关业务数据将按系统流程删除。为满足安全、备份恢复、争议处理或法律义务，有限记录可能在必要期限内继续保留。',
        ],
      },
      {
        title: '6. 信息安全',
        paragraphs: [
          '我们采用访问控制、密码哈希、凭据遮罩和其他合理的技术与组织措施保护信息。不过，任何网络传输或存储方式都无法保证绝对安全。',
        ],
      },
      {
        title: '7. 你的选择与权利',
        paragraphs: [
          '你可以在 App 中查看或更新部分账户、交易所和通知设置，并可通过“账号设置”注销账户。如需访问、更正或删除其他信息，请通过本政策末尾的联系方式联系我们。',
        ],
      },
      {
        title: '8. 年龄要求',
        paragraphs: ['Bitpongo 面向年满 18 周岁的用户，不面向儿童提供服务，也不会有意收集儿童的个人信息。'],
      },
      {
        title: '9. 政策更新',
        paragraphs: ['我们可能随服务或法律要求的变化更新本政策。更新后的版本会在本页面标注新的生效日期。'],
      },
    ],
    contactTitle: '10. 联系我们',
    contactText: '如果你对本政策或个人信息处理有疑问，请通过 Multind 网站联系我们：',
    contactLabel: 'https://multind.com',
  },
  'zh-tw': {
    title: '隱私權政策',
    updated: '最後更新：2026 年 8 月 26 日',
    intro: '本隱私權政策說明 Bitpongo 在你使用帳戶、自動化策略、交易所連線和通知功能時，如何蒐集、使用、保存及保護資訊。',
    sections: [
      {
        title: '1. 我們蒐集的資訊',
        paragraphs: ['為了提供服務，我們可能蒐集和處理以下資訊：'],
        items: [
          '帳戶資訊：使用者名稱、電子郵件地址、使用者 ID 和經過雜湊處理的密碼。',
          '交易所連線資訊：交易所名稱、AccessKey、SecretKey，以及交易所要求的密碼或口令。',
          '策略與財務資訊：策略設定、資產配置、餘額、持倉、訂單和執行結果。',
          '通知資訊：Bark 推播位址、通知偏好和傳送結果。',
          '技術資訊：為保障安全、診斷故障和維護服務所需的請求紀錄、錯誤紀錄及有限的網路資訊。',
        ],
      },
      {
        title: '2. 資訊的使用方式',
        paragraphs: [
          '我們僅將這些資訊用於建立和管理帳戶、連線你授權的交易所、執行策略、顯示持倉與訂單、傳送通知、提供客戶支援，以及保障和改善服務。',
          'Bitpongo 不出售個人資訊、不顯示第三方廣告，也不將資訊用於跨 App 或跨網站追蹤。',
        ],
      },
      {
        title: '3. 交易所憑證與第三方服務',
        paragraphs: [
          '交易所 API 憑證會傳送到 Bitpongo 伺服器並保存，以便依照你的設定存取交易所和執行指令。介面會遮罩顯示憑證。請只授予交易所 API 交易所需的最小權限，並始終關閉提領權限。',
          '當你啟用相關功能時，我們會依照你的指令向 Binance、Bark 或其他已連線服務傳輸完成請求所必需的資料。這些第三方依據各自的條款和隱私權政策處理資訊。',
        ],
      },
      {
        title: '4. 資訊分享',
        paragraphs: [
          '除向你選擇的交易所和通知服務傳送必要資料外，我們可能與提供伺服器、資料庫、安全或維運支援的服務商分享履行服務所必需的資訊。我們也可能在法律要求、保護使用者與服務安全或處理合法爭議時揭露有限資訊。',
        ],
      },
      {
        title: '5. 保存與刪除',
        paragraphs: [
          '我們通常在帳戶存續期間保存提供服務所需的資訊。你可以在「帳號設定」中刪除帳號；刪除後，帳戶及相關業務資料將依系統流程刪除。為滿足安全、備份復原、爭議處理或法律義務，有限紀錄可能在必要期限內繼續保留。',
        ],
      },
      {
        title: '6. 資訊安全',
        paragraphs: [
          '我們採用存取控制、密碼雜湊、憑證遮罩和其他合理的技術與組織措施保護資訊。不過，任何網路傳輸或儲存方式都無法保證絕對安全。',
        ],
      },
      {
        title: '7. 你的選擇與權利',
        paragraphs: [
          '你可以在 App 中查看或更新部分帳戶、交易所和通知設定，並可透過「帳號設定」刪除帳號。如需存取、更正或刪除其他資訊，請透過本政策末尾的聯絡方式與我們聯絡。',
        ],
      },
      {
        title: '8. 年齡要求',
        paragraphs: ['Bitpongo 面向年滿 18 歲的使用者，不向兒童提供服務，也不會有意蒐集兒童的個人資訊。'],
      },
      {
        title: '9. 政策更新',
        paragraphs: ['我們可能隨服務或法律要求的變化更新本政策。更新後的版本會在本頁面標示新的生效日期。'],
      },
    ],
    contactTitle: '10. 聯絡我們',
    contactText: '如果你對本政策或個人資訊處理有疑問，請透過 Multind 網站與我們聯絡：',
    contactLabel: 'https://multind.com',
  },
  'en-us': {
    title: 'Privacy Policy',
    updated: 'Last updated: August 26, 2026',
    intro:
      'This Privacy Policy explains how Bitpongo collects, uses, retains, and protects information when you use accounts, automated strategies, exchange connections, and notifications.',
    sections: [
      {
        title: '1. Information We Collect',
        paragraphs: ['We may collect and process the following information to provide the service:'],
        items: [
          'Account information, including your username, email address, user ID, and hashed password.',
          'Exchange connection information, including the exchange name, AccessKey, SecretKey, and any password or passphrase required by the exchange.',
          'Strategy and financial information, including strategy settings, asset allocations, balances, positions, orders, and execution results.',
          'Notification information, including your Bark push URL, notification preferences, and delivery results.',
          'Technical information, including request records, error records, and limited network information needed for security, troubleshooting, and service maintenance.',
        ],
      },
      {
        title: '2. How We Use Information',
        paragraphs: [
          'We use this information only to create and manage accounts, connect exchanges you authorize, execute strategies, display positions and orders, send notifications, provide support, and protect and improve the service.',
          'Bitpongo does not sell personal information, show third-party advertising, or use information to track you across apps or websites.',
        ],
      },
      {
        title: '3. Exchange Credentials and Third-Party Services',
        paragraphs: [
          'Your exchange API credentials are transmitted to and retained by the Bitpongo server so it can access the exchange and carry out your instructions. Credentials are masked in the interface. Grant only the minimum API permissions needed for trading and always disable withdrawal permissions.',
          'When you enable a connected feature, we send the data needed to complete your request to Binance, Bark, or another service you select. Those third parties process information under their own terms and privacy policies.',
        ],
      },
      {
        title: '4. Sharing Information',
        paragraphs: [
          'In addition to the exchanges and notification services you select, we may share information necessary to operate the service with providers that support hosting, databases, security, or operations. We may also disclose limited information when required by law, to protect users and the service, or to resolve a lawful dispute.',
        ],
      },
      {
        title: '5. Retention and Deletion',
        paragraphs: [
          'We generally retain information needed to provide the service while your account is active. You can delete your account in Account Settings. Account and related service data are then deleted through our system process. Limited records may remain for a necessary period for security, backup recovery, dispute resolution, or legal obligations.',
        ],
      },
      {
        title: '6. Security',
        paragraphs: [
          'We use access controls, password hashing, credential masking, and other reasonable technical and organizational safeguards. No method of network transmission or storage can be guaranteed to be completely secure.',
        ],
      },
      {
        title: '7. Your Choices and Rights',
        paragraphs: [
          'You can review or update certain account, exchange, and notification settings in the app and delete your account through Account Settings. To request access to, correction of, or deletion of other information, contact us using the details below.',
        ],
      },
      {
        title: '8. Age Requirement',
        paragraphs: [
          'Bitpongo is intended for users who are at least 18 years old. It is not directed to children, and we do not knowingly collect personal information from children.',
        ],
      },
      {
        title: '9. Changes to This Policy',
        paragraphs: [
          'We may update this policy as the service or legal requirements change. The updated version will show a new effective date on this page.',
        ],
      },
    ],
    contactTitle: '10. Contact Us',
    contactText: 'If you have questions about this policy or how personal information is handled, contact us through the Multind website:',
    contactLabel: 'https://multind.com',
  },
};
