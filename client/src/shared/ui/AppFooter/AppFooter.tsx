import Link from "next/link";

export default function AppFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-shell glass-surface">
        <p className="site-footer-copy">
          Tocca
        </p>
        <Link className="site-footer-link" href="/privacy-policy">
          Политика обработки персональных данных
        </Link>
      </div>
    </footer>
  );
}
