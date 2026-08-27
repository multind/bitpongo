import type { LocaleKey } from '@/i18n';

export interface AgreementSection {
  title: string;
  paragraphs: string[];
}

export interface AgreementCopy {
  title: string;
  updated: string;
  intro: string;
  sections: AgreementSection[];
}

export const agreementCopy: Record<LocaleKey, AgreementCopy> = {
  'zh-cn': {
    title: '服务条款',
    updated: '最后更新：2026 年 8 月 25 日',
    intro: '本条款适用于你对 Bitpongo 的使用。创建账号或使用本服务即表示你同意本条款；如不同意，请勿使用 Bitpongo。',
    sections: [
      {
        title: '1. Bitpongo 提供的服务',
        paragraphs: [
          'Bitpongo 帮助你连接支持的交易所账号、创建自动定期买入策略、查看持仓，并选择接收 Bark 通知。Bitpongo 是软件工具，不是经纪商、托管机构、交易所或财务顾问。',
        ],
      },
      {
        title: '2. 账号与凭据',
        paragraphs: [
          '你应对自己的账号、密码、交易所 API 凭据、Bark 推送地址以及通过账号进行的所有活动负责。你只能连接自己有权控制的交易所账号。API Key 仅应授予交易所需的最小权限，且不得开启提现权限。',
        ],
      },
      {
        title: '3. 交易风险',
        paragraphs: [
          '数字资产交易具有高风险，可能造成部分或全部损失。自动订单可能受到价格变化、滑点、流动性、交易所规则、网络延迟、服务中断或策略设置错误的影响。Bitpongo 不保证订单一定执行，也不保证价格、可用性或收益。你有责任检查每项策略及其执行结果。',
        ],
      },
      {
        title: '4. 第三方服务',
        paragraphs: [
          'Binance、Bark 及其他连接服务由第三方运营，并适用其各自的条款和隐私政策。Bitpongo 无法控制其可用性和行为。你有责任遵守这些服务的规则以及对你适用的法律。',
        ],
      },
      {
        title: '5. 合理使用',
        paragraphs: [
          '你不得将 Bitpongo 用于违法活动、未经授权的访问、市场操纵、干扰服务、未经许可的安全测试，或绕过技术和账号限制。为保护用户、服务或满足合规要求，我们可能限制或终止访问。',
        ],
      },
      {
        title: '6. 数据与账号注销',
        paragraphs: [
          'Bitpongo 会在运行和保护服务所需的范围内处理账号资料、交易所凭据、策略数据和 Bark 设置。你可以在“账号设置”中申请注销账号。注销不可撤销；但为安全、争议处理或法律合规所需，有限记录可能继续保留。',
        ],
      },
      {
        title: '7. 服务可用性与责任',
        paragraphs: [
          '在法律允许的范围内，本服务按“现状”和“可用”基础提供。功能可能变更、暂停或终止。Bitpongo 不对交易损失、第三方故障、间接损失或超出合理控制范围的中断承担责任。',
        ],
      },
      {
        title: '8. 条款变更',
        paragraphs: [
          '我们可能随服务变化更新本条款，更新日期会显示在页面顶部。条款更新后继续使用 Bitpongo，即表示你接受修订后的条款。',
        ],
      },
    ],
  },
  'zh-tw': {
    title: '服務條款',
    updated: '最後更新：2026 年 8 月 25 日',
    intro: '本條款適用於你對 Bitpongo 的使用。建立帳號或使用本服務即表示你同意本條款；如不同意，請勿使用 Bitpongo。',
    sections: [
      {
        title: '1. Bitpongo 提供的服務',
        paragraphs: [
          'Bitpongo 協助你連線支援的交易所帳號、建立自動定期買入策略、查看持倉，並選擇接收 Bark 推播通知。Bitpongo 是軟體工具，不是經紀商、託管機構、交易所或財務顧問。',
        ],
      },
      {
        title: '2. 帳號與憑證',
        paragraphs: [
          '你應對自己的帳號、密碼、交易所 API 憑證、Bark 推播位址，以及透過帳號進行的所有活動負責。你只能連線自己有權控制的交易所帳號。API Key 僅應授予交易所需的最小權限，且不得開啟提領權限。',
        ],
      },
      {
        title: '3. 交易風險',
        paragraphs: [
          '數位資產交易具有高度風險，可能造成部分或全部損失。自動訂單可能受到價格變化、滑價、流動性、交易所規則、網路延遲、服務中斷或策略設定錯誤的影響。Bitpongo 不保證訂單一定執行，也不保證價格、可用性或收益。你有責任檢查每項策略及其執行結果。',
        ],
      },
      {
        title: '4. 第三方服務',
        paragraphs: [
          'Binance、Bark 及其他連線服務由第三方營運，並適用其各自的條款和隱私權政策。Bitpongo 無法控制其可用性和行為。你有責任遵守這些服務的規則及對你適用的法律。',
        ],
      },
      {
        title: '5. 合理使用',
        paragraphs: [
          '你不得將 Bitpongo 用於違法活動、未經授權的存取、市場操縱、干擾服務、未經許可的安全測試，或規避技術和帳號限制。為保護使用者、服務或滿足法令要求，我們可能限制或終止存取。',
        ],
      },
      {
        title: '6. 資料與帳號刪除',
        paragraphs: [
          'Bitpongo 會在營運和保護服務所需的範圍內處理帳號資料、交易所憑證、策略資料和 Bark 設定。你可以在「帳號設定」中申請刪除帳號。刪除不可撤銷；但為安全、爭議處理或法律遵循所需，有限紀錄可能繼續保留。',
        ],
      },
      {
        title: '7. 服務可用性與責任',
        paragraphs: [
          '在法律允許的範圍內，本服務按「現狀」及「可用」基礎提供。功能可能變更、暫停或終止。Bitpongo 不對交易損失、第三方故障、間接損失或超出合理控制範圍的中斷負責。',
        ],
      },
      {
        title: '8. 條款變更',
        paragraphs: [
          '我們可能隨服務變化更新本條款，更新日期會顯示在頁面頂部。條款更新後繼續使用 Bitpongo，即表示你接受修訂後的條款。',
        ],
      },
    ],
  },
  'en-us': {
    title: 'Terms of Service',
    updated: 'Last updated: August 25, 2026',
    intro:
      'These Terms govern your use of Bitpongo. By creating an account or using the service, you agree to them. If you do not agree, do not use Bitpongo.',
    sections: [
      {
        title: '1. What Bitpongo Does',
        paragraphs: [
          'Bitpongo helps you connect supported exchange accounts, create automated recurring-purchase strategies, view positions, and receive optional Bark notifications. Bitpongo is a software tool, not a broker, custodian, exchange, or financial adviser.',
        ],
      },
      {
        title: '2. Your Account and Credentials',
        paragraphs: [
          'You are responsible for your account, password, exchange API credentials, Bark push URL, and all activity performed through your account. Use only exchange accounts you are authorized to control. Grant API keys only the permissions needed for trading and do not enable withdrawals.',
        ],
      },
      {
        title: '3. Trading Risks',
        paragraphs: [
          'Digital-asset trading is highly risky and may result in partial or total loss. Automated orders may be affected by price changes, slippage, liquidity, exchange rules, network delays, outages, or incorrect strategy settings. Bitpongo does not guarantee order execution, prices, availability, or returns. You remain responsible for reviewing every strategy and its results.',
        ],
      },
      {
        title: '4. Third-Party Services',
        paragraphs: [
          "Binance, Bark, and other connected services are operated by third parties under their own terms and privacy policies. Their availability and actions are outside Bitpongo's control. You are responsible for complying with their rules and any laws that apply to you.",
        ],
      },
      {
        title: '5. Acceptable Use',
        paragraphs: [
          'You must not use Bitpongo for unlawful activity, unauthorized access, market abuse, service disruption, security testing without permission, or attempts to bypass technical or account restrictions. Access may be limited or terminated when necessary to protect users, the service, or legal compliance.',
        ],
      },
      {
        title: '6. Data and Account Deletion',
        paragraphs: [
          'Bitpongo processes account details, exchange credentials, strategy data, and Bark settings as needed to operate and secure the service. You may request account deletion in Account Settings. Deletion is irreversible, although limited records may be retained where required for security, dispute resolution, or legal compliance.',
        ],
      },
      {
        title: '7. Availability and Liability',
        paragraphs: [
          'The service is provided on an "as is" and "as available" basis to the extent permitted by law. Features may change, pause, or end. Bitpongo is not responsible for trading losses, third-party failures, indirect losses, or interruptions outside its reasonable control.',
        ],
      },
      {
        title: '8. Changes to These Terms',
        paragraphs: [
          'These Terms may be updated as the service changes. The updated date will appear at the top of this page. Continuing to use Bitpongo after an update means you accept the revised Terms.',
        ],
      },
    ],
  },
};
