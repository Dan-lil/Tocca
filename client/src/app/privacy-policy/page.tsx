"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import "./page.css";

type PolicySection = {
  title: string;
  body?: string;
  table?: Array<{
    label: string;
    value: string;
  }>;
};

const ruSections: PolicySection[] = [
  {
    title: "1. Общие положения",
    body: `Настоящая политика обработки персональных данных составлена в соответствии с требованиями Федерального закона от 27.07.2006 № 152-ФЗ "О персональных данных" и определяет порядок обработки персональных данных и меры по обеспечению безопасности персональных данных, предпринимаемые Tocca Beauty.

1.1. Оператор ставит своей целью соблюдение прав и свобод человека и гражданина при обработке его персональных данных, включая защиту прав на неприкосновенность частной жизни, личную и семейную тайну.
1.2. Настоящая политика применяется ко всей информации, которую Оператор может получить о посетителях веб-сайта https://tocca-beauty.ru/.`,
  },
  {
    title: "2. Основные понятия",
    body: `2.1. Автоматизированная обработка персональных данных - обработка персональных данных с помощью средств вычислительной техники.
2.2. Блокирование персональных данных - временное прекращение обработки персональных данных.
2.3. Веб-сайт - совокупность материалов, программ и баз данных, доступных по адресу https://tocca-beauty.ru/.
2.4. Персональные данные - любая информация, относящаяся прямо или косвенно к определенному Пользователю.
2.5. Обработка персональных данных - любое действие с персональными данными, включая сбор, запись, хранение, уточнение, использование, передачу, блокирование, удаление и уничтожение.
2.6. Оператор - лицо, организующее и/или осуществляющее обработку персональных данных.
2.7. Пользователь - любой посетитель веб-сайта https://tocca-beauty.ru/.`,
  },
  {
    title: "3. Права и обязанности Оператора",
    body: `3.1. Оператор имеет право получать от субъекта персональных данных достоверную информацию и документы, а также продолжить обработку персональных данных при наличии законных оснований.

3.2. Оператор обязан предоставлять субъекту персональных данных информацию об обработке его данных, организовывать обработку в соответствии с законодательством РФ, отвечать на обращения и запросы, принимать меры для защиты персональных данных и прекращать обработку в случаях, предусмотренных законом.`,
  },
  {
    title: "4. Права и обязанности субъектов персональных данных",
    body: `4.1. Субъекты персональных данных имеют право получать информацию об обработке персональных данных, требовать уточнения, блокирования или уничтожения данных, отзывать согласие на обработку и обжаловать действия или бездействие Оператора.

4.2. Субъекты персональных данных обязаны предоставлять Оператору достоверные данные о себе и сообщать об их изменении.`,
  },
  {
    title: "5. Принципы обработки персональных данных",
    body: `5.1. Обработка персональных данных осуществляется на законной и справедливой основе.
5.2. Обработка ограничивается достижением конкретных, заранее определенных и законных целей.
5.3. Не допускается обработка данных, несовместимая с целями их сбора.
5.4. Обрабатываются только персональные данные, необходимые для заявленных целей.
5.5. Хранение персональных данных осуществляется не дольше, чем этого требуют цели обработки, если иной срок не установлен законом.`,
  },
  {
    title: "6. Цели обработки персональных данных",
    table: [
      {
        label: "Цель обработки",
        value:
          "Предоставление Пользователю доступа к сервисам, информации и материалам веб-сайта.",
      },
      {
        label: "Персональные данные",
        value:
          "Фамилия, имя, отчество, электронный адрес, номер телефона, фотографии, адрес.",
      },
      {
        label: "Правовые основания",
        value: "Согласие Пользователя и документы Оператора.",
      },
      {
        label: "Виды обработки",
        value:
          "Сбор, запись, систематизация, накопление, хранение, уточнение, использование, удаление, уничтожение и обезличивание персональных данных.",
      },
    ],
  },
  {
    title: "7. Условия обработки персональных данных",
    body: `7.1. Обработка персональных данных осуществляется с согласия субъекта персональных данных.
7.2. Обработка может быть необходима для достижения целей, предусмотренных законом или договором.
7.3. Обработка может быть необходима для осуществления прав и законных интересов Оператора или третьих лиц.
7.4. Обработка общедоступных персональных данных осуществляется в случаях, предусмотренных законом.`,
  },
  {
    title: "8. Порядок сбора, хранения, передачи и обработки персональных данных",
    body: `Безопасность персональных данных обеспечивается путем реализации правовых, организационных и технических мер.

8.1. Оператор обеспечивает сохранность персональных данных и принимает меры, исключающие доступ неуполномоченных лиц.
8.2. Персональные данные Пользователя не передаются третьим лицам, кроме случаев, связанных с исполнением законодательства или договора.
8.3. Пользователь может актуализировать персональные данные, направив уведомление на адрес электронной почты Оператора: danlil656@mai.ru.
8.4. Пользователь может отозвать согласие на обработку персональных данных, направив уведомление на тот же адрес.
8.5. Оператор обеспечивает конфиденциальность персональных данных и хранит их не дольше, чем этого требуют цели обработки.`,
  },
  {
    title: "9. Действия с персональными данными",
    body: `Оператор осуществляет сбор, запись, систематизацию, накопление, хранение, уточнение, извлечение, использование, передачу, обезличивание, блокирование, удаление и уничтожение персональных данных. Обработка может осуществляться автоматизированным способом с передачей информации по сетям связи или без такой передачи.`,
  },
  {
    title: "10. Трансграничная передача персональных данных",
    body: `Оператор до начала трансграничной передачи персональных данных обязан выполнить требования законодательства РФ, включая уведомление уполномоченного органа при необходимости.`,
  },
  {
    title: "11. Конфиденциальность персональных данных",
    body: "Оператор и иные лица, получившие доступ к персональным данным, обязаны не раскрывать и не распространять персональные данные без согласия субъекта персональных данных, если иное не предусмотрено законом.",
  },
  {
    title: "12. Заключительные положения",
    body: `Пользователь может получить разъяснения по вопросам обработки персональных данных, обратившись к Оператору по электронной почте: danlil656@mai.ru.

В документе будут отражены любые изменения политики обработки персональных данных. Политика действует бессрочно до замены новой версией. Актуальная версия расположена по адресу https://tocca-beauty.ru/privacy-policy.`,
  },
];

