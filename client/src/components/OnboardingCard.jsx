import React, { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import './ArtCard.css';
import './OnboardingCard.css';

function OnboardingCard({ card, active, setCardRef, handlers = {} }) {
  const onboarding = card.onboarding ?? {};
  const videoClassName = ['video', active ? 'active' : '', 'onboarding-card']
    .filter(Boolean)
    .join(' ');
  const credit = onboarding.credit || null;
  const [revealBackground, setRevealBackground] = useState(false);

  const backgroundStyle = useMemo(() => {
    const layers = [];
    if (onboarding.background) {
      layers.push(onboarding.background);
    }
    if (onboarding.backgroundImage) {
      layers.push(`url(${onboarding.backgroundImage})`);
    }
    if (!layers.length) {
      return {};
    }
    return {
      backgroundImage: layers.join(', '),
      backgroundSize: layers.map(() => 'cover').join(', '),
      backgroundPosition: layers.map(() => 'center').join(', '),
      backgroundRepeat: layers.map(() => 'no-repeat').join(', '),
    };
  }, [onboarding.background, onboarding.backgroundImage]);

  const handleAction = (cta) => {
    if (!cta) {
      return;
    }
    if (cta.action) {
      const fn = handlers[cta.action];
      if (typeof fn === 'function') {
        fn();
        return;
      }
    }
    if (cta.href) {
      window.open(cta.href, '_blank', 'noopener,noreferrer');
    }
  };

  const handleToggleReveal = () => {
    setRevealBackground((value) => !value);
  };

  const backgroundClassName = [
    'onboarding-background',
    revealBackground ? 'revealed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const overlayClassName = [
    'onboarding-overlay',
    revealBackground ? 'revealed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={videoClassName} ref={(node) => setCardRef?.(node)}>
      <div className="media-wrapper onboarding">
        <div
          className={backgroundClassName}
          style={backgroundStyle}
        />
        <div className={overlayClassName}>
          {credit?.label ? (
            <div className="onboarding-credit">
              <a
                className="onboarding-credit-link"
                href={credit.href || '#'}
                target="_blank"
                rel="noreferrer"
              >
                Background: {credit.label}
              </a>
              {onboarding.backgroundImage ? (
                <button
                  type="button"
                  className="onboarding-credit-toggle"
                  onClick={handleToggleReveal}
                  aria-pressed={revealBackground}
                  aria-label={
                    revealBackground
                      ? 'Réactiver le flou du fond'
                      : 'Afficher le fond en entier'
                  }
                >
                  <FontAwesomeIcon icon={revealBackground ? faEyeSlash : faEye} />
                </button>
              ) : null}
            </div>
          ) : null}
          {onboarding.badge ? (
            <span className="onboarding-badge">{onboarding.badge}</span>
          ) : null}
          <h2 className="onboarding-title">{onboarding.title}</h2>
          {onboarding.description ? (
            <p className="onboarding-description">{onboarding.description}</p>
          ) : null}
          {Array.isArray(onboarding.chips) && onboarding.chips.length ? (
            <div className="onboarding-chips">
              {onboarding.chips.map((chip) => (
                <span key={chip} className="onboarding-chip">
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
          {onboarding.illustration ? (
            <div className="onboarding-illustration">
              <img
                src={onboarding.illustration}
                alt={onboarding.illustrationAlt || onboarding.title}
              />
            </div>
          ) : null}
        </div>
      </div>
      <div className="bottom-controls onboarding">
        <div className="onboarding-footer">
          {onboarding.tip ? (
            <p className="onboarding-tip">
              {onboarding.tip}
              {onboarding.tipLink ? (
                <>
                  {' '}
                  <a
                    className="onboarding-tip-link"
                    href={onboarding.tipLink.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {onboarding.tipLink.label}
                  </a>
                </>
              ) : null}
            </p>
          ) : null}
          {Array.isArray(onboarding.ctas) && onboarding.ctas.length ? (
            <div className="onboarding-ctas">
              {onboarding.ctas.map((cta) => (
                <button
                  key={cta.label}
                  type="button"
                  className={`onboarding-cta ${cta.variant || 'primary'}`}
                  onClick={() => handleAction(cta)}
                >
                  {cta.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default OnboardingCard;
