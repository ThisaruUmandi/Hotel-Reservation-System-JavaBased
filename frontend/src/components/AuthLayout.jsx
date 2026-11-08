import Photo from './Photo';

/** Photo on one side, form on the other. The photo is hidden on small screens. */
export default function AuthLayout({ title, intro, children, footer }) {
  return (
    <section className="auth">
      <Photo className="auth__photo" src="/images/about/story.jpg" alt="" ratio="auto" label="Photo" />
      <div className="auth__panel">
        <div className="auth__box">
          <h1>{title}</h1>
          {intro && <p className="muted" style={{ marginTop: 'var(--space-3)' }}>{intro}</p>}
          <div className="auth__form">{children}</div>
          {footer && <p className="auth__footer">{footer}</p>}
        </div>
      </div>
    </section>
  );
}