const enSections: PolicySection[] = [
  {
    title: "1. General Provisions",
    body: `This personal data processing policy has been prepared in accordance with Federal Law No. 152-FZ "On Personal Data" dated July 27, 2006, and defines how Tocca Beauty processes personal data and protects it.

1.1. The Operator aims to respect human and civil rights and freedoms when processing personal data, including the rights to privacy, personal and family secrecy.
1.2. This policy applies to all information that the Operator may receive about visitors of https://tocca-beauty.ru/.`,
  },
  {
    title: "2. Key Terms",
    body: `2.1. Automated personal data processing means processing personal data using computing tools.
2.2. Blocking personal data means temporarily stopping personal data processing.
2.3. Website means the materials, software and databases available at https://tocca-beauty.ru/.
2.4. Personal data means any information directly or indirectly related to an identified User.
2.5. Processing personal data means any action with personal data, including collection, recording, storage, updating, use, transfer, blocking, deletion and destruction.
2.6. Operator means the person or entity that organizes and/or performs personal data processing.
2.7. User means any visitor of https://tocca-beauty.ru/.`,
  },
  {
    title: "3. Operator Rights and Obligations",
    body: `3.1. The Operator may receive accurate information and documents from a personal data subject and may continue processing personal data where permitted by law.

3.2. The Operator must provide information about personal data processing, organize processing in accordance with Russian law, respond to requests, protect personal data and stop processing where required by law.`,
  },
  {
    title: "4. Rights and Obligations of Personal Data Subjects",
    body: `4.1. Personal data subjects have the right to receive information about personal data processing, request correction, blocking or deletion of their data, withdraw consent and appeal actions or inaction of the Operator.

4.2. Personal data subjects must provide accurate data and inform the Operator of any changes.`,
  },
  {
    title: "5. Principles of Personal Data Processing",
    body: `5.1. Personal data is processed lawfully and fairly.
5.2. Processing is limited to specific, predetermined and lawful purposes.
5.3. Processing that is incompatible with the purposes of collection is not allowed.
5.4. Only personal data necessary for the stated purposes is processed.
5.5. Personal data is stored no longer than required by the purposes of processing, unless a different period is established by law.`,
  },
  {
    title: "6. Purposes of Personal Data Processing",
    table: [
      {
        label: "Purpose of processing",
        value:
          "Providing the User with access to the website services, information and materials.",
      },
      {
        label: "Personal data",
        value: "Full name, email address, phone number, photos and address.",
      },
      {
        label: "Legal basis",
        value: "User consent and the Operator's documents.",
      },
      {
        label: "Types of processing",
        value:
          "Collection, recording, organization, accumulation, storage, updating, use, deletion, destruction and anonymization of personal data.",
      },
    ],
  },
  {
    title: "7. Conditions for Personal Data Processing",
    body: `7.1. Personal data is processed with the consent of the personal data subject.
7.2. Processing may be necessary to achieve purposes provided by law or contract.
7.3. Processing may be necessary to exercise the rights and legitimate interests of the Operator or third parties.
7.4. Publicly available personal data is processed where permitted by law.`,
  },
  {
    title: "8. Collection, Storage, Transfer and Processing Procedure",
    body: `Personal data security is ensured through legal, organizational and technical measures.

8.1. The Operator protects personal data and takes measures to prevent unauthorized access.
8.2. The User's personal data is not transferred to third parties except where required by law or contract performance.
8.3. The User may update personal data by emailing the Operator at danlil656@mai.ru.
8.4. The User may withdraw consent to personal data processing by emailing the same address.
8.5. The Operator keeps personal data confidential and stores it no longer than required for the purposes of processing.`,
  },
  {
    title: "9. Actions Performed with Personal Data",
    body: `The Operator collects, records, organizes, accumulates, stores, updates, retrieves, uses, transfers, anonymizes, blocks, deletes and destroys personal data. Processing may be automated with or without data transfer over communication networks.`,
  },
  {
    title: "10. Cross-Border Transfer of Personal Data",
    body: `Before any cross-border transfer of personal data, the Operator must comply with Russian legal requirements, including notifying the authorized authority where required.`,
  },
  {
    title: "11. Confidentiality of Personal Data",
    body: "The Operator and other persons who gain access to personal data must not disclose or distribute personal data without the consent of the data subject, unless otherwise provided by law.",
  },
  {
    title: "12. Final Provisions",
    body: `The User may request clarification on personal data processing by contacting the Operator by email at danlil656@mai.ru.

Any changes to this personal data processing policy will be reflected in this document. The policy remains valid until replaced by a new version. The current version is available at https://tocca-beauty.ru/privacy-policy.`,
  },
];

export default function PrivacyPolicyPage() {
  const locale = useLocale();
  const commonT = useTranslations("common");
  const t = useTranslations("privacyPolicy");
  const sections = locale === "en" ? enSections : ruSections;

  return (
    <main className="privacy-policy-page">
      <div className="privacy-policy-shell">
        <Link className="privacy-policy-back" href="/">
          {commonT("backHome")}
        </Link>
        <h1>{t("title")}</h1>

        <div className="privacy-policy-content">
          {sections.map((section) => (
            <section className="privacy-policy-section" key={section.title}>
              <h2>{section.title}</h2>
              {section.table ? (
                <div className="privacy-policy-table">
                  {section.table.map((row) => (
                    <div key={row.label}>
                      <strong>{row.label}</strong>
                      <span>{row.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>{section.body}</p>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
