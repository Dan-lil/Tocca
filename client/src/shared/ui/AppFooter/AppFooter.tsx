import Link from "next/link";
import { useTranslations } from "next-intl";

export default function AppFooter() {
  const t = useTranslations("privacyPolicy");

  return (
    <footer className="site-footer">
      <div className="site-footer-shell glass-surface">
        <p className="site-footer-copy">
          Tocca
        </p>
        <Link className="site-footer-link" href="/privacy-policy">
          {t("footerLink")}
        </Link>
      </div>
    </footer>
  );
}
